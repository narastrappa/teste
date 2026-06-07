from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.models.edital import StatusEditalEnum, ModalidadeEnum


class EditalOut(BaseModel):
    id: UUID
    numero: str
    portal_origem: str
    orgao: str
    objeto: str
    modalidade: ModalidadeEnum
    status: StatusEditalEnum
    uf: Optional[str]
    municipio: Optional[str]
    valor_estimado: Optional[Decimal]
    data_abertura: Optional[datetime]
    data_publicacao: Optional[datetime]
    url_edital: Optional[str]
    url_portal: Optional[str]
    relevancia_score: int
    notificado: bool
    historico_status: List[Any]
    arquivos_s3: List[Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EditalStatusUpdate(BaseModel):
    status: StatusEditalEnum
    motivo: Optional[str] = None


class EditalListResponse(BaseModel):
    items: List[EditalOut]
    total: int
    page: int
    per_page: int
    pages: int


class ScraperRunRequest(BaseModel):
    portais: Optional[List[str]] = None  # None = all active portals


class ScraperJobResponse(BaseModel):
    job_id: str
    status: str
    portal: Optional[str] = None
    message: Optional[str] = None


class FiltroConfigOut(BaseModel):
    id: UUID
    palavras_chave: List[str]
    palavras_excluir: List[str]
    valor_minimo: Optional[Decimal]
    valor_maximo: Optional[Decimal]
    modalidades: List[str]
    ufs: List[str]
    portais: List[str]
    ativo: bool

    model_config = {"from_attributes": True}


class FiltroConfigCreate(BaseModel):
    palavras_chave: List[str] = []
    palavras_excluir: List[str] = []
    valor_minimo: Optional[Decimal] = None
    valor_maximo: Optional[Decimal] = None
    modalidades: List[str] = []
    ufs: List[str] = []
    portais: List[str] = []
    ativo: bool = True
