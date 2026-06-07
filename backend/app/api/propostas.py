"""Propostas endpoints."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import get_current_user, require_analista
from app.config import settings
from app.models.proposta import Proposta, StatusPropostaEnum
from app.models.edital import Edital
from app.schemas.proposta import (
    PropostaCreate, PropostaOut, RevisaoIAResponse,
    EmpacotagemResponse, EnvioResponse, TimelineResponse,
)

router = APIRouter(prefix="/api/propostas", tags=["propostas"])


@router.post("", response_model=PropostaOut, status_code=status.HTTP_201_CREATED)
async def criar_proposta(
    payload: PropostaCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    # Check edital exists
    result = await db.execute(select(Edital).where(Edital.id == payload.edital_id))
    edital = result.scalar_one_or_none()
    if not edital:
        raise HTTPException(status_code=404, detail="Edital não encontrado")

    proposta = Proposta(
        edital_id=payload.edital_id,
        template_id=payload.template_id,
        valor_proposto=payload.valor_proposto,
        descricao_tecnica=payload.descricao_tecnica,
        status=StatusPropostaEnum.rascunho,
        created_by=current_user.id,
    )
    db.add(proposta)
    await db.flush()
    await db.refresh(proposta)
    return PropostaOut.model_validate(proposta)


@router.get("/{proposta_id}", response_model=PropostaOut)
async def obter_proposta(
    proposta_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Proposta).where(Proposta.id == proposta_id))
    proposta = result.scalar_one_or_none()
    if not proposta:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")
    return PropostaOut.model_validate(proposta)


@router.post("/{proposta_id}/revisar", response_model=RevisaoIAResponse)
async def revisar_proposta(
    proposta_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    result = await db.execute(select(Proposta).where(Proposta.id == proposta_id))
    proposta = result.scalar_one_or_none()
    if not proposta:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")

    if proposta.imutavel:
        raise HTTPException(status_code=409, detail="Proposta imutável após envio")

    from app.services.proposta_service import revisar_proposta as _revisar
    revisao = await _revisar(db, proposta)

    proposta.revisao_ia_score = revisao["score"]
    proposta.revisao_ia_detalhes = revisao["detalhes"]
    proposta.revisao_ia_modelo = revisao["modelo"]
    proposta.alerta_inexequibilidade = revisao["alerta_inexequibilidade"]
    await db.flush()

    return RevisaoIAResponse(
        proposta_id=proposta_id,
        score=revisao["score"],
        detalhes=revisao["detalhes"],
        modelo=revisao["modelo"],
        aprovada=revisao["score"] >= settings.ia_score_min_envio,
        alertas=revisao["alertas"],
    )


@router.post("/{proposta_id}/empacotar", response_model=EmpacotagemResponse)
async def empacotar_proposta(
    proposta_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    result = await db.execute(select(Proposta).where(Proposta.id == proposta_id))
    proposta = result.scalar_one_or_none()
    if not proposta:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")

    if proposta.imutavel:
        raise HTTPException(status_code=409, detail="Proposta imutável após envio")

    from app.services.proposta_service import empacotar_proposta as _empacotar
    try:
        s3_key = await _empacotar(db, proposta)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    proposta.pacote_s3 = s3_key
    await db.flush()

    return EmpacotagemResponse(
        proposta_id=proposta_id,
        pacote_s3=s3_key,
        arquivos=[s3_key],
    )


@router.post("/{proposta_id}/enviar", response_model=EnvioResponse)
async def enviar_proposta(
    proposta_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    result = await db.execute(select(Proposta).where(Proposta.id == proposta_id))
    proposta = result.scalar_one_or_none()
    if not proposta:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")

    if proposta.imutavel:
        raise HTTPException(status_code=409, detail="Proposta já foi enviada")

    if proposta.status == StatusPropostaEnum.enviada:
        raise HTTPException(status_code=409, detail="Proposta já foi enviada")

    # Block if IA score < minimum
    if proposta.revisao_ia_score is not None and proposta.revisao_ia_score < settings.ia_score_min_envio:
        raise HTTPException(
            status_code=422,
            detail=f"Score IA ({proposta.revisao_ia_score:.1f}) abaixo do mínimo ({settings.ia_score_min_envio}). Revise a proposta.",
        )

    # Prazo alert
    result_edital = await db.execute(select(Edital).where(Edital.id == proposta.edital_id))
    edital = result_edital.scalar_one_or_none()
    if edital and edital.data_abertura:
        horas = (edital.data_abertura - datetime.now(timezone.utc)).total_seconds() / 3600
        if horas < 0:
            raise HTTPException(status_code=422, detail="Data de abertura do edital já passou")

    enviada_em = datetime.now(timezone.utc)
    protocolo = f"PROTO-{proposta_id}-{enviada_em.strftime('%Y%m%d%H%M%S')}"

    proposta.status = StatusPropostaEnum.enviada
    proposta.enviada_em = enviada_em
    proposta.protocolo_envio = protocolo
    proposta.imutavel = True

    await db.flush()

    return EnvioResponse(
        proposta_id=proposta_id,
        protocolo=protocolo,
        enviada_em=enviada_em,
    )


@router.get("/{proposta_id}/timeline", response_model=TimelineResponse)
async def timeline_proposta(
    proposta_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Proposta).where(Proposta.id == proposta_id))
    proposta = result.scalar_one_or_none()
    if not proposta:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")

    eventos = []
    eventos.append({"evento": "Proposta criada", "data": proposta.created_at, "detalhe": None})

    if proposta.revisao_ia_score is not None:
        eventos.append({
            "evento": "Revisão IA concluída",
            "data": proposta.updated_at,
            "detalhe": f"Score: {proposta.revisao_ia_score:.1f}",
        })

    if proposta.pacote_s3:
        eventos.append({
            "evento": "Proposta empacotada",
            "data": proposta.updated_at,
            "detalhe": proposta.pacote_s3,
        })

    if proposta.enviada_em:
        eventos.append({
            "evento": "Proposta enviada",
            "data": proposta.enviada_em,
            "detalhe": proposta.protocolo_envio,
        })

    return TimelineResponse(proposta_id=proposta_id, eventos=eventos)
