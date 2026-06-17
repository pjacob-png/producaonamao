import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeOut, RecipeIngredientOut
from app.models.recipe import Recipe, RecipeIngredient
from app.models.product import Product
from app.models.ingredient import Ingredient
from app.models.user import User
from app.core.dependencies import get_current_user, require_admin
from app.core.lgpd import log_action
from app.services.cmv import calculate_recipe_cost

router = APIRouter(prefix="/recipes", tags=["Fichas Técnicas"])


async def _load_recipe_out(db: AsyncSession, recipe: Recipe, product: Product) -> RecipeOut:
    cost_data = await calculate_recipe_cost(db, recipe.id)
    lines = []
    for line in cost_data["lines"]:
        lines.append(RecipeIngredientOut(
            id=uuid.UUID(line["ingredient_id"]),
            ingredient_id=uuid.UUID(line["ingredient_id"]),
            ingredient_name=line["ingredient_name"],
            ingredient_unit=line["ingredient_unit"],
            quantity=line["quantity"],
            unit_of_measure=line["unit_of_measure"],
            waste_percentage=line["waste_percentage"],
            unit_cost=line["unit_cost"],
            line_cost=line["line_cost"],
        ))
    return RecipeOut(
        id=recipe.id,
        product_id=recipe.product_id,
        product_name=product.name,
        yield_quantity=recipe.yield_quantity,
        yield_unit=recipe.yield_unit,
        notes=recipe.notes,
        ingredients=lines,
        total_cost=cost_data["total_cost"],
        cost_per_unit=cost_data["cost_per_unit"],
    )


@router.post("", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    body: RecipeCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    # Valida produto do tenant
    prod_result = await db.execute(
        select(Product).where(Product.id == body.product_id, Product.tenant_id == current_user.tenant_id)
    )
    product = prod_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    existing = await db.execute(select(Recipe).where(Recipe.product_id == body.product_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Produto já possui ficha técnica. Use PATCH para editar.")

    recipe = Recipe(
        product_id=body.product_id,
        yield_quantity=body.yield_quantity,
        yield_unit=body.yield_unit,
        notes=body.notes,
    )
    db.add(recipe)
    await db.flush()

    for ing_in in body.ingredients:
        ing_result = await db.execute(
            select(Ingredient).where(
                Ingredient.id == ing_in.ingredient_id,
                Ingredient.tenant_id == current_user.tenant_id,
            )
        )
        if not ing_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Insumo {ing_in.ingredient_id} não encontrado")
        db.add(RecipeIngredient(
            recipe_id=recipe.id,
            ingredient_id=ing_in.ingredient_id,
            quantity=ing_in.quantity,
            unit_of_measure=ing_in.unit_of_measure,
            waste_percentage=ing_in.waste_percentage,
        ))

    await db.flush()
    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="CREATE", entity="recipe", entity_id=str(recipe.id))

    return await _load_recipe_out(db, recipe, product)


@router.get("/product/{product_id}", response_model=RecipeOut)
async def get_recipe_by_product(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prod_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == current_user.tenant_id)
    )
    product = prod_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    recipe_result = await db.execute(select(Recipe).where(Recipe.product_id == product_id))
    recipe = recipe_result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Ficha técnica não cadastrada para este produto")

    return await _load_recipe_out(db, recipe, product)


@router.patch("/{recipe_id}", response_model=RecipeOut)
async def update_recipe(
    recipe_id: uuid.UUID,
    body: RecipeUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    recipe_result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = recipe_result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Ficha não encontrada")

    prod_result = await db.execute(
        select(Product).where(Product.id == recipe.product_id, Product.tenant_id == current_user.tenant_id)
    )
    product = prod_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=403, detail="Acesso negado")

    if body.yield_quantity is not None:
        recipe.yield_quantity = body.yield_quantity
    if body.yield_unit is not None:
        recipe.yield_unit = body.yield_unit
    if body.notes is not None:
        recipe.notes = body.notes

    if body.ingredients is not None:
        # Substitui ingredientes completamente
        del_result = await db.execute(select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id))
        for ri in del_result.scalars().all():
            await db.delete(ri)
        await db.flush()

        for ing_in in body.ingredients:
            db.add(RecipeIngredient(
                recipe_id=recipe_id,
                ingredient_id=ing_in.ingredient_id,
                quantity=ing_in.quantity,
                unit_of_measure=ing_in.unit_of_measure,
                waste_percentage=ing_in.waste_percentage,
            ))
        await db.flush()

    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="UPDATE", entity="recipe", entity_id=str(recipe_id))

    return await _load_recipe_out(db, recipe, product)
