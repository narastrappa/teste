from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.usuario import PerfilEnum


class UsuarioCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    senha: str = Field(..., min_length=6)
    perfil: PerfilEnum = PerfilEnum.readonly


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    perfil: Optional[PerfilEnum] = None
    ativo: Optional[bool] = None


class UsuarioOut(BaseModel):
    id: UUID
    nome: str
    email: str
    perfil: PerfilEnum
    ativo: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
