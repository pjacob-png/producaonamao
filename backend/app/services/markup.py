"""Motor de markup e preço sugerido."""
from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.markup import MarkupRule, MarkupAppliesTo, MarkupType
from app.models.product import Product


async def get_applicable_rule(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    product: Product,
) -> MarkupRule | None:
    """
    Busca a regra de markup mais específica para o produto.
    Ordem de prioridade (maior priority vence, depois mais específica):
      curve/category > global
    """
    result = await db.execute(
        select(MarkupRule)
        .where(
            MarkupRule.tenant_id == tenant_id,
            MarkupRule.is_active == True,
        )
        .order_by(MarkupRule.priority.desc())
    )
    rules = result.scalars().all()

    # Filtra regras aplicáveis ao produto, respeitando prioridade
    for rule in rules:
        if rule.applies_to == MarkupAppliesTo.curve:
            if rule.abc_curve == product.abc_curve:
                return rule
        elif rule.applies_to == MarkupAppliesTo.category:
            if rule.category_id == product.category_id:
                return rule
        elif rule.applies_to == MarkupAppliesTo.global_:
            return rule

    return None


def compute_suggested_price(cost: Decimal, rule: MarkupRule) -> Decimal:
    """Aplica a regra de markup ao custo e retorna o preço sugerido."""
    if rule.markup_type == MarkupType.percentage_over_cost:
        # Preço = Custo × (1 + markup% / 100)
        suggested = cost * (1 + rule.markup_value / 100)
    else:
        # target_margin: Preço = Custo / (1 - margem%)
        margin_frac = rule.markup_value / 100
        if margin_frac >= 1:
            return Decimal("0")
        suggested = cost / (1 - margin_frac)

    return suggested.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
