import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, Text, Numeric, Boolean, Integer, Enum as SAEnum, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class StatusEditalEnum(str, enum.Enum):
    novo = "novo"
    em_analise = "em_analise"
    proposta_enviada = "proposta_enviada"
    desclassificado = "desclassificado"
    vencedor = "vencedor"
    perdedor = "perdedor"


class ModalidadeEnum(str, enum.Enum):
    pregao = "pregao"
    concorrencia = "concorrencia"
    tomada_de_precos = "tomada_de_precos"
    convite = "convite"
    leilao = "leilao"
    dispensa = "dispensa"


class Edital(Base):
    __tablename__ = "editais"
    __table_args__ = (
        UniqueConstraint("numero", "portal_origem", name="uq_edital_numero_portal"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero: Mapped[str] = mapped_column(String(100), nullable=False)
    portal_origem: Mapped[str] = mapped_column(String(50), nullable=False)
    orgao: Mapped[str] = mapped_column(String(500), nullable=False)
    objeto: Mapped[str] = mapped_column(Text, nullable=False)
    modalidade: Mapped[ModalidadeEnum] = mapped_column(SAEnum(ModalidadeEnum), nullable=False)
    status: Mapped[StatusEditalEnum] = mapped_column(
        SAEnum(StatusEditalEnum), nullable=False, default=StatusEditalEnum.novo
    )
    uf: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)
    municipio: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    valor_estimado: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    data_abertura: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    data_publicacao: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    url_edital: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    url_portal: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    relevancia_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notificado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    historico_status: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    arquivos_s3: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class FiltroConfig(Base):
    __tablename__ = "filtro_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    palavras_chave: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    palavras_excluir: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    valor_minimo: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    valor_maximo: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    modalidades: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    ufs: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    portais: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
