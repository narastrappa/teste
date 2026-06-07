from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional, Any
from pydantic import BaseModel, Field
from app.models.proposta import StatusPropostaEnum


class PropostaCreate(BaseModel):
    edital_id: UUID
    template_id: Optional[UUID] = None
    valor_proposto: Optional[Decimal] = None
    descricao_tecnica: Optional[str] = None


class PropostaOut(BaseModel):
    id: UUID
    edital_id: UUID
    template_id: Optional[UUID]
    versao: int
    status: StatusPropostaEnum
    valor_proposto: Optional[Decimal]
    descricao_tecnica: Optional[str]
    conteudo_docx_s3: Optional[str]
    pacote_s3: Optional[str]
    revisao_ia_score: Optional[float]
    revisao_ia_detalhes: Optional[Any]
    revisao_ia_modelo: Optional[str]
    enviada_em: Optional[datetime]
    protocolo_envio: Optional[str]
    imutavel: bool
    alerta_inexequibilidade: bool
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RevisaoIAResponse(BaseModel):
    proposta_id: UUID
    score: float
    detalhes: Any
    modelo: str
    aprovada: bool
    alertas: list


class EmpacotagemResponse(BaseModel):
    proposta_id: UUID
    pacote_s3: str
    arquivos: list


class EnvioResponse(BaseModel):
    proposta_id: UUID
    protocolo: str
    enviada_em: datetime


class TimelineEvent(BaseModel):
    evento: str
    data: datetime
    detalhe: Optional[str] = None


class TimelineResponse(BaseModel):
    proposta_id: UUID
    eventos: list
