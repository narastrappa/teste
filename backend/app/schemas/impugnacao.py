from uuid import UUID
from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel
from app.models.impugnacao import StatusImpugnacaoEnum


class ImpugnacaoCreate(BaseModel):
    edital_id: UUID
    motivos: str


class ImpugnacaoOut(BaseModel):
    id: UUID
    edital_id: UUID
    status: StatusImpugnacaoEnum
    motivos: str
    minuta_docx_s3: Optional[str]
    analise_ia: Optional[Any]
    revisao_ia_modelo: Optional[str]
    prazo_impugnacao: Optional[date]
    alerta_prazo_enviado: bool
    enviada_em: Optional[datetime]
    resposta_orgao: Optional[str]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MinutaResponse(BaseModel):
    impugnacao_id: UUID
    minuta_docx_s3: str
    analise_ia: Any
    modelo: str
