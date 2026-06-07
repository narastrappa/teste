import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, Text, Boolean, Integer, Enum as SAEnum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class StatusEnvioEnum(str, enum.Enum):
    pendente = "pendente"
    enviado = "enviado"
    falhou = "falhou"
    sem_canal = "sem_canal"


class CanalEnvioEnum(str, enum.Enum):
    email = "email"
    whatsapp = "whatsapp"


class LogEnvioComprovante(Base):
    __tablename__ = "log_envio_comprovantes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_folha_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("itens_folha.id"), nullable=False)
    funcionario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("funcionarios.id"), nullable=False)
    canal: Mapped[Optional[CanalEnvioEnum]] = mapped_column(SAEnum(CanalEnvioEnum), nullable=True)
    status: Mapped[StatusEnvioEnum] = mapped_column(
        SAEnum(StatusEnvioEnum), nullable=False, default=StatusEnvioEnum.pendente
    )
    pdf_s3: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    tentativas: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    erro_detalhe: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    enviado_em: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reenvio_manual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    item_folha = relationship("ItemFolha", lazy="select")
    funcionario = relationship("Funcionario", lazy="select")
