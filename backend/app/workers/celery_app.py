"""Celery configuration."""
from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "licitacoes",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=86400,  # 24h
)

celery_app.conf.beat_schedule = {
    # Verificar vencimentos diariamente às 08:00
    "verificar-vencimentos-diario": {
        "task": "app.workers.tasks.task_verificar_vencimentos",
        "schedule": crontab(hour=8, minute=0),
    },
    # Sync acompanhamento a cada 2h
    "sync-acompanhamento-2h": {
        "task": "app.workers.tasks.task_sync_acompanhamento",
        "schedule": crontab(minute=0, hour="*/2"),
    },
    # Sync editais abrindo em 48h a cada 30min
    "sync-acompanhamento-critico-30min": {
        "task": "app.workers.tasks.task_sync_acompanhamento_critico",
        "schedule": crontab(minute="*/30"),
    },
    # Scraper PNCP 3x/dia
    "scraper-pncp": {
        "task": "app.workers.tasks.task_run_scraper",
        "schedule": crontab(hour="8,12,18", minute=30),
        "args": ("pncp",),
    },
    # Scraper ComprasNet 3x/dia
    "scraper-comprasnet": {
        "task": "app.workers.tasks.task_run_scraper",
        "schedule": crontab(hour="8,12,18", minute=0),
        "args": ("comprasnet",),
    },
    # Scraper BEC 3x/dia
    "scraper-bec": {
        "task": "app.workers.tasks.task_run_scraper",
        "schedule": crontab(hour="8,12,18", minute=15),
        "args": ("bec",),
    },
}
