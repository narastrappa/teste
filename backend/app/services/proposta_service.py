"""Proposta service: IA review, empacotamento, envio."""
import logging
import zipfile
import io
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID

import anthropic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.proposta import Proposta, StatusPropostaEnum
from app.models.edital import Edital
from app.models.documento import Documento, StatusDocumentoEnum

logger = logging.getLogger(__name__)

CRITERIOS = [
    "conformidade_tecnica",
    "adequacao_precos",
    "documentacao_habilitacao",
    "prazo_entrega",
    "garantias",
    "experiencia_atestados",
]


async def revisar_proposta(db: AsyncSession, proposta: Proposta) -> Dict[str, Any]:
    """
    Revisão por IA com 6 critérios:
    1. Conformidade técnica com o edital
    2. Adequação de preços (inexequibilidade)
    3. Documentação de habilitação completa
    4. Prazo de entrega exequível
    5. Garantias adequadas
    6. Experiência e atestados suficientes
    """
    result = await db.execute(select(Edital).where(Edital.id == proposta.edital_id))
    edital = result.scalar_one_or_none()

    if not edital:
        raise ValueError("Edital não encontrado")

    # Check inexequibilidade
    alerta_inexequibilidade = False
    if proposta.valor_proposto and edital.valor_estimado:
        ratio = float(proposta.valor_proposto) / float(edital.valor_estimado)
        if ratio < 0.70:
            alerta_inexequibilidade = True

    # Check prazo alert
    alerta_prazo = False
    if edital.data_abertura:
        horas_restantes = (edital.data_abertura - datetime.now(timezone.utc)).total_seconds() / 3600
        if horas_restantes < settings.prazo_alerta_proposta_horas:
            alerta_prazo = True

    # Check documentos vencidos
    result_docs = await db.execute(
        select(Documento).where(Documento.status == StatusDocumentoEnum.vencido)
    )
    docs_vencidos = result_docs.scalars().all()

    prompt = f"""Você é um especialista em licitações públicas brasileiras. Analise esta proposta para o edital abaixo e avalie cada critério com uma nota de 0 a 100.

EDITAL:
- Número: {edital.numero}
- Órgão: {edital.orgao}
- Objeto: {edital.objeto}
- Modalidade: {edital.modalidade.value}
- Valor estimado: R$ {edital.valor_estimado or 'não informado'}
- Data abertura: {edital.data_abertura or 'não informada'}

PROPOSTA:
- Valor proposto: R$ {proposta.valor_proposto or 'não informado'}
- Descrição técnica: {proposta.descricao_tecnica or 'não informada'}

Documentos vencidos: {len(docs_vencidos)} documento(s) com vencimento expirado.
Alerta inexequibilidade: {alerta_inexequibilidade}
Prazo crítico (< 24h): {alerta_prazo}

Responda em JSON com esta estrutura exata:
{{
  "criterios": {{
    "conformidade_tecnica": {{"nota": 0-100, "justificativa": "..."}},
    "adequacao_precos": {{"nota": 0-100, "justificativa": "..."}},
    "documentacao_habilitacao": {{"nota": 0-100, "justificativa": "..."}},
    "prazo_entrega": {{"nota": 0-100, "justificativa": "..."}},
    "garantias": {{"nota": 0-100, "justificativa": "..."}},
    "experiencia_atestados": {{"nota": 0-100, "justificativa": "..."}}
  }},
  "recomendacoes": ["..."],
  "riscos": ["..."]
}}"""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    try:
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        import json
        content = response.content[0].text
        # Extract JSON
        start = content.find("{")
        end = content.rfind("}") + 1
        analise = json.loads(content[start:end])
    except Exception as e:
        logger.error(f"Erro na revisão IA da proposta {proposta.id}: {e}")
        analise = {
            "criterios": {c: {"nota": 50, "justificativa": "Análise indisponível"} for c in CRITERIOS},
            "recomendacoes": [],
            "riscos": [str(e)],
        }

    # Calculate score as average of criteria
    notas = [analise["criterios"][c]["nota"] for c in CRITERIOS if c in analise.get("criterios", {})]
    score = sum(notas) / len(notas) if notas else 0.0

    # Add alerts to detalhes
    alertas = []
    if alerta_inexequibilidade:
        alertas.append("ALERTA: Valor proposto inferior a 70% do estimado - risco de inexequibilidade")
    if alerta_prazo:
        alertas.append(f"ALERTA: Menos de {settings.prazo_alerta_proposta_horas}h para abertura")
    if docs_vencidos:
        alertas.append(f"ALERTA: {len(docs_vencidos)} documento(s) vencido(s) - empacotar será bloqueado")

    analise["alertas"] = alertas
    analise["score"] = round(score, 2)

    return {
        "score": round(score, 2),
        "detalhes": analise,
        "modelo": settings.anthropic_model,
        "alerta_inexequibilidade": alerta_inexequibilidade,
        "alertas": alertas,
    }


async def empacotar_proposta(db: AsyncSession, proposta: Proposta) -> str:
    """Cria pacote ZIP com documentos da proposta e retorna s3_key."""
    from app.storage import storage_client

    # Check documentos vencidos
    result_docs = await db.execute(
        select(Documento).where(Documento.status == StatusDocumentoEnum.vencido)
    )
    docs_vencidos = result_docs.scalars().all()
    if docs_vencidos:
        nomes = [d.descricao for d in docs_vencidos]
        raise ValueError(f"Documentos vencidos impedem empacotamento: {', '.join(nomes)}")

    # Collect all valid documents
    result_docs = await db.execute(
        select(Documento).where(
            Documento.status.in_([StatusDocumentoEnum.valido, StatusDocumentoEnum.a_vencer])
        )
    )
    documentos = result_docs.scalars().all()

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Include proposta docx if exists
        if proposta.conteudo_docx_s3:
            try:
                content = storage_client.download(proposta.conteudo_docx_s3)
                zf.writestr("proposta.docx", content)
            except Exception as e:
                logger.warning(f"Erro ao incluir proposta.docx: {e}")

        # Include documents
        for doc in documentos:
            if doc.s3_key:
                try:
                    content = storage_client.download(doc.s3_key)
                    filename = doc.nome_arquivo or f"{doc.tipo.value}_{doc.id}.pdf"
                    zf.writestr(f"documentos/{filename}", content)
                except Exception as e:
                    logger.warning(f"Erro ao incluir documento {doc.id}: {e}")

        # Add manifest
        manifest = f"Pacote gerado em {datetime.now(timezone.utc).isoformat()}\n"
        manifest += f"Proposta ID: {proposta.id}\n"
        manifest += f"Edital ID: {proposta.edital_id}\n"
        manifest += f"Documentos incluídos: {len(documentos)}\n"
        zf.writestr("MANIFESTO.txt", manifest)

    zip_buffer.seek(0)
    s3_key = f"propostas/{proposta.id}/pacote_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    storage_client.upload(s3_key, zip_buffer.getvalue(), "application/zip")

    return s3_key
