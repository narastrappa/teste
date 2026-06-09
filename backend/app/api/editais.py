"""Editais endpoints + scraper."""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Any, Dict

from app.database import get_db
from app.auth import get_current_user, require_analista
from app.models.edital import Edital, StatusEditalEnum, FiltroConfig
from app.models.proposta import Proposta, StatusPropostaEnum
from app.schemas.edital import (
    EditalOut, EditalStatusUpdate, EditalListResponse,
    ScraperRunRequest, ScraperJobResponse,
    FiltroConfigOut, FiltroConfigCreate,
)

router = APIRouter(prefix="/api", tags=["editais"])


@router.get("/editais", response_model=EditalListResponse)
async def listar_editais(
    status: Optional[StatusEditalEnum] = None,
    portal: Optional[str] = None,
    data_abertura_inicio: Optional[datetime] = None,
    data_abertura_fim: Optional[datetime] = None,
    valor_min: Optional[Decimal] = None,
    valor_max: Optional[Decimal] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    filters = []
    if status:
        filters.append(Edital.status == status)
    if portal:
        filters.append(Edital.portal_origem == portal)
    if data_abertura_inicio:
        filters.append(Edital.data_abertura >= data_abertura_inicio)
    if data_abertura_fim:
        filters.append(Edital.data_abertura <= data_abertura_fim)
    if valor_min is not None:
        filters.append(Edital.valor_estimado >= valor_min)
    if valor_max is not None:
        filters.append(Edital.valor_estimado <= valor_max)

    count_q = select(func.count()).select_from(Edital)
    if filters:
        count_q = count_q.where(and_(*filters))
    total = (await db.execute(count_q)).scalar_one()

    query = select(Edital).order_by(Edital.relevancia_score.desc(), Edital.created_at.desc())
    if filters:
        query = query.where(and_(*filters))
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()

    pages = (total + per_page - 1) // per_page

    return EditalListResponse(
        items=[EditalOut.model_validate(e) for e in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.get("/editais/{edital_id}", response_model=EditalOut)
async def obter_edital(
    edital_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Edital).where(Edital.id == edital_id))
    edital = result.scalar_one_or_none()
    if not edital:
        raise HTTPException(status_code=404, detail="Edital não encontrado")
    return EditalOut.model_validate(edital)


@router.patch("/editais/{edital_id}/status", response_model=EditalOut)
async def atualizar_status_edital(
    edital_id: uuid.UUID,
    payload: EditalStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_analista()),
):
    result = await db.execute(select(Edital).where(Edital.id == edital_id))
    edital = result.scalar_one_or_none()
    if not edital:
        raise HTTPException(status_code=404, detail="Edital não encontrado")

    historico = list(edital.historico_status or [])
    historico.append({
        "status_anterior": edital.status.value,
        "status_novo": payload.status.value,
        "motivo": payload.motivo,
        "usuario_id": str(current_user.id),
        "timestamp": datetime.utcnow().isoformat(),
    })
    edital.status = payload.status
    edital.historico_status = historico
    await db.flush()
    await db.refresh(edital)
    return EditalOut.model_validate(edital)


@router.get("/filtros", response_model=Optional[FiltroConfigOut])
async def obter_filtro_ativo(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retorna o perfil de busca (filtro) ativo, se existir."""
    result = await db.execute(
        select(FiltroConfig).where(FiltroConfig.ativo == True).order_by(FiltroConfig.updated_at.desc())
    )
    filtro = result.scalars().first()
    if not filtro:
        return None
    return FiltroConfigOut.model_validate(filtro)


@router.put("/filtros", response_model=FiltroConfigOut)
async def salvar_filtro(
    payload: FiltroConfigCreate,
    current_user=Depends(require_analista()),
    db: AsyncSession = Depends(get_db),
):
    """Cria ou atualiza o perfil de busca (filtro) ativo."""
    result = await db.execute(
        select(FiltroConfig).where(FiltroConfig.ativo == True).order_by(FiltroConfig.updated_at.desc())
    )
    filtro = result.scalars().first()
    if filtro is None:
        filtro = FiltroConfig(id=uuid.uuid4())
        db.add(filtro)

    filtro.palavras_chave = payload.palavras_chave
    filtro.palavras_excluir = payload.palavras_excluir
    filtro.valor_minimo = payload.valor_minimo
    filtro.valor_maximo = payload.valor_maximo
    filtro.modalidades = payload.modalidades
    filtro.ufs = payload.ufs
    filtro.portais = payload.portais
    filtro.ativo = payload.ativo

    await db.flush()
    await db.refresh(filtro)
    return FiltroConfigOut.model_validate(filtro)


@router.get("/editais/stats")
async def stats_editais(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Retorna estatísticas de editais e propostas para os gráficos."""
    # Contagem de editais por status
    rows = (await db.execute(
        select(Edital.status, func.count().label("n")).group_by(Edital.status)
    )).all()
    por_status = {r.status.value: r.n for r in rows}

    # Taxa de ganho / perda com base em propostas finalizadas
    total_fin = (await db.execute(
        select(func.count()).where(
            Proposta.status.in_([StatusPropostaEnum.vencedora, StatusPropostaEnum.perdida])
        )
    )).scalar_one()
    total_vencidas = (await db.execute(
        select(func.count()).where(Proposta.status == StatusPropostaEnum.vencedora)
    )).scalar_one()
    taxa_ganho = round(total_vencidas / total_fin * 100) if total_fin else 0

    # Padrão de vitória: orgao + modalidade das propostas vencedoras ligadas a editais
    vencidas_q = (await db.execute(
        select(Edital.orgao, Edital.modalidade, Edital.uf)
        .join(Proposta, Proposta.edital_id == Edital.id)
        .where(Proposta.status == StatusPropostaEnum.vencedora)
    )).all()
    orgaos_vencidos = {r.orgao for r in vencidas_q}
    modalidades_vencidas = {r.modalidade for r in vencidas_q}
    ufs_vencidas = {r.uf for r in vencidas_q if r.uf}

    # Editais novos/em_analise que se encaixam no padrão de vitória
    recomendados: List[EditalOut] = []
    if orgaos_vencidos or modalidades_vencidas:
        filters = []
        if orgaos_vencidos:
            filters.append(Edital.orgao.in_(orgaos_vencidos))
        if modalidades_vencidas:
            filters.append(Edital.modalidade.in_(modalidades_vencidas))
        if ufs_vencidas:
            filters.append(Edital.uf.in_(ufs_vencidas))

        res = await db.execute(
            select(Edital)
            .where(
                Edital.status.in_([StatusEditalEnum.novo, StatusEditalEnum.em_analise]),
                or_(*filters),
            )
            .order_by(Edital.relevancia_score.desc())
            .limit(10)
        )
        recomendados = [EditalOut.model_validate(e) for e in res.scalars().all()]

    return {
        "por_status": por_status,
        "taxa_ganho": taxa_ganho,
        "taxa_perda": 100 - taxa_ganho if total_fin else 0,
        "total_finalizadas": total_fin,
        "recomendados": [e.model_dump(mode="json") for e in recomendados],
    }


@router.post("/scraper/run", response_model=ScraperJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def run_scraper(
    payload: ScraperRunRequest,
    current_user=Depends(require_analista()),
):
    """Inicia scraper(s) de forma assíncrona."""
    from app.workers.tasks import task_run_scraper

    portais = payload.portais or ["pncp", "comprasnet", "bec"]
    tasks = []
    for portal in portais:
        task = task_run_scraper.delay(portal)
        tasks.append({"portal": portal, "task_id": task.id})

    job_id = tasks[0]["task_id"] if len(tasks) == 1 else str(uuid.uuid4())
    return ScraperJobResponse(
        job_id=job_id,
        status="queued",
        portal=portais[0] if len(portais) == 1 else None,
        message=f"Scraper iniciado para: {', '.join(portais)}",
    )


@router.get("/scraper/jobs/{job_id}", response_model=ScraperJobResponse)
async def status_scraper_job(
    job_id: str,
    current_user=Depends(get_current_user),
):
    """Verifica o status de um job de scraper."""
    from celery.result import AsyncResult
    from app.workers.celery_app import celery_app

    result = AsyncResult(job_id, app=celery_app)
    return ScraperJobResponse(
        job_id=job_id,
        status=result.status.lower(),
        message=str(result.result) if result.ready() else None,
    )
