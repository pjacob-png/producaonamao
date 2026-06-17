from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.product import Product
from app.models.recipe import Recipe
from app.models.user import User
from app.core.dependencies import require_admin
from app.services.cmv import calculate_recipe_cost, calculate_cmv_percentage, calculate_gross_margin
from app.services.markup import get_applicable_rule, compute_suggested_price

router = APIRouter(prefix="/reports", tags=["Relatórios"])


@router.get("/cmv-overview")
async def cmv_overview(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """CMV de todos os produtos com receita cadastrada."""
    products_result = await db.execute(
        select(Product).where(Product.tenant_id == current_user.tenant_id, Product.is_active == True)
    )
    products = products_result.scalars().all()

    items = []
    total_cmv = 0
    count = 0

    for product in products:
        recipe_result = await db.execute(select(Recipe).where(Recipe.product_id == product.id))
        recipe = recipe_result.scalar_one_or_none()
        if not recipe:
            continue

        cost_data = await calculate_recipe_cost(db, recipe.id)
        cost = cost_data["cost_per_unit"]
        cmv_pct = calculate_cmv_percentage(product.selling_price or cost * 3, cost)
        margin = calculate_gross_margin(product.selling_price or cost * 3, cost)

        rule = await get_applicable_rule(db, current_user.tenant_id, product)
        suggested = compute_suggested_price(cost, rule) if rule else None

        items.append({
            "product_id": str(product.id),
            "product_name": product.name,
            "abc_curve": product.abc_curve,
            "cost_per_unit": float(cost),
            "selling_price": float(product.selling_price) if product.selling_price else None,
            "cmv_pct": float(cmv_pct),
            "gross_margin_pct": float(margin),
            "suggested_price": float(suggested) if suggested else None,
            "price_gap": float(suggested - product.selling_price) if suggested and product.selling_price else None,
        })
        total_cmv += float(cmv_pct)
        count += 1

    items.sort(key=lambda x: x["cmv_pct"], reverse=True)

    return {
        "items": items,
        "summary": {
            "total_products_with_recipe": count,
            "avg_cmv_pct": round(total_cmv / count, 2) if count else 0,
            "high_cmv_count": sum(1 for i in items if i["cmv_pct"] > 40),
            "products_below_suggested": sum(1 for i in items if i.get("price_gap") and i["price_gap"] > 0),
        },
    }


@router.get("/abc-curve")
async def abc_curve_report(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Distribuição de produtos por curva ABC."""
    products_result = await db.execute(
        select(Product).where(Product.tenant_id == current_user.tenant_id, Product.is_active == True)
    )
    products = products_result.scalars().all()

    distribution = {"A": [], "B": [], "C": [], "sem_curva": []}
    for p in products:
        key = p.abc_curve if p.abc_curve else "sem_curva"
        distribution[key].append({"id": str(p.id), "name": p.name})

    return {
        "distribution": distribution,
        "counts": {k: len(v) for k, v in distribution.items()},
        "total": len(products),
    }
