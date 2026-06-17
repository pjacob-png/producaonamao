from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.models.user import User
from app.models.tenant import Tenant
from app.core.security import verify_password, create_access_token
from app.core.lgpd import log_action
from app.core.dependencies import get_current_user, get_client_ip
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha inválidos")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conta desativada")

    # LGPD: exige consentimento no primeiro login
    if not user.lgpd_consent_at:
        if not body.lgpd_consent:
            raise HTTPException(
                status_code=status.HTTP_451_UNAVAILABLE_FOR_LEGAL_REASONS,
                detail="Consentimento LGPD obrigatório no primeiro acesso",
            )
        user.lgpd_consent_at = datetime.now(timezone.utc)
        user.lgpd_ip = get_client_ip(request)

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one()

    token = create_access_token(
        {
            "sub": str(user.id),
            "tenant_id": str(user.tenant_id),
            "role": user.role,
        },
        timedelta(minutes=settings.access_token_expire_minutes),
    )

    await log_action(
        db, tenant_id=user.tenant_id, user_id=user.id,
        action="LOGIN", entity="user", entity_id=str(user.id),
        ip_address=get_client_ip(request),
    )

    return TokenResponse(
        access_token=token,
        expires_in=settings.access_token_expire_minutes * 60,
        user_name=user.name,
        user_role=user.role,
        user_email=user.email,
        user_phone=user.phone,
        tenant_id=str(user.tenant_id),
        tenant_name=tenant.name,
        tenant_plan=tenant.plan,
    )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await log_action(
        db, tenant_id=current_user.tenant_id, user_id=current_user.id,
        action="LOGOUT", entity="user", entity_id=str(current_user.id),
        ip_address=get_client_ip(request),
    )
    return {"message": "Logout registrado com sucesso"}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "tenant_id": str(current_user.tenant_id),
    }
