"""Auth endpoints: /api/auth/login, /api/auth/refresh."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.usuario import Usuario
from app.auth import (
    verify_password, hash_password, create_access_token,
    create_refresh_token, decode_token,
)
from app.schemas.usuario import (
    LoginRequest, TokenResponse, RefreshRequest, AccessTokenResponse,
    UsuarioCreate, UsuarioOut,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )
    if not user.ativo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário inativo")

    access_token = create_access_token(str(user.id), {"perfil": user.perfil.value})
    refresh_token = create_refresh_token(str(user.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    decoded = decode_token(payload.refresh_token)
    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    user_id = decoded.get("sub")
    result = await db.execute(select(Usuario).where(Usuario.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.ativo:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")

    access_token = create_access_token(str(user.id), {"perfil": user.perfil.value})
    return AccessTokenResponse(access_token=access_token)


@router.post("/register", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    """Cadastro de usuário (apenas para bootstrap inicial)."""
    result = await db.execute(select(Usuario).where(Usuario.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado")

    user = Usuario(
        nome=payload.nome,
        email=payload.email,
        senha_hash=hash_password(payload.senha),
        perfil=payload.perfil,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return UsuarioOut.model_validate(user)
