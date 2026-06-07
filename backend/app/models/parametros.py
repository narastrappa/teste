import uuid
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, Numeric, Boolean, Enum as SAEnum, DateTime, Date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class TabelaIRRF(Base):
    __tablename__ = "tabela_irrf"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    faixa_min: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    faixa_max: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    aliquota: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)  # e.g. 0.075
    deducao: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    vigencia_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    vigencia_fim: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class TabelaINSS(Base):
    __tablename__ = "tabela_inss"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    faixa_min: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    faixa_max: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    aliquota: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    vigencia_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    vigencia_fim: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class FeriadoNacional(Base):
    __tablename__ = "feriados_nacionais"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    descricao: Mapped[str] = mapped_column(String(200), nullable=False)
    uf: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)  # None = nacional
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AdaptadorPortal(Base):
    __tablename__ = "adaptadores_portal"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portal: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    seletores: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    endpoint_base: Mapped[str] = mapped_column(String(500), nullable=False)
    tipo_autenticacao: Mapped[str] = mapped_column(String(50), nullable=False, default="none")
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
