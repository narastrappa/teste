from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # DB
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/licitacoes"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/licitacoes"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # MinIO/S3
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "licitacoes"
    minio_secure: bool = False
    aws_region: str = "us-east-1"

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@example.com"
    smtp_tls: bool = True

    # WhatsApp Z-API
    zapi_instance: str = ""
    zapi_token: str = ""
    zapi_base_url: str = "https://api.z-api.io/instances"

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-4-5"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # Business Rules
    ia_score_min_envio: int = 70
    prazo_alerta_proposta_horas: int = 24
    dias_alerta_documento: int = 30
    scraper_max_falhas_consecutivas: int = 3

    # Portals
    comprasnet_url: str = "https://comprasnet.gov.br"
    comprasnet_user: str = ""
    comprasnet_pass: str = ""
    bec_url: str = "https://www.bec.sp.gov.br"

    # Admin
    admin_email: str = "admin@example.com"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
