"""
Folha de pagamento service:
- INSS progressivo por faixas
- IRRF progressivo por faixas
- Geração de CNAB 240 FEBRABAN
"""
import io
import logging
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.parametros import TabelaINSS, TabelaIRRF
from app.models.folha import Folha, ItemFolha, Funcionario, StatusFolhaEnum

logger = logging.getLogger(__name__)


async def buscar_faixas_inss(db: AsyncSession, referencia: date) -> List[TabelaINSS]:
    result = await db.execute(
        select(TabelaINSS)
        .where(
            TabelaINSS.vigencia_inicio <= referencia,
            (TabelaINSS.vigencia_fim == None) | (TabelaINSS.vigencia_fim >= referencia),
        )
        .order_by(TabelaINSS.faixa_min)
    )
    return result.scalars().all()


async def buscar_faixas_irrf(db: AsyncSession, referencia: date) -> List[TabelaIRRF]:
    result = await db.execute(
        select(TabelaIRRF)
        .where(
            TabelaIRRF.vigencia_inicio <= referencia,
            (TabelaIRRF.vigencia_fim == None) | (TabelaIRRF.vigencia_fim >= referencia),
        )
        .order_by(TabelaIRRF.faixa_min)
    )
    return result.scalars().all()


def calc_inss(salario_bruto: Decimal, faixas: List[TabelaINSS]) -> Decimal:
    """Calcula INSS com alíquotas progressivas por faixas."""
    if not faixas:
        # fallback: tabela 2024 simplificada
        faixas_default = [
            (Decimal("0"), Decimal("1412.00"), Decimal("0.075")),
            (Decimal("1412.01"), Decimal("2666.68"), Decimal("0.09")),
            (Decimal("2666.69"), Decimal("4000.03"), Decimal("0.12")),
            (Decimal("4000.04"), Decimal("7786.02"), Decimal("0.14")),
        ]
        total = Decimal("0")
        for fmin, fmax, aliq in faixas_default:
            if salario_bruto <= fmin:
                break
            teto = min(salario_bruto, fmax)
            total += (teto - fmin) * aliq
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    total = Decimal("0")
    for faixa in faixas:
        fmin = Decimal(str(faixa.faixa_min))
        if salario_bruto <= fmin:
            break
        fmax = Decimal(str(faixa.faixa_max)) if faixa.faixa_max else salario_bruto
        teto = min(salario_bruto, fmax)
        total += (teto - fmin) * Decimal(str(faixa.aliquota))

    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calc_irrf(base_calculo: Decimal, faixas: List[TabelaIRRF]) -> Decimal:
    """Calcula IRRF progressivo. base_calculo = salário_bruto - INSS."""
    if not faixas:
        # fallback: tabela 2024
        faixas_default = [
            (Decimal("0"), Decimal("2259.20"), Decimal("0"), Decimal("0")),
            (Decimal("2259.21"), Decimal("2826.65"), Decimal("0.075"), Decimal("169.44")),
            (Decimal("2826.66"), Decimal("3751.05"), Decimal("0.15"), Decimal("381.44")),
            (Decimal("3751.06"), Decimal("4664.68"), Decimal("0.225"), Decimal("662.77")),
            (Decimal("4664.69"), None, Decimal("0.275"), Decimal("896.00")),
        ]
        for fmin, fmax, aliq, deducao in faixas_default:
            if fmax is None or base_calculo <= fmax:
                if base_calculo > fmin:
                    irrf = base_calculo * aliq - deducao
                    return max(irrf, Decimal("0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return Decimal("0")

    for faixa in sorted(faixas, key=lambda f: f.faixa_min, reverse=True):
        fmin = Decimal(str(faixa.faixa_min))
        fmax = Decimal(str(faixa.faixa_max)) if faixa.faixa_max else None
        aliq = Decimal(str(faixa.aliquota))
        deducao = Decimal(str(faixa.deducao))

        if base_calculo > fmin and (fmax is None or base_calculo <= fmax):
            irrf = base_calculo * aliq - deducao
            return max(irrf, Decimal("0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return Decimal("0")


async def calcular_item_folha(
    db: AsyncSession,
    item: ItemFolha,
    competencia: str,
) -> ItemFolha:
    """Calcula INSS e IRRF para um item de folha."""
    ref_date = date(int(competencia[:4]), int(competencia[5:7]), 1)
    faixas_inss = await buscar_faixas_inss(db, ref_date)
    faixas_irrf = await buscar_faixas_irrf(db, ref_date)

    salario = Decimal(str(item.salario_base))
    outras = Decimal("0")
    if item.outras_verbas:
        for v in item.outras_verbas.values():
            outras += Decimal(str(v))
    horas_extras = Decimal(str(item.horas_extras))
    adicionais_total = Decimal("0")
    if item.adicionais:
        for v in item.adicionais.values():
            adicionais_total += Decimal(str(v))

    valor_bruto = salario + outras + horas_extras + adicionais_total

    inss = calc_inss(valor_bruto, faixas_inss)
    base_irrf = valor_bruto - inss
    irrf = calc_irrf(base_irrf, faixas_irrf)

    outros_desc = Decimal("0")
    if item.outros_descontos:
        for v in item.outros_descontos.values():
            outros_desc += Decimal(str(v))

    total_descontos = inss + irrf + outros_desc
    valor_liquido = valor_bruto - total_descontos

    item.valor_bruto = valor_bruto
    item.inss_funcionario = inss
    item.irrf = irrf
    item.total_descontos = total_descontos
    item.valor_liquido = valor_liquido

    return item


# ── CNAB 240 ─────────────────────────────────────────────────────────────────

BANCOS = {
    "237": "BRADESCO",
    "341": "ITAU",
    "001": "BB",
    "104": "CAIXA",
    "033": "SANTANDER",
}


def _campo(valor: str, tamanho: int, alinhamento: str = "E", preenchimento: str = " ") -> str:
    """Formata campo de tamanho fixo."""
    if alinhamento == "E":
        return valor[:tamanho].ljust(tamanho, preenchimento)
    else:
        return valor[:tamanho].rjust(tamanho, preenchimento)


def _campo_num(valor: int | str, tamanho: int) -> str:
    return str(valor)[:tamanho].rjust(tamanho, "0")


def _decimal_sem_virgula(valor: Decimal, tamanho: int, decimais: int = 2) -> str:
    cents = int((valor * (10 ** decimais)).quantize(Decimal("1")))
    return str(cents).rjust(tamanho, "0")[:tamanho]


def gerar_cnab240(
    folha: Folha,
    itens: List[Tuple[ItemFolha, Funcionario]],
    empresa_nome: str,
    empresa_cnpj: str,
    empresa_agencia: str,
    empresa_conta: str,
    banco_codigo: str,
    data_pagamento: date,
) -> bytes:
    """
    Gera arquivo CNAB 240 FEBRABAN padrão.
    Suporta: Bradesco(237), Itaú(341), BB(001), Caixa(104), Santander(033)
    """
    linhas = []
    banco = _campo_num(banco_codigo, 3)
    data_pg = data_pagamento.strftime("%d%m%Y")
    data_geracao = datetime.now().strftime("%d%m%Y")
    hora_geracao = datetime.now().strftime("%H%M%S")

    # ── Header de Arquivo (posições fixas FEBRABAN) ──────────────────────────
    header_arquivo = (
        banco +                          # 001-003  Banco
        _campo_num(0, 4) +               # 004-007  Lote (header=0000)
        "0" +                            # 008      Registro
        " " * 9 +                        # 009-017  Brancos
        "2" +                            # 018      Tipo inscrição (2=CNPJ)
        _campo_num(empresa_cnpj.replace(".", "").replace("/", "").replace("-", ""), 14) +
        " " * 20 +                       # 033-052  Convênio
        _campo_num(empresa_agencia, 5) +
        " " +                            # 058      Dígito agência
        _campo_num(empresa_conta.replace("-", ""), 12) +
        " " +                            # 071      Dígito conta
        " " +                            # 072      Dígito ag+conta
        _campo("", 30) +                 # 073-102  Nome empresa
        _campo(f"CNAB 240 {BANCOS.get(banco_codigo, banco_codigo)}", 30) +
        " " * 10 +                       # 133-142  Código remessa
        data_geracao +                   # 143-150  Data geração
        hora_geracao +                   # 151-156  Hora geração
        _campo_num(1, 6) +               # 157-162  Sequencial
        "030" +                          # 163-165  Versão layout
        _campo_num(0, 5) +               # 166-170  Densidade
        " " * 20 +                       # 171-190  Reservado banco
        " " * 29 +                       # 191-219  Reservado empresa
        " " * 10                         # 220-240  Brancos
    )
    linhas.append(header_arquivo[:240])

    # ── Lote (um lote por banco/tipo pagamento) ──────────────────────────────
    lote_num = 1
    header_lote = (
        banco +                          # 001-003
        _campo_num(lote_num, 4) +        # 004-007  Número lote
        "1" +                            # 008      Header lote
        "C" +                            # 009      Tipo operação (C=crédito)
        "20" +                           # 010-011  Tipo serviço (20=folha)
        "00" +                           # 012-013  Forma lançamento
        "030" +                          # 014-016  Versão layout lote
        " " +                            # 017      Brancos
        "2" +                            # 018      Tipo inscrição empresa
        _campo_num(empresa_cnpj.replace(".", "").replace("/", "").replace("-", ""), 14) +
        " " * 20 +                       # 033-052  Convênio
        _campo_num(empresa_agencia, 5) +
        " " +
        _campo_num(empresa_conta.replace("-", ""), 12) +
        " " +
        " " +
        _campo(empresa_nome, 30) +       # 073-102
        " " * 40 +                       # 103-142  Informação 1
        " " * 40 +                       # 143-182  Informação 2
        _campo_num(0, 8) +               # 183-190  Número remessa
        data_geracao +                   # 191-198  Data gravação
        " " * 8 +                        # 199-206  Data crédito (no trailer)
        " " * 33 +                       # 207-240  Brancos
        " "
    )
    linhas.append(header_lote[:240])

    registros_lote = 0
    total_valor = Decimal("0")

    for seq, (item, func) in enumerate(itens, start=1):
        # Segmento A
        seg_a = (
            banco +
            _campo_num(lote_num, 4) +
            "3" +                        # Detalhe
            _campo_num(seq * 2 - 1, 5) +  # Sequencial registro
            "A" +                        # Segmento
            "0" +                        # Tipo movimento
            "00" +                       # Instrução movimento
            _campo_num(func.banco or "000", 3) +  # Banco favorecido
            _campo_num(func.agencia or "0", 5) +
            " " +                        # Dígito agência
            _campo_num((func.conta or "0").replace("-", ""), 12) +
            " " +                        # Dígito conta
            " " +                        # Dígito ag+conta
            _campo(func.nome, 30) +      # Nome favorecido
            " " * 20 +                   # Número documento
            data_pg +                    # Data pagamento
            "BRL" +                      # Moeda
            _campo_num(0, 15) +          # Quantidade moeda
            _decimal_sem_virgula(item.valor_liquido, 15) +  # Valor pagamento
            " " * 20 +                   # Nosso número
            " " * 8 +                    # Data real pagamento
            _decimal_sem_virgula(item.valor_liquido, 15) +  # Valor real pagamento
            " " * 25 +                   # Informação 2
            " " * 2 +                    # Finalidade DOC/TED
            " " * 2 +                    # Finalidade complementar
            " " * 3 +                    # Brancos
            "0" +                        # Aviso
            " " * 9                      # Ocorrências
        )
        linhas.append(seg_a[:240])
        registros_lote += 1

        # Segmento B
        cpf_num = func.cpf.replace(".", "").replace("-", "")
        seg_b = (
            banco +
            _campo_num(lote_num, 4) +
            "3" +
            _campo_num(seq * 2, 5) +     # Sequencial
            "B" +                        # Segmento
            " " +                        # Brancos
            "1" +                        # Tipo inscrição (1=CPF)
            _campo_num(cpf_num, 14) +    # CPF favorecido
            " " * 30 +                   # Logradouro
            " " * 5 +                    # Número
            " " * 15 +                   # Complemento
            " " * 20 +                   # Bairro
            " " * 20 +                   # Cidade
            " " * 8 +                    # CEP
            " " * 2 +                    # UF
            _decimal_sem_virgula(item.valor_liquido, 15) +  # Valor pagamento
            _decimal_sem_virgula(Decimal("0"), 15) +         # Valor abatimento
            _decimal_sem_virgula(Decimal("0"), 15) +         # Valor desconto
            _decimal_sem_virgula(Decimal("0"), 15) +         # Valor mora
            _decimal_sem_virgula(Decimal("0"), 15) +         # Valor multa
            " " * 15 +                   # Código/doc favorecido
            " " +                        # Aviso
            " " * 8 +                    # Brancos
            " " * 9                      # Ocorrências
        )
        linhas.append(seg_b[:240])
        registros_lote += 1
        total_valor += item.valor_liquido

    # Trailer de Lote
    trailer_lote = (
        banco +
        _campo_num(lote_num, 4) +
        "5" +                            # Trailer lote
        " " * 9 +
        _campo_num(registros_lote + 2, 6) +  # Qtd registros (+ header + trailer)
        _decimal_sem_virgula(total_valor, 18) +
        _campo_num(0, 18) +              # Qtd moeda
        " " * 5 +
        data_pg +                        # Data crédito
        " " * 117 +
        " " * 9
    )
    linhas.append(trailer_lote[:240])

    # Trailer de Arquivo
    total_registros = len(linhas) + 1  # +1 for this trailer
    trailer_arquivo = (
        banco +
        _campo_num(9999, 4) +
        "9" +
        " " * 9 +
        _campo_num(1, 6) +               # Qtd lotes
        _campo_num(total_registros, 6) + # Qtd registros
        _campo_num(0, 6) +               # Qtd contas
        " " * 205 +
        " " * 3
    )
    linhas.append(trailer_arquivo[:240])

    content = "\r\n".join(linhas) + "\r\n"
    return content.encode("ascii", errors="replace")
