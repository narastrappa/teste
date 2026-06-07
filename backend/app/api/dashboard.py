"""Dashboard and acompanhamento endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.auth import get_current_user
from app.models.edital import Edital, StatusEditalEnum
from app.models.proposta import Proposta, StatusPropostaEnum

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Resumo do dashboard."""
    # Proposals by status
    result_em_aberto = await db.execute(
        select(func.count()).select_from(Proposta).where(
            Proposta.status.in_([
                StatusPropostaEnum.rascunho,
                StatusPropostaEnum.revisao_ia,
                StatusPropostaEnum.aprovada,
            ])
        )
    )
    em_aberto = result_em_aberto.scalar_one()

    result_enviadas = await db.execute(
        select(func.count()).select_from(Proposta).where(
            Proposta.status == StatusPropostaEnum.enviada
        )
    )
    enviadas = result_enviadas.scalar_one()

    result_habilitadas = await db.execute(
        select(func.count()).select_from(Proposta).where(
            Proposta.status == StatusPropostaEnum.habilitada
        )
    )
    habilitadas = result_habilitadas.scalar_one()

    result_vencedoras = await db.execute(
        select(func.count()).select_from(Proposta).where(
            Proposta.status == StatusPropostaEnum.vencedora
        )
    )
    vencidas = result_vencedoras.scalar_one()

    result_perdidas = await db.execute(
        select(func.count()).select_from(Proposta).where(
            Proposta.status == StatusPropostaEnum.perdida
        )
    )
    perdidas = result_perdidas.scalar_one()

    # Total valor vencido
    result_valor = await db.execute(
        select(func.coalesce(func.sum(Proposta.valor_proposto), 0)).where(
            Proposta.status == StatusPropostaEnum.vencedora
        )
    )
    total_valor_vencido = result_valor.scalar_one() or 0

    # Editais stats
    result_editais_novos = await db.execute(
        select(func.count()).select_from(Edital).where(
            Edital.status == StatusEditalEnum.novo
        )
    )
    editais_novos = result_editais_novos.scalar_one()

    return {
        "propostas": {
            "em_aberto": em_aberto,
            "enviadas": enviadas,
            "habilitadas": habilitadas,
            "vencidas": vencidas,
            "perdidas": perdidas,
            "total_valor_vencido": float(total_valor_vencido),
        },
        "editais": {
            "novos": editais_novos,
        },
    }


@router.post("/acompanhamento/sync", status_code=status.HTTP_202_ACCEPTED)
async def sync_acompanhamento(
    current_user=Depends(get_current_user),
):
    """Dispara sync manual de acompanhamento."""
    from app.workers.tasks import task_sync_acompanhamento
    task = task_sync_acompanhamento.delay()
    return {"task_id": task.id, "status": "queued"}
