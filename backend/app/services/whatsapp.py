"""
Integração WhatsApp via Evolution API (padrão no Brasil) ou Twilio.
Funções: envio de ficha técnica, alertas de CMV, relatórios diários.
"""
from __future__ import annotations
from decimal import Decimal
import httpx
from app.core.security import decrypt_secret


async def send_message(
    api_url: str,
    api_key_encrypted: str,
    instance_name: str,
    phone: str,
    message: str,
    provider: str = "evolution_api",
) -> bool:
    api_key = decrypt_secret(api_key_encrypted)
    phone_clean = "".join(c for c in phone if c.isdigit())

    if provider == "evolution_api":
        return await _send_evolution(api_url, api_key, instance_name, phone_clean, message)
    elif provider == "twilio":
        return await _send_twilio(api_url, api_key, phone_clean, message)
    return False


async def _send_evolution(
    api_url: str, api_key: str, instance: str, phone: str, message: str
) -> bool:
    url = f"{api_url.rstrip('/')}/message/sendText/{instance}"
    payload = {
        "number": f"55{phone}@s.whatsapp.net",
        "options": {"delay": 1200},
        "textMessage": {"text": message},
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload, headers={"apikey": api_key})
        return resp.status_code in (200, 201)


async def _send_twilio(api_url: str, api_key: str, phone: str, message: str) -> bool:
    # api_key formato: "account_sid:auth_token"
    parts = api_key.split(":", 1)
    if len(parts) != 2:
        return False
    account_sid, auth_token = parts
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            url,
            data={"From": f"whatsapp:{api_url}", "To": f"whatsapp:+55{phone}", "Body": message},
            auth=(account_sid, auth_token),
        )
        return resp.status_code == 201


def format_ficha_tecnica(product_name: str, recipe_data: dict) -> str:
    lines = [
        f"*FICHA TÉCNICA — {product_name.upper()}*",
        f"Rendimento: {recipe_data.get('yield_quantity', 1)} {recipe_data.get('yield_unit', 'un')}",
        "",
        "*Ingredientes:*",
    ]
    for ing in recipe_data.get("lines", []):
        waste = f" (+{ing['waste_percentage']}% perda)" if ing["waste_percentage"] > 0 else ""
        lines.append(f"  • {ing['ingredient_name']}: {ing['quantity']} {ing['unit_of_measure']}{waste}")

    if recipe_data.get("notes"):
        lines += ["", f"*Observações:* {recipe_data['notes']}"]

    lines += [
        "",
        f"*Custo total: R$ {recipe_data.get('total_cost', 0):.2f}*",
        f"*Custo/unidade: R$ {recipe_data.get('cost_per_unit', 0):.2f}*",
        "",
        "_Enviado pelo Produção na Mão_",
    ]
    return "\n".join(lines)


def format_cmv_alert(product_name: str, cmv_pct: Decimal, threshold: Decimal) -> str:
    return (
        f"⚠️ *ALERTA DE CMV — {product_name}*\n\n"
        f"CMV atual: *{cmv_pct:.1f}%* (limite: {threshold:.1f}%)\n"
        f"Revise o preço de venda ou os custos dos insumos.\n\n"
        f"_Produção na Mão_"
    )


def format_daily_report(tenant_name: str, report: dict) -> str:
    lines = [
        f"📊 *RELATÓRIO DIÁRIO — {tenant_name.upper()}*",
        "",
        f"Total de produtos ativos: {report.get('total_products', 0)}",
        f"CMV médio do cardápio: {report.get('avg_cmv_pct', 0):.1f}%",
        f"Margem bruta média: {report.get('avg_margin', 0):.1f}%",
        "",
        "*Itens com CMV acima de 40%:*",
    ]
    for item in report.get("high_cmv_items", []):
        lines.append(f"  ⚠️ {item['name']}: {item['cmv_pct']:.1f}%")

    lines += ["", "_Produção na Mão_"]
    return "\n".join(lines)
