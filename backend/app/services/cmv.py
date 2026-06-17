"""Motor de cálculo de CMV (Custo da Mercadoria Vendida)."""
from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.recipe import Recipe, RecipeIngredient
from app.models.ingredient import Ingredient


async def calculate_recipe_cost(
    db: AsyncSession,
    recipe_id: uuid.UUID,
) -> dict:
    """
    Retorna o custo total da receita e por unidade produzida.
    Considera o percentual de desperdício (waste_percentage) de cada linha.
    """
    result = await db.execute(
        select(Recipe)
        .options(selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient))
        .where(Recipe.id == recipe_id)
    )
    recipe = result.scalar_one_or_none()
    if not recipe:
        return {"total_cost": Decimal("0"), "cost_per_unit": Decimal("0"), "lines": []}

    lines = []
    total_cost = Decimal("0")

    for ri in recipe.ingredients:
        ingredient: Ingredient = ri.ingredient
        # Quantidade real considerando desperdício
        effective_qty = ri.quantity * (1 + ri.waste_percentage / 100)
        line_cost = (effective_qty * ingredient.unit_cost).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        total_cost += line_cost
        lines.append({
            "ingredient_id": str(ingredient.id),
            "ingredient_name": ingredient.name,
            "ingredient_unit": ingredient.unit_of_measure,
            "quantity": ri.quantity,
            "unit_of_measure": ri.unit_of_measure,
            "waste_percentage": ri.waste_percentage,
            "unit_cost": ingredient.unit_cost,
            "line_cost": line_cost,
        })

    yield_qty = recipe.yield_quantity or Decimal("1")
    cost_per_unit = (total_cost / yield_qty).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "total_cost": total_cost.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "cost_per_unit": cost_per_unit,
        "lines": lines,
        "recipe_id": str(recipe_id),
    }


def calculate_cmv_percentage(selling_price: Decimal, cost: Decimal) -> Decimal:
    if selling_price <= 0:
        return Decimal("0")
    return ((cost / selling_price) * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_gross_margin(selling_price: Decimal, cost: Decimal) -> Decimal:
    if selling_price <= 0:
        return Decimal("0")
    return (((selling_price - cost) / selling_price) * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
