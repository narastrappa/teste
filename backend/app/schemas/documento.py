from uuid import UUID
from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel
from app.models.documento import TipoDocumentoEnum, StatusDocumentoEnum


class DocumentoOut(BaseModel):
    id: UUID
    tipo: TipoDocumentoEnum
    descricao: str
    status: StatusDocumentoEnum
    s3_key: Optional[str]
    nome_arquivo: Optional[str]
    versao: int
    historico_versoes: List[Any]
    data_emissao: Optional[date]
    data_vencimento: Optional[date]
    dias_alerta: int
    alerta_enviado: bool
    ocr_confianca: Optional[float]
    ocr_snippet: Optional[str]
    ocr_confirmado: bool
    auto_renovavel: bool
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentoStatusResponse(BaseModel):
    total: int
    validos: int
    a_vencer: int
    vencidos: int
    em_renovacao: int
    detalhes: List[DocumentoOut]


class RenovacaoResponse(BaseModel):
    documento_id: UUID
    task_id: str
    message: str
