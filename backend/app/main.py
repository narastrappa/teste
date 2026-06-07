"""FastAPI app entry point with lifespan and routers."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    logger.info("Starting up Licitações API...")

    # Import all models to register them with SQLAlchemy
    from app.models import (
        Usuario, Edital, FiltroConfig, Proposta, Template,
        Impugnacao, Documento, Funcionario, Folha, ItemFolha,
        LogEnvioComprovante, TabelaIRRF, TabelaINSS, FeriadoNacional, AdaptadorPortal,
    )

    # Ensure MinIO bucket exists
    try:
        from app.storage import storage_client
        storage_client._get_client()
        logger.info("MinIO bucket verificado")
    except Exception as e:
        logger.warning(f"MinIO não disponível no startup: {e}")

    yield

    logger.info("Shutting down Licitações API...")
    await engine.dispose()


app = FastAPI(
    title="Licitações API",
    description="Sistema de automação de licitações públicas brasileiras",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from app.api.auth import router as auth_router
from app.api.editais import router as editais_router
from app.api.propostas import router as propostas_router
from app.api.impugnacoes import router as impugnacoes_router
from app.api.documentos import router as documentos_router
from app.api.folhas import router as folhas_router
from app.api.comprovantes import router as comprovantes_router
from app.api.dashboard import router as dashboard_router

app.include_router(auth_router)
app.include_router(editais_router)
app.include_router(propostas_router)
app.include_router(impugnacoes_router)
app.include_router(documentos_router)
app.include_router(folhas_router)
app.include_router(comprovantes_router)
app.include_router(dashboard_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
