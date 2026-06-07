"""All async Celery tasks."""
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from uuid import UUID

from celery import Task
from sqlalchemy import select

from app.workers.celery_app import celery_app
from app.database import AsyncSessionLocal, engine

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async code from sync Celery task.

    Each call uses a fresh event loop, so the engine's pooled connections
    (bound to the loop they were created in) must be disposed afterwards —
    otherwise the next task reuses connections tied to a closed loop and
    fails with "Event loop is closed" / "attached to a different loop".
    """
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.run_until_complete(engine.dispose())
        loop.close()


class BaseTaskWithRetry(Task):
    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {self.name}[{task_id}] failed: {exc}")


@celery_app.task(bind=True, base=BaseTaskWithRetry, name="app.workers.tasks.task_run_scraper")
def task_run_scraper(self, portal: str):
    """Executa scraper para um portal."""
    from app.services.scraper import run_scraper
    try:
        result = run_async(run_scraper(portal))
        logger.info(f"Scraper {portal}: {result}")
        return result
    except Exception as exc:
        logger.error(f"task_run_scraper {portal} falhou: {exc}")
        raise self.retry(exc=exc, countdown=300, max_retries=3)


@celery_app.task(name="app.workers.tasks.task_verificar_vencimentos")
def task_verificar_vencimentos():
    """Verifica vencimentos de documentos diariamente."""
    async def _run():
        async with AsyncSessionLocal() as db:
            from app.services.documento_service import verificar_vencimentos
            count = await verificar_vencimentos(db)
            await db.commit()
            return {"alertas_enviados": count}

    return run_async(_run())


@celery_app.task(name="app.workers.tasks.task_sync_acompanhamento")
def task_sync_acompanhamento():
    """Sincroniza acompanhamento de editais (a cada 2h)."""
    async def _run():
        from app.services.notificacao import notificar_admin
        async with AsyncSessionLocal() as db:
            from app.models.edital import Edital, StatusEditalEnum
            from app.models.proposta import Proposta, StatusPropostaEnum

            now = datetime.now(timezone.utc)
            result = await db.execute(
                select(Edital).where(
                    Edital.status.in_([
                        StatusEditalEnum.em_analise,
                        StatusEditalEnum.proposta_enviada,
                    ])
                )
            )
            editais = result.scalars().all()
            processados = 0
            for edital in editais:
                processados += 1
                # Check recursal deadline (24h antes)
                if edital.data_abertura:
                    horas = (edital.data_abertura - now).total_seconds() / 3600
                    if 0 < horas <= 24:
                        await notificar_admin(
                            f"Recursal em 24h: Edital {edital.numero}",
                            f"O edital {edital.numero} ({edital.orgao}) abre em {horas:.1f} horas.",
                        )

            return {"editais_verificados": processados}

    return run_async(_run())


@celery_app.task(name="app.workers.tasks.task_sync_acompanhamento_critico")
def task_sync_acompanhamento_critico():
    """Sync a cada 30min para editais abrindo em 48h."""
    async def _run():
        async with AsyncSessionLocal() as db:
            from app.models.edital import Edital, StatusEditalEnum

            now = datetime.now(timezone.utc)
            limite = now + timedelta(hours=48)
            result = await db.execute(
                select(Edital).where(
                    Edital.data_abertura <= limite,
                    Edital.data_abertura > now,
                    Edital.status.in_([
                        StatusEditalEnum.em_analise,
                        StatusEditalEnum.proposta_enviada,
                    ])
                )
            )
            editais = result.scalars().all()
            return {"editais_criticos": len(editais)}

    return run_async(_run())


@celery_app.task(
    bind=True,
    name="app.workers.tasks.task_enviar_comprovante",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=2700,  # 45min max
    max_retries=3,
    default_retry_delay=300,  # 5min first retry
)
def task_enviar_comprovante(self, log_id: str):
    """Envia comprovante com 3x exponential backoff (5min, 15min, 45min)."""
    async def _run():
        async with AsyncSessionLocal() as db:
            from app.models.comprovante import LogEnvioComprovante, StatusEnvioEnum
            from app.services.comprovante_service import enviar_comprovante

            result = await db.execute(
                select(LogEnvioComprovante).where(LogEnvioComprovante.id == UUID(log_id))
            )
            log = result.scalar_one_or_none()
            if not log:
                return {"error": "Log não encontrado"}

            # Skip if manual resend (don't count toward auto retries)
            if log.reenvio_manual:
                sucesso = await enviar_comprovante(db, log)
                await db.commit()
                return {"sucesso": sucesso, "manual": True}

            log.tentativas += 1
            sucesso = await enviar_comprovante(db, log)
            await db.commit()
            return {"sucesso": sucesso, "tentativas": log.tentativas}

    result = run_async(_run())
    if not result.get("sucesso") and not result.get("manual"):
        retry_num = self.request.retries
        countdowns = [300, 900, 2700]  # 5min, 15min, 45min
        countdown = countdowns[retry_num] if retry_num < len(countdowns) else 2700
        raise self.retry(countdown=countdown)
    return result


@celery_app.task(bind=True, name="app.workers.tasks.task_revisar_proposta")
def task_revisar_proposta(self, proposta_id: str):
    """Revisão IA da proposta de forma assíncrona."""
    async def _run():
        async with AsyncSessionLocal() as db:
            from app.models.proposta import Proposta, StatusPropostaEnum
            from app.services.proposta_service import revisar_proposta

            result = await db.execute(select(Proposta).where(Proposta.id == UUID(proposta_id)))
            proposta = result.scalar_one_or_none()
            if not proposta:
                return {"error": "Proposta não encontrada"}

            proposta.status = StatusPropostaEnum.revisao_ia
            await db.flush()

            revisao = await revisar_proposta(db, proposta)
            proposta.revisao_ia_score = revisao["score"]
            proposta.revisao_ia_detalhes = revisao["detalhes"]
            proposta.revisao_ia_modelo = revisao["modelo"]
            proposta.alerta_inexequibilidade = revisao["alerta_inexequibilidade"]
            proposta.status = StatusPropostaEnum.rascunho

            await db.commit()
            return {"score": revisao["score"]}

    return run_async(_run())


@celery_app.task(bind=True, name="app.workers.tasks.task_analisar_impugnacao")
def task_analisar_impugnacao(self, impugnacao_id: str):
    """Análise IA da impugnação de forma assíncrona."""
    async def _run():
        async with AsyncSessionLocal() as db:
            from app.models.impugnacao import Impugnacao, StatusImpugnacaoEnum
            from app.services.impugnacao_service import analisar_impugnacao, gerar_minuta_docx

            result = await db.execute(select(Impugnacao).where(Impugnacao.id == UUID(impugnacao_id)))
            impugnacao = result.scalar_one_or_none()
            if not impugnacao:
                return {"error": "Impugnação não encontrada"}

            impugnacao.status = StatusImpugnacaoEnum.revisao_ia
            await db.flush()

            resultado = await analisar_impugnacao(db, impugnacao)
            impugnacao.analise_ia = resultado["analise"]
            impugnacao.revisao_ia_modelo = resultado["modelo"]

            # Generate DOCX minuta
            s3_key = await gerar_minuta_docx(db, impugnacao)
            impugnacao.minuta_docx_s3 = s3_key
            impugnacao.status = StatusImpugnacaoEnum.rascunho

            await db.commit()
            return {"minuta_s3": s3_key}

    return run_async(_run())


@celery_app.task(name="app.workers.tasks.task_gerar_holerites")
def task_gerar_holerites(folha_id: str):
    """Geração de holerites em background após aprovação da folha."""
    async def _run():
        async with AsyncSessionLocal() as db:
            from app.models.folha import Folha, ItemFolha, Funcionario
            from app.services.comprovante_service import gerar_holerite_pdf
            from app.storage import storage_client

            result = await db.execute(select(Folha).where(Folha.id == UUID(folha_id)))
            folha = result.scalar_one_or_none()
            if not folha:
                return {"error": "Folha não encontrada"}

            result = await db.execute(
                select(ItemFolha).where(ItemFolha.folha_id == folha.id)
            )
            itens = result.scalars().all()

            gerados = 0
            for item in itens:
                result = await db.execute(
                    select(Funcionario).where(Funcionario.id == item.funcionario_id)
                )
                func = result.scalar_one_or_none()
                if not func:
                    continue

                pdf = gerar_holerite_pdf(func, item, folha.competencia)
                s3_key = f"holerites/{folha_id}/{func.id}.pdf"
                storage_client.upload(s3_key, pdf, "application/pdf")
                item.holerite_s3 = s3_key
                gerados += 1

            await db.commit()
            return {"holerites_gerados": gerados}

    return run_async(_run())


@celery_app.task(bind=True, name="app.workers.tasks.task_renovar_documento")
def task_renovar_documento(self, documento_id: str):
    """RPA para renovação automática de documento."""
    async def _run():
        async with AsyncSessionLocal() as db:
            from app.models.documento import Documento, StatusDocumentoEnum

            result = await db.execute(
                select(Documento).where(Documento.id == UUID(documento_id))
            )
            doc = result.scalar_one_or_none()
            if not doc:
                return {"error": "Documento não encontrado"}

            doc.status = StatusDocumentoEnum.em_renovacao
            await db.flush()

            # RPA logic via Playwright would go here
            # For now, mark as needing manual intervention
            from app.services.notificacao import notificar_admin
            await notificar_admin(
                f"Renovação pendente: {doc.descricao}",
                f"O documento '{doc.descricao}' (tipo: {doc.tipo.value}) precisa ser renovado manualmente.",
            )

            await db.commit()
            return {"status": "em_renovacao", "documento_id": documento_id}

    return run_async(_run())
