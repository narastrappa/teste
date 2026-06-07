from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.comprovante import StatusEnvioEnum, CanalEnvioEnum


class LogEnvioOut(BaseModel):
    id: UUID
    item_folha_id: UUID
    funcionario_id: UUID
    canal: Optional[CanalEnvioEnum]
    status: StatusEnvioEnum
    pdf_s3: Optional[str]
    tentativas: int
    erro_detalhe: Optional[str]
    enviado_em: Optional[datetime]
    reenvio_manual: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class EnvioFolhaRequest(BaseModel):
    forcar_reenvio: bool = False


class RelatorioEnvioResponse(BaseModel):
    folha_id: UUID
    total_funcionarios: int
    enviados: int
    falhos: int
    sem_canal: int
    pendentes: int
    detalhes: List[LogEnvioOut]
