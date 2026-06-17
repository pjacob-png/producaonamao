from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.tenant import Tenant
from app.core.dependencies import get_current_user
from app.services.ai_chat import chat_stream, build_restaurant_context

router = APIRouter(prefix="/ai-chat", tags=["Consultor IA"])


class ChatMessage(BaseModel):
    role: str  # "user" ou "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/stream")
async def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream de resposta do Chef Consultor IA."""
    if len(body.messages) == 0:
        raise HTTPException(status_code=400, detail="Mensagens não podem estar vazias")

    # Monta contexto do restaurante
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = tenant_result.scalar_one()

    products_result = await db.execute(
        select(Product).where(Product.tenant_id == current_user.tenant_id, Product.is_active == True)
    )
    products = [{"name": p.name, "abc_curve": p.abc_curve, "preparation_method": p.preparation_method} for p in products_result.scalars().all()]

    categories_result = await db.execute(
        select(Category).where(Category.tenant_id == current_user.tenant_id)
    )
    categories = [c.name for c in categories_result.scalars().all()]

    context = await build_restaurant_context(products, categories, tenant.name)

    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    async def generate():
        async for chunk in chat_stream(messages, context):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")
