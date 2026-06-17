"""
Endpoint público de auto-cadastro: cria tenant + admin + assinatura Asaas.
Nenhuma autenticação necessária — é o fluxo de onboarding da landing page.
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, field_validator
from app.database import get_db
from app.models.tenant import Tenant, Unit
from app.models.user import User
from app.models.subscription import Subscription, PlanSlug, SubStatus, PLAN_PRICES
from app.core.security import hash_password
from app.core.lgpd import log_action
from app.services import asaas as asaas_svc
from app.config import settings
import re
import uuid

router = APIRouter(prefix="/register", tags=["Cadastro público"])

TRIAL_DAYS = 14


class RegisterRequest(BaseModel):
    # Restaurante
    restaurant_name: str
    slug: str | None = None
    cnpj: str | None = None
    phone: str | None = None

    # Admin
    admin_name: str
    admin_email: EmailStr
    admin_password: str

    # Plano
    plan: str = "basic"
    billing_type: str = "BOLETO"  # PIX | BOLETO | CREDIT_CARD

    # LGPD
    lgpd_consent: bool

    @field_validator("lgpd_consent")
    @classmethod
    def must_consent(cls, v):
        if not v:
            raise ValueError("Consentimento LGPD obrigatório")
        return v

    @field_validator("plan")
    @classmethod
    def valid_plan(cls, v):
        if v not in ("basic", "pro", "network"):
            raise ValueError("Plano inválido")
        return v

    @field_validator("admin_password")
    @classmethod
    def strong_password(cls, v):
        if len(v) < 8:
            raise ValueError("Senha mínima de 8 caracteres")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Senha não pode ter mais de 72 caracteres")
        return v


class RegisterResponse(BaseModel):
    tenant_id: str
    tenant_slug: str
    message: str
    trial_ends_at: str
    payment_url: str | None = None   # Link boleto/PIX Asaas
    is_trial: bool = True


def _make_slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug[:60]


@router.post("", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Verifica email único
    existing_user = await db.execute(select(User).where(User.email == body.admin_email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")

    # Gera slug único
    base_slug = body.slug or _make_slug(body.restaurant_name)
    slug = base_slug
    suffix = 1
    while True:
        existing = await db.execute(select(Tenant).where(Tenant.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    plan_enum = PlanSlug(body.plan)
    amount = PLAN_PRICES[plan_enum]
    trial_ends = datetime.now(timezone.utc) + timedelta(days=TRIAL_DAYS)

    # Cria tenant
    tenant = Tenant(
        name=body.restaurant_name,
        slug=slug,
        cnpj=body.cnpj,
        phone=body.phone,
        email=body.admin_email,
        plan=body.plan,
        is_active=True,
    )
    db.add(tenant)
    await db.flush()

    # Cria unidade padrão
    unit = Unit(tenant_id=tenant.id, name=body.restaurant_name, is_active=True)
    db.add(unit)
    await db.flush()

    # Cria usuário admin
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "")
    user = User(
        tenant_id=tenant.id,
        email=body.admin_email,
        hashed_password=hash_password(body.admin_password),
        name=body.admin_name,
        phone=body.phone,
        role="admin",
        is_active=True,
        lgpd_consent_at=datetime.now(timezone.utc),
        lgpd_ip=ip,
    )
    db.add(user)
    await db.flush()

    # Cria assinatura (trial)
    subscription = Subscription(
        tenant_id=tenant.id,
        plan=body.plan,
        status=SubStatus.trial,
        amount=amount,
        trial_ends_at=trial_ends,
    )
    db.add(subscription)

    payment_url = None

    # Tenta criar cliente e assinatura no Asaas (se API key configurada)
    if settings.asaas_api_key:
        try:
            customer = await asaas_svc.create_customer(
                name=body.restaurant_name,
                email=body.admin_email,
                phone=body.phone,
                cpf_cnpj=body.cnpj,
            )
            sub = await asaas_svc.create_subscription(
                customer_id=customer["id"],
                plan_name=body.plan.title(),
                amount=amount,
                billing_type=body.billing_type,
                next_due_date=trial_ends.date().isoformat(),
            )
            subscription.asaas_customer_id = customer["id"]
            subscription.asaas_subscription_id = sub["id"]
            payment_url = await asaas_svc.get_payment_link(sub["id"])
        except Exception:
            pass  # Trial segue mesmo sem Asaas configurado

    await log_action(db, tenant_id=tenant.id, user_id=user.id,
                     action="CREATE", entity="tenant_registration",
                     entity_id=str(tenant.id), ip_address=ip,
                     details={"plan": body.plan, "slug": slug})

    return RegisterResponse(
        tenant_id=str(tenant.id),
        tenant_slug=slug,
        message=f"Conta criada! Você tem {TRIAL_DAYS} dias de teste gratuito.",
        trial_ends_at=trial_ends.isoformat(),
        payment_url=payment_url,
        is_trial=True,
    )
