import enum
import uuid
from datetime import datetime, timezone, date
from typing import Optional

from sqlalchemy import String, Text, Boolean, Enum as SAEnum, DateTime, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class StatusImpugnacaoEnum(str, enum.Enum):
    rascunho = "rascunho"
    revisao_ia = "revisao_ia"
    aprovada = "aprovada"
    enviada = "enviada"
    respondida = "respondida"
    indeferida = "indeferida"


class Impugnacao(Base):
    __tablename__ = "impugnacoes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    edital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("editais.id"), nullable=False)
    status: Mapped[StatusImpugnacaoEnum] = mapped_column(
        SAEnum(StatusImpugnacaoEnum, name="status_impugnacao_enum"), nullable=False, default=StatusImpugnacaoEnum.rascunho
    )
    motivos: Mapped[str] = mapped_column(Text, nullable=False)
    minuta_docx_s3: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    analise_ia: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    revisao_ia_modelo: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    prazo_impugnacao: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    alerta_prazo_enviado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    enviada_em: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resposta_orgao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    edital = relationship("Edital", lazy="select")
