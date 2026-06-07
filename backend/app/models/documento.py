import enum
import uuid
from datetime import datetime, timezone, date
from typing import Optional

from sqlalchemy import String, Text, Boolean, Integer, Float, Enum as SAEnum, DateTime, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class TipoDocumentoEnum(str, enum.Enum):
    certidao_federal = "certidao_federal"
    certidao_estadual = "certidao_estadual"
    certidao_municipal = "certidao_municipal"
    certidao_trabalhista = "certidao_trabalhista"
    certidao_fgts = "certidao_fgts"
    contrato_social = "contrato_social"
    balanco = "balanco"
    atestado_capacidade = "atestado_capacidade"
    procuracao = "procuracao"
    outros = "outros"


class StatusDocumentoEnum(str, enum.Enum):
    valido = "valido"
    a_vencer = "a_vencer"
    vencido = "vencido"
    em_renovacao = "em_renovacao"


class Documento(Base):
    __tablename__ = "documentos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo: Mapped[TipoDocumentoEnum] = mapped_column(SAEnum(TipoDocumentoEnum), nullable=False)
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[StatusDocumentoEnum] = mapped_column(
        SAEnum(StatusDocumentoEnum), nullable=False, default=StatusDocumentoEnum.valido
    )
    s3_key: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    nome_arquivo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    versao: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    historico_versoes: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    data_emissao: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    data_vencimento: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    dias_alerta: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    alerta_enviado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ocr_confianca: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ocr_texto: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ocr_snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # for manual confirmation
    ocr_confirmado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    auto_renovavel: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
