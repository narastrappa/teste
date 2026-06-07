"""Folhas de pagamento endpoints."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import get_current_user, require_rh, require_gestor
from app.models.folha import Folha, ItemFolha, Funcionario, StatusFolhaEnum
from app.schemas.folha import (
    FolhaCreate, FolhaOut, ItemFolhaCreate, ItemFolhaOut,
    CalculoFolhaResponse, CNABResponse,
)

router = APIRouter(prefix="/api/folhas", tags=["folhas"])


@router.post("", response_model=FolhaOut, status_code=status.HTTP_201_CREATED)
async def criar_folha(
    payload: FolhaCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh()),
):
    # Enforce unique (competencia, sufixo_revisao)
    result = await db.execute(
        select(Folha).where(
            Folha.competencia == payload.competencia,
            Folha.sufixo_revisao == payload.sufixo_revisao,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Folha já existe para competência {payload.competencia} revisão {payload.sufixo_revisao}",
        )

    folha = Folha(
        competencia=payload.competencia,
        sufixo_revisao=payload.sufixo_revisao,
        created_by=current_user.id,
    )
    db.add(folha)
    await db.flush()
    await db.refresh(folha)
    return FolhaOut.model_validate(folha)


@router.post("/{folha_id}/itens/{funcionario_id}", response_model=ItemFolhaOut)
async def adicionar_item(
    folha_id: uuid.UUID,
    funcionario_id: uuid.UUID,
    payload: ItemFolhaCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh()),
):
    result = await db.execute(select(Folha).where(Folha.id == folha_id))
    folha = result.scalar_one_or_none()
    if not folha:
        raise HTTPException(status_code=404, detail="Folha não encontrada")

    if folha.status != StatusFolhaEnum.rascunho:
        raise HTTPException(status_code=409, detail="Folha não está em rascunho")

    result = await db.execute(select(Funcionario).where(Funcionario.id == funcionario_id))
    func = result.scalar_one_or_none()
    if not func or not func.ativo:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado ou inativo")

    # Check if item already exists
    result = await db.execute(
        select(ItemFolha).where(
            ItemFolha.folha_id == folha_id,
            ItemFolha.funcionario_id == funcionario_id,
        )
    )
    item_existente = result.scalar_one_or_none()
    if item_existente:
        raise HTTPException(status_code=409, detail="Funcionário já adicionado a esta folha")

    item = ItemFolha(
        folha_id=folha_id,
        funcionario_id=funcionario_id,
        salario_base=func.salario_base,
        vale_transporte=payload.vale_transporte,
        vale_refeicao=payload.vale_refeicao,
        horas_extras=payload.horas_extras,
        outras_verbas=payload.outras_verbas,
        adicionais=payload.adicionais,
        outros_descontos=payload.outros_descontos,
        # Placeholder values until calcular is called
        valor_bruto=func.salario_base,
        total_descontos=Decimal("0"),
        valor_liquido=func.salario_base,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return ItemFolhaOut.model_validate(item)


@router.post("/{folha_id}/calcular", response_model=CalculoFolhaResponse)
async def calcular_folha(
    folha_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh()),
):
    result = await db.execute(select(Folha).where(Folha.id == folha_id))
    folha = result.scalar_one_or_none()
    if not folha:
        raise HTTPException(status_code=404, detail="Folha não encontrada")

    if folha.status not in (StatusFolhaEnum.rascunho, StatusFolhaEnum.calculada):
        raise HTTPException(status_code=409, detail="Folha não pode ser recalculada neste status")

    from app.services.folha_service import calcular_item_folha

    result = await db.execute(select(ItemFolha).where(ItemFolha.folha_id == folha_id))
    itens = result.scalars().all()

    if not itens:
        raise HTTPException(status_code=422, detail="Folha sem itens")

    total_bruto = Decimal("0")
    total_descontos = Decimal("0")
    total_liquido = Decimal("0")

    for item in itens:
        await calcular_item_folha(db, item, folha.competencia)
        total_bruto += item.valor_bruto
        total_descontos += item.total_descontos
        total_liquido += item.valor_liquido

    folha.total_bruto = total_bruto
    folha.total_descontos = total_descontos
    folha.total_liquido = total_liquido
    folha.status = StatusFolhaEnum.calculada

    await db.flush()

    return CalculoFolhaResponse(
        folha_id=folha_id,
        itens=[ItemFolhaOut.model_validate(i) for i in itens],
        total_bruto=total_bruto,
        total_descontos=total_descontos,
        total_liquido=total_liquido,
    )


@router.post("/{folha_id}/aprovar", response_model=FolhaOut)
async def aprovar_folha(
    folha_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_gestor()),
):
    result = await db.execute(select(Folha).where(Folha.id == folha_id))
    folha = result.scalar_one_or_none()
    if not folha:
        raise HTTPException(status_code=404, detail="Folha não encontrada")

    if folha.status != StatusFolhaEnum.calculada:
        raise HTTPException(status_code=409, detail="Folha precisa estar calculada para ser aprovada")

    # Block if any negative valor_liquido
    result = await db.execute(select(ItemFolha).where(ItemFolha.folha_id == folha_id))
    itens = result.scalars().all()
    negativos = [i for i in itens if i.valor_liquido < 0]
    if negativos:
        nomes_neg = []
        for item in negativos:
            r = await db.execute(select(Funcionario).where(Funcionario.id == item.funcionario_id))
            f = r.scalar_one_or_none()
            nomes_neg.append(f.nome if f else str(item.funcionario_id))
        raise HTTPException(
            status_code=422,
            detail=f"Valor líquido negativo para: {', '.join(nomes_neg)}. Aprovação bloqueada.",
        )

    folha.status = StatusFolhaEnum.aprovada
    folha.aprovada_por = current_user.id
    folha.aprovada_em = datetime.now(timezone.utc)
    await db.flush()

    # Gerar holerites em background
    from app.workers.tasks import task_gerar_holerites
    task_gerar_holerites.delay(str(folha_id))

    await db.refresh(folha)
    return FolhaOut.model_validate(folha)


@router.post("/{folha_id}/gerar-cnab", response_model=CNABResponse)
async def gerar_cnab(
    folha_id: uuid.UUID,
    banco_codigo: str = "237",
    data_pagamento: str = None,  # YYYY-MM-DD
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh()),
):
    result = await db.execute(select(Folha).where(Folha.id == folha_id))
    folha = result.scalar_one_or_none()
    if not folha:
        raise HTTPException(status_code=404, detail="Folha não encontrada")

    if folha.status != StatusFolhaEnum.aprovada:
        raise HTTPException(status_code=409, detail="CNAB só pode ser gerado para folha aprovada")

    from app.services.folha_service import gerar_cnab240
    from app.storage import storage_client
    from datetime import date

    result = await db.execute(select(ItemFolha).where(ItemFolha.folha_id == folha_id))
    itens = result.scalars().all()

    itens_func = []
    for item in itens:
        r = await db.execute(select(Funcionario).where(Funcionario.id == item.funcionario_id))
        func = r.scalar_one_or_none()
        if func:
            itens_func.append((item, func))

    if not itens_func:
        raise HTTPException(status_code=422, detail="Sem itens para gerar CNAB")

    pg_date = date.fromisoformat(data_pagamento) if data_pagamento else date.today()

    cnab_content = gerar_cnab240(
        folha=folha,
        itens=itens_func,
        empresa_nome="EMPRESA LICITANTE LTDA",
        empresa_cnpj="00000000000000",
        empresa_agencia="0001",
        empresa_conta="000000001",
        banco_codigo=banco_codigo,
        data_pagamento=pg_date,
    )

    s3_key = f"cnab/{folha_id}/{folha.competencia}_banco{banco_codigo}.rem"
    storage_client.upload(s3_key, cnab_content, "text/plain")

    folha.cnab_s3 = s3_key
    await db.flush()

    return CNABResponse(folha_id=folha_id, cnab_s3=s3_key, message="CNAB 240 gerado com sucesso")


@router.patch("/{folha_id}/confirmar-envio-banco", response_model=FolhaOut)
async def confirmar_envio_banco(
    folha_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh()),
):
    result = await db.execute(select(Folha).where(Folha.id == folha_id))
    folha = result.scalar_one_or_none()
    if not folha:
        raise HTTPException(status_code=404, detail="Folha não encontrada")

    if folha.status != StatusFolhaEnum.aprovada:
        raise HTTPException(status_code=409, detail="Folha precisa estar aprovada")

    folha.status = StatusFolhaEnum.enviada_banco
    folha.enviada_banco_em = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(folha)
    return FolhaOut.model_validate(folha)


@router.patch("/{folha_id}/confirmar-pagamento", response_model=FolhaOut)
async def confirmar_pagamento(
    folha_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh()),
):
    result = await db.execute(select(Folha).where(Folha.id == folha_id))
    folha = result.scalar_one_or_none()
    if not folha:
        raise HTTPException(status_code=404, detail="Folha não encontrada")

    if folha.status != StatusFolhaEnum.enviada_banco:
        raise HTTPException(status_code=409, detail="Folha precisa ter sido enviada ao banco")

    folha.status = StatusFolhaEnum.paga
    folha.paga_em = datetime.now(timezone.utc)
    await db.flush()

    # Dispatch comprovantes
    from app.workers.tasks import task_enviar_comprovante
    from app.models.comprovante import LogEnvioComprovante, StatusEnvioEnum

    result_itens = await db.execute(select(ItemFolha).where(ItemFolha.folha_id == folha_id))
    itens = result_itens.scalars().all()

    for item in itens:
        log = LogEnvioComprovante(
            item_folha_id=item.id,
            funcionario_id=item.funcionario_id,
            status=StatusEnvioEnum.pendente,
        )
        db.add(log)
        await db.flush()
        await db.refresh(log)
        task_enviar_comprovante.delay(str(log.id))

    await db.refresh(folha)
    return FolhaOut.model_validate(folha)
