"""Impugnações endpoints."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import get_current_user, require_analista
from app.models.impugnacao import Impugnacao, StatusImpugnacaoEnum
from app.models.edital import Edital
from app.schemas.impugnacao import ImpugnacaoCreate, ImpugnacaoOut, MinutaResponse

router = APIRouter(prefix="/api/impugnacoes", tags=["impugnacoes"])


@router.post("", response_model=ImpugnacaoOut, status_code=status.HTTP_201_CREATED)
async def criar_impugnacao(
    payload: ImpugnacaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    result = await db.execute(select(Edital).where(Edital.id == payload.edital_id))
    edital = result.scalar_one_or_none()
    if not edital:
        raise HTTPException(status_code=404, detail="Edital não encontrado")

    # Calcular prazo de impugnação: 3 dias úteis antes da abertura
    prazo = None
    if edital.data_abertura:
        from app.services.dias_uteis import subtrair_dias_uteis
        prazo = await subtrair_dias_uteis(db, edital.data_abertura.date(), 3, edital.uf)

        # Check if already past deadline
        if prazo < datetime.now(timezone.utc).date():
            raise HTTPException(
                status_code=422,
                detail=f"Prazo de impugnação ({prazo.strftime('%d/%m/%Y')}) já expirou",
            )

    imp = Impugnacao(
        edital_id=payload.edital_id,
        motivos=payload.motivos,
        prazo_impugnacao=prazo,
        created_by=current_user.id,
    )
    db.add(imp)
    await db.flush()
    await db.refresh(imp)
    return ImpugnacaoOut.model_validate(imp)


@router.get("/{impugnacao_id}", response_model=ImpugnacaoOut)
async def obter_impugnacao(
    impugnacao_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Impugnacao).where(Impugnacao.id == impugnacao_id))
    imp = result.scalar_one_or_none()
    if not imp:
        raise HTTPException(status_code=404, detail="Impugnação não encontrada")
    return ImpugnacaoOut.model_validate(imp)


@router.post("/{impugnacao_id}/gerar-minuta", response_model=MinutaResponse)
async def gerar_minuta(
    impugnacao_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    result = await db.execute(select(Impugnacao).where(Impugnacao.id == impugnacao_id))
    imp = result.scalar_one_or_none()
    if not imp:
        raise HTTPException(status_code=404, detail="Impugnação não encontrada")

    # Check deadline alert (< 48h)
    if imp.prazo_impugnacao:
        from datetime import timedelta
        horas_restantes = (
            datetime.combine(imp.prazo_impugnacao, datetime.min.time()).replace(tzinfo=timezone.utc)
            - datetime.now(timezone.utc)
        ).total_seconds() / 3600
        if 0 < horas_restantes <= 48 and not imp.alerta_prazo_enviado:
            from app.services.notificacao import notificar_admin
            await notificar_admin(
                f"Prazo impugnação < 48h: Edital ID {imp.edital_id}",
                f"A impugnação {imp.id} tem prazo até {imp.prazo_impugnacao} ({horas_restantes:.1f}h restantes).",
            )
            imp.alerta_prazo_enviado = True

    from app.services.impugnacao_service import analisar_impugnacao, gerar_minuta_docx
    resultado = await analisar_impugnacao(db, imp)
    imp.analise_ia = resultado["analise"]
    imp.revisao_ia_modelo = resultado["modelo"]

    s3_key = await gerar_minuta_docx(db, imp)
    imp.minuta_docx_s3 = s3_key
    await db.flush()

    return MinutaResponse(
        impugnacao_id=impugnacao_id,
        minuta_docx_s3=s3_key,
        analise_ia=resultado["analise"],
        modelo=resultado["modelo"],
    )
