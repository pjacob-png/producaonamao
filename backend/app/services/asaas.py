"""
Integração com Asaas — pagamento recorrente (PIX, boleto, cartão).
Documentação: https://asaasv3.docs.apiary.io/
"""
from __future__ import annotations
from decimal import Decimal
import httpx
from app.config import settings


def _headers() -> dict:
    return {"access_token": settings.asaas_api_key, "Content-Type": "application/json"}


def _base() -> str:
    if settings.asaas_sandbox:
        return "https://sandbox.asaas.com/api/v3"
    return "https://api.asaas.com/v3"


async def create_customer(
    name: str,
    email: str,
    phone: str | None = None,
    cpf_cnpj: str | None = None,
) -> dict:
    payload = {"name": name, "email": email}
    if phone:
        payload["mobilePhone"] = phone
    if cpf_cnpj:
        payload["cpfCnpj"] = cpf_cnpj.replace(".", "").replace("/", "").replace("-", "")

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(f"{_base()}/customers", json=payload, headers=_headers())
        r.raise_for_status()
        return r.json()


async def create_subscription(
    customer_id: str,
    plan_name: str,
    amount: Decimal,
    billing_type: str = "BOLETO",  # PIX | BOLETO | CREDIT_CARD
    next_due_date: str | None = None,  # "YYYY-MM-DD"
) -> dict:
    from datetime import date, timedelta
    due = next_due_date or (date.today() + timedelta(days=1)).isoformat()
    payload = {
        "customer": customer_id,
        "billingType": billing_type,
        "value": float(amount),
        "nextDueDate": due,
        "cycle": "MONTHLY",
        "description": f"Produção na Mão — Plano {plan_name}",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(f"{_base()}/subscriptions", json=payload, headers=_headers())
        r.raise_for_status()
        return r.json()


async def get_subscription(asaas_sub_id: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(f"{_base()}/subscriptions/{asaas_sub_id}", headers=_headers())
        r.raise_for_status()
        return r.json()


async def cancel_subscription(asaas_sub_id: str) -> bool:
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.delete(f"{_base()}/subscriptions/{asaas_sub_id}", headers=_headers())
        return r.status_code in (200, 204)


async def get_payment_link(asaas_sub_id: str) -> str | None:
    """Retorna o link do boleto/PIX da primeira cobrança da assinatura."""
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(f"{_base()}/subscriptions/{asaas_sub_id}/payments", headers=_headers())
        if r.status_code != 200:
            return None
        payments = r.json().get("data", [])
        if payments:
            return payments[0].get("invoiceUrl") or payments[0].get("bankSlipUrl")
        return None
