import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.schemas.markup import MarkupRuleCreate, MarkupRuleUpdate, MarkupRuleOut, PriceSuggestionOut, PromotionSuggestion
from app.models.markup import MarkupRule
from app.models.product import Product
from app.models.recipe import Recipe
from app.models.user import User
from app.core.dependencies import get_current_user, require_admin
from app.services.markup import get_applicable_rule, compute_suggested_price
from app.services.cmv import calculate_recipe_cost, calculate_cmv_percentage, calculate_gross_margin
from app.services.promotion import generate_promotion_suggestions

router = APIRouter(prefix="/markup", tags=["Markup & Preços"])


@router.get("/rules", response_model=list[MarkupRuleOut])
async def list_rules(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MarkupRule)
        .where(MarkupRule.tenant_id == current_user.tenant_id)
        .order_by(MarkupRule.priority.desc())
    )
    return result.scalars().all()


@router.post("/rules", response_model=MarkupRuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(
    body: MarkupRuleCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rule = MarkupRule(tenant_id=current_user.tenant_id, **body.model_dump())
    db.add(rule)
    await db.flush()
    return rule


@router.patch("/rules/{rule_id}", response_model=MarkupRuleOut)
async def update_rule(
    rule_id: uuid.UUID,
    body: MarkupRuleUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MarkupRule).where(MarkupRule.id == rule_id, MarkupRule.tenant_id == current_user.tenant_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(rule, field, value)
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MarkupRule).where(MarkupRule.id == rule_id, MarkupRule.tenant_id == current_user.tenant_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    await db.delete(rule)


@router.get("/suggest-prices", response_model=list[PriceSuggestionOut])
async def suggest_prices(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Calcula o preço sugerido para todos os produtos com receita cadastrada."""
    products_result = await db.execute(
        select(Product).where(Product.tenant_id == current_user.tenant_id, Product.is_active == True)
    )
    products = products_result.scalars().all()

    suggestions = []
    for product in products:
        recipe_result = await db.execute(select(Recipe).where(Recipe.product_id == product.id))
        recipe = recipe_result.scalar_one_or_none()
        if not recipe:
            continue

        cost_data = await calculate_recipe_cost(db, recipe.id)
        cost = cost_data["cost_per_unit"]
        rule = await get_applicable_rule(db, current_user.tenant_id, product)
        if not rule:
            continue

        suggested = compute_suggested_price(cost, rule)
        margin = calculate_gross_margin(suggested, cost)

        suggestions.append(PriceSuggestionOut(
            product_id=product.id,
            product_name=product.name,
            cmv_value=cost,
            rule_applied=rule.name,
            markup_type=rule.markup_type,
            markup_value=rule.markup_value,
            suggested_price=suggested,
            gross_margin_pct=margin,
        ))

    return suggestions


@router.get("/promotions", response_model=list[PromotionSuggestion])
async def get_promotion_suggestions(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Sugestões de promoções baseadas em IA e gastronomia brasileira."""
    from app.models.tenant import Tenant
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = tenant_result.scalar_one()

    products_result = await db.execute(
        select(Product).where(Product.tenant_id == current_user.tenant_id, Product.is_active == True)
    )
    products = products_result.scalars().all()
    summary = [{"name": p.name, "abc_curve": p.abc_curve, "category_id": str(p.category_id)} for p in products]

    raw = await generate_promotion_suggestions(summary, tenant.name)
    return [PromotionSuggestion(**item) for item in raw]
