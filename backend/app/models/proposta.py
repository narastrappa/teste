import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, Text, Numeric, Boolean, Integer, Float, Enum as SAEnum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class StatusPropostaEnum(str, enum.Enum):
    rascunho = "rascunho"
    revisao_ia = "revisao_ia"
    aprovada = "aprovada"
    enviada = "enviada"
    habilitada = "habilitada"
    desclassificada = "desclassificada"
    vencedora = "vencedora"
    perdida = "perdida"


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    variaveis: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)  # proposta|impugnacao|etc
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class Proposta(Base):
    __tablename__ = "propostas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    edital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("editais.id"), nullable=False)
    template_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=True)
    versao: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[StatusPropostaEnum] = mapped_column(
        SAEnum(StatusPropostaEnum, name="status_proposta_enum"), nullable=False, default=StatusPropostaEnum.rascunho
    )
    valor_proposto: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    descricao_tecnica: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    conteudo_docx_s3: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    pacote_s3: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    revisao_ia_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    revisao_ia_detalhes: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    revisao_ia_modelo: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    enviada_em: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    protocolo_envio: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    imutavel: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    alerta_inexequibilidade: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    edital = relationship("Edital", lazy="select")
    template = relationship("Template", lazy="select")
