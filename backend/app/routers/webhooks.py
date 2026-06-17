"""
Webhook do Asaas: ativa/desativa tenants conforme status de pagamento.
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.models.subscription import Subscription, SubStatus
from app.models.tenant import Tenant
from app.config import settings

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/asaas")
async def asaas_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Valida token de segurança do Asaas
    token = request.headers.get("asaas-webhook-token", "")
    if settings.asaas_webhook_token and token != settings.asaas_webhook_token:
        raise HTTPException(status_code=401, detail="Token inválido")

    payload = await request.json()
    event = payload.get("event", "")
    data = payload.get("payment", {}) or payload.get("subscription", {})

    subscription_id = data.get("subscription")

    if not subscription_id:
        return {"ok": True}

    sub_result = await db.execute(
        select(Subscription).where(Subscription.asaas_subscription_id == subscription_id)
    )
    subscription = sub_result.scalar_one_or_none()
    if not subscription:
        return {"ok": True}

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == subscription.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        return {"ok": True}

    # Mapeamento de eventos → status
    if event in ("PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"):
        subscription.status = SubStatus.active
        subscription.current_period_end = datetime.now(timezone.utc) + timedelta(days=32)
        tenant.is_active = True

    elif event in ("PAYMENT_OVERDUE",):
        subscription.status = SubStatus.overdue
        # Mantém acesso por 7 dias antes de desativar
        # (lógica de grace period pode ser adicionada aqui)

    elif event in ("PAYMENT_DELETED", "SUBSCRIPTION_DELETED"):
        subscription.status = SubStatus.cancelled
        subscription.cancelled_at = datetime.now(timezone.utc)
        # Não desativa imediatamente — aguarda fim do período atual

    return {"ok": True}
