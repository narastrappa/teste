"""Comprovantes endpoints."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.auth import get_current_user, require_rh
from app.models.folha import Folha, ItemFolha, StatusFolhaEnum
from app.models.comprovante import LogEnvioComprovante, StatusEnvioEnum
from app.schemas.comprovante import EnvioFolhaRequest, LogEnvioOut, RelatorioEnvioResponse

router = APIRouter(prefix="/api/comprovantes", tags=["comprovantes"])


@router.post("/folha/{folha_id}/enviar")
async def enviar_comprovantes_folha(
    folha_id: uuid.UUID,
    payload: EnvioFolhaRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh()),
):
    result = await db.execute(select(Folha).where(Folha.id == folha_id))
    folha = result.scalar_one_or_none()
    if not folha:
        raise HTTPException(status_code=404, detail="Folha não encontrada")

    if folha.status != StatusFolhaEnum.paga:
        raise HTTPException(status_code=422, detail="Comprovantes só enviados para folha paga")

    from app.workers.tasks import task_enviar_comprovante

    result_itens = await db.execute(select(ItemFolha).where(ItemFolha.folha_id == folha_id))
    itens = result_itens.scalars().all()

    enviados = 0
    for item in itens:
        if payload.forcar_reenvio:
            # Mark as manual resend (doesn't count toward auto retries)
            log = LogEnvioComprovante(
                item_folha_id=item.id,
                funcionario_id=item.funcionario_id,
                status=StatusEnvioEnum.pendente,
                reenvio_manual=True,
            )
            db.add(log)
            await db.flush()
            await db.refresh(log)
            task_enviar_comprovante.delay(str(log.id))
            enviados += 1
        else:
            # Only send if not already sent
            result_log = await db.execute(
                select(LogEnvioComprovante).where(
                    LogEnvioComprovante.item_folha_id == item.id,
                    LogEnvioComprovante.status == StatusEnvioEnum.enviado,
                )
            )
            if not result_log.scalar_one_or_none():
                log = LogEnvioComprovante(
                    item_folha_id=item.id,
                    funcionario_id=item.funcionario_id,
                    status=StatusEnvioEnum.pendente,
                )
                db.add(log)
                await db.flush()
                await db.refresh(log)
                task_enviar_comprovante.delay(str(log.id))
                enviados += 1

    return {"message": f"{enviados} comprovante(s) enfileirado(s)"}


@router.post("/item/{item_folha_id}/reenviar", response_model=LogEnvioOut)
async def reenviar_comprovante(
    item_folha_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_rh()),
):
    """Reenvio manual - não conta nas retentativas automáticas."""
    result = await db.execute(select(ItemFolha).where(ItemFolha.id == item_folha_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item de folha não encontrado")

    # Check folha is paga
    result_folha = await db.execute(select(Folha).where(Folha.id == item.folha_id))
    folha = result_folha.scalar_one_or_none()
    if not folha or folha.status != StatusFolhaEnum.paga:
        raise HTTPException(status_code=422, detail="Folha não está paga")

    # Find existing log to reuse PDF
    result_log = await db.execute(
        select(LogEnvioComprovante).where(
            LogEnvioComprovante.item_folha_id == item_folha_id,
        ).order_by(LogEnvioComprovante.created_at.desc())
    )
    ultimo_log = result_log.scalars().first()
    pdf_s3 = ultimo_log.pdf_s3 if ultimo_log else None

    log = LogEnvioComprovante(
        item_folha_id=item_folha_id,
        funcionario_id=item.funcionario_id,
        status=StatusEnvioEnum.pendente,
        reenvio_manual=True,
        pdf_s3=pdf_s3,  # Reuse existing PDF
    )
    db.add(log)
    await db.flush()
    await db.refresh(log)

    from app.workers.tasks import task_enviar_comprovante
    task_enviar_comprovante.delay(str(log.id))

    return LogEnvioOut.model_validate(log)


@router.get("/folha/{folha_id}/relatorio", response_model=RelatorioEnvioResponse)
async def relatorio_envios(
    folha_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Folha).where(Folha.id == folha_id))
    folha = result.scalar_one_or_none()
    if not folha:
        raise HTTPException(status_code=404, detail="Folha não encontrada")

    result_itens = await db.execute(select(ItemFolha).where(ItemFolha.folha_id == folha_id))
    itens = result_itens.scalars().all()
    total_funcionarios = len(itens)

    result_logs = await db.execute(
        select(LogEnvioComprovante).where(
            LogEnvioComprovante.item_folha_id.in_([i.id for i in itens])
        ).order_by(LogEnvioComprovante.created_at.desc())
    )
    logs = result_logs.scalars().all()

    return RelatorioEnvioResponse(
        folha_id=folha_id,
        total_funcionarios=total_funcionarios,
        enviados=sum(1 for l in logs if l.status == StatusEnvioEnum.enviado),
        falhos=sum(1 for l in logs if l.status == StatusEnvioEnum.falhou),
        sem_canal=sum(1 for l in logs if l.status == StatusEnvioEnum.sem_canal),
        pendentes=sum(1 for l in logs if l.status == StatusEnvioEnum.pendente),
        detalhes=[LogEnvioOut.model_validate(l) for l in logs],
    )
