import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.recipe import Recipe
from app.models.integration import WhatsAppConfig
from app.models.tenant import Tenant
from app.core.dependencies import require_admin, get_current_user
from app.core.security import encrypt_secret, decrypt_secret
from app.services.cmv import calculate_recipe_cost
from app.services.whatsapp import send_message, format_ficha_tecnica, format_daily_report

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


class WhatsAppConfigIn(BaseModel):
    provider: str = "evolution_api"
    api_url: str
    api_key: str  # Será criptografada antes de salvar
    instance_name: str | None = None
    phone_number: str | None = None


class SendFichaRequest(BaseModel):
    product_id: uuid.UUID
    phone: str


class SendAlertRequest(BaseModel):
    phone: str
    message: str


@router.post("/config", status_code=status.HTTP_201_CREATED)
async def save_config(
    body: WhatsAppConfigIn,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(WhatsAppConfig).where(WhatsAppConfig.tenant_id == current_user.tenant_id))
    config = existing.scalar_one_or_none()

    encrypted_key = encrypt_secret(body.api_key)

    if config:
        config.provider = body.provider
        config.api_url = body.api_url
        config.api_key_encrypted = encrypted_key
        config.instance_name = body.instance_name
        config.phone_number = body.phone_number
        config.is_active = True
    else:
        config = WhatsAppConfig(
            tenant_id=current_user.tenant_id,
            provider=body.provider,
            api_url=body.api_url,
            api_key_encrypted=encrypted_key,
            instance_name=body.instance_name,
            phone_number=body.phone_number,
            is_active=True,
        )
        db.add(config)

    return {"message": "Configuração salva com sucesso"}


@router.post("/send-ficha")
async def send_ficha_tecnica(
    body: SendFichaRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    config_result = await db.execute(
        select(WhatsAppConfig).where(WhatsAppConfig.tenant_id == current_user.tenant_id, WhatsAppConfig.is_active == True)
    )
    config = config_result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="WhatsApp não configurado para este restaurante")

    product_result = await db.execute(
        select(Product).where(Product.id == body.product_id, Product.tenant_id == current_user.tenant_id)
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    recipe_result = await db.execute(select(Recipe).where(Recipe.product_id == body.product_id))
    recipe = recipe_result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Produto sem ficha técnica cadastrada")

    cost_data = await calculate_recipe_cost(db, recipe.id)
    # Inclui modo de preparo na ficha
    cost_data["preparation_method"] = product.preparation_method
    message = format_ficha_tecnica(product.name, cost_data)

    success = await send_message(
        config.api_url,
        config.api_key_encrypted,
        config.instance_name or "",
        body.phone,
        message,
        config.provider,
    )

    if not success:
        raise HTTPException(status_code=502, detail="Falha ao enviar mensagem via WhatsApp")

    return {"message": "Ficha técnica enviada com sucesso"}


@router.post("/send-daily-report")
async def send_daily_report(
    phone: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    config_result = await db.execute(
        select(WhatsAppConfig).where(WhatsAppConfig.tenant_id == current_user.tenant_id, WhatsAppConfig.is_active == True)
    )
    config = config_result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="WhatsApp não configurado")

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = tenant_result.scalar_one()

    products_result = await db.execute(
        select(Product).where(Product.tenant_id == current_user.tenant_id, Product.is_active == True)
    )
    products = products_result.scalars().all()

    report = {"total_products": len(products), "avg_cmv_pct": 0, "avg_margin": 0, "high_cmv_items": []}
    message = format_daily_report(tenant.name, report)

    success = await send_message(config.api_url, config.api_key_encrypted, config.instance_name or "", phone, message, config.provider)
    if not success:
        raise HTTPException(status_code=502, detail="Falha ao enviar relatório")

    return {"message": "Relatório enviado com sucesso"}
