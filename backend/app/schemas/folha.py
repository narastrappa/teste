from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel
from app.models.folha import StatusFolhaEnum, TipoComprovanteEnum


class FolhaCreate(BaseModel):
    competencia: str  # YYYY-MM
    sufixo_revisao: int = 0


class FolhaOut(BaseModel):
    id: UUID
    competencia: str
    sufixo_revisao: int
    status: StatusFolhaEnum
    total_bruto: Optional[Decimal]
    total_descontos: Optional[Decimal]
    total_liquido: Optional[Decimal]
    cnab_s3: Optional[str]
    aprovada_por: Optional[UUID]
    aprovada_em: Optional[datetime]
    enviada_banco_em: Optional[datetime]
    paga_em: Optional[datetime]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FuncionarioCreate(BaseModel):
    nome: str
    cpf: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    cargo: Optional[str] = None
    departamento: Optional[str] = None
    salario_base: Decimal
    banco: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None
    tipo_conta: Optional[str] = None
    pix_chave: Optional[str] = None
    preferencia_comprovante: TipoComprovanteEnum = TipoComprovanteEnum.email


class FuncionarioOut(BaseModel):
    id: UUID
    nome: str
    cpf: str
    email: Optional[str]
    telefone: Optional[str]
    cargo: Optional[str]
    departamento: Optional[str]
    salario_base: Decimal
    banco: Optional[str]
    agencia: Optional[str]
    conta: Optional[str]
    tipo_conta: Optional[str]
    pix_chave: Optional[str]
    preferencia_comprovante: TipoComprovanteEnum
    ativo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ItemFolhaCreate(BaseModel):
    vale_transporte: Decimal = Decimal("0")
    vale_refeicao: Decimal = Decimal("0")
    horas_extras: Decimal = Decimal("0")
    outras_verbas: Optional[Any] = None
    adicionais: Optional[Any] = None
    outros_descontos: Optional[Any] = None


class ItemFolhaOut(BaseModel):
    id: UUID
    folha_id: UUID
    funcionario_id: UUID
    salario_base: Decimal
    outras_verbas: Optional[Any]
    vale_transporte: Decimal
    vale_refeicao: Decimal
    horas_extras: Decimal
    adicionais: Optional[Any]
    inss_funcionario: Decimal
    irrf: Decimal
    outros_descontos: Optional[Any]
    valor_bruto: Decimal
    total_descontos: Decimal
    valor_liquido: Decimal
    holerite_s3: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CalculoFolhaResponse(BaseModel):
    folha_id: UUID
    itens: List[ItemFolhaOut]
    total_bruto: Decimal
    total_descontos: Decimal
    total_liquido: Decimal


class CNABResponse(BaseModel):
    folha_id: UUID
    cnab_s3: str
    message: str
