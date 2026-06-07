import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, Text, Numeric, Boolean, Integer, Enum as SAEnum, DateTime, ForeignKey, UniqueConstraint, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class StatusFolhaEnum(str, enum.Enum):
    rascunho = "rascunho"
    calculada = "calculada"
    aprovada = "aprovada"
    enviada_banco = "enviada_banco"
    paga = "paga"


class TipoComprovanteEnum(str, enum.Enum):
    email = "email"
    whatsapp = "whatsapp"
    ambos = "ambos"
    nenhum = "nenhum"


class Funcionario(Base):
    __tablename__ = "funcionarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    cpf: Mapped[str] = mapped_column(String(14), unique=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    telefone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    cargo: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    departamento: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    salario_base: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    banco: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    agencia: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    conta: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tipo_conta: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    pix_chave: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    preferencia_comprovante: Mapped[TipoComprovanteEnum] = mapped_column(
        SAEnum(TipoComprovanteEnum, name="tipo_comprovante_enum"), nullable=False, default=TipoComprovanteEnum.email
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    itens_folha = relationship("ItemFolha", back_populates="funcionario", lazy="select")


class Folha(Base):
    __tablename__ = "folhas"
    __table_args__ = (
        UniqueConstraint("competencia", "sufixo_revisao", name="uq_folha_competencia_revisao"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    competencia: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    sufixo_revisao: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[StatusFolhaEnum] = mapped_column(
        SAEnum(StatusFolhaEnum, name="status_folha_enum"), nullable=False, default=StatusFolhaEnum.rascunho
    )
    total_bruto: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    total_descontos: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    total_liquido: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    cnab_s3: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    aprovada_por: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    aprovada_em: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    enviada_banco_em: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paga_em: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    itens = relationship("ItemFolha", back_populates="folha", lazy="select")


class ItemFolha(Base):
    __tablename__ = "itens_folha"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    folha_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("folhas.id"), nullable=False)
    funcionario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("funcionarios.id"), nullable=False)
    salario_base: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    outras_verbas: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # {"nome": valor}
    vale_transporte: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0, nullable=False)
    vale_refeicao: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0, nullable=False)
    horas_extras: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0, nullable=False)
    adicionais: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    inss_funcionario: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0, nullable=False)
    irrf: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0, nullable=False)
    outros_descontos: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    valor_bruto: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    total_descontos: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    valor_liquido: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    holerite_s3: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    folha = relationship("Folha", back_populates="itens", lazy="select")
    funcionario = relationship("Funcionario", back_populates="itens_folha", lazy="select")
