import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.schemas.ingredient import IngredientCreate, IngredientUpdate, IngredientOut
from app.models.ingredient import Ingredient
from app.models.user import User
from app.core.dependencies import get_current_user, require_admin
from app.core.lgpd import log_action

router = APIRouter(prefix="/ingredients", tags=["Insumos"])


@router.get("", response_model=list[IngredientOut])
async def list_ingredients(
    search: str | None = Query(None),
    category: str | None = Query(None),
    is_active: bool | None = Query(None),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Ingredient).where(Ingredient.tenant_id == current_user.tenant_id)
    if search:
        q = q.where(Ingredient.name.ilike(f"%{search}%"))
    if category:
        q = q.where(Ingredient.category == category)
    if is_active is not None:
        q = q.where(Ingredient.is_active == is_active)
    q = q.order_by(Ingredient.name).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=IngredientOut, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    body: IngredientCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    ingredient = Ingredient(tenant_id=current_user.tenant_id, **body.model_dump())
    db.add(ingredient)
    await db.flush()
    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="CREATE", entity="ingredient", entity_id=str(ingredient.id))
    return ingredient


@router.get("/{ingredient_id}", response_model=IngredientOut)
async def get_ingredient(
    ingredient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == ingredient_id,
            Ingredient.tenant_id == current_user.tenant_id,
        )
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")
    return ingredient


@router.patch("/{ingredient_id}", response_model=IngredientOut)
async def update_ingredient(
    ingredient_id: uuid.UUID,
    body: IngredientUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == ingredient_id,
            Ingredient.tenant_id == current_user.tenant_id,
        )
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(ingredient, field, value)

    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="UPDATE", entity="ingredient", entity_id=str(ingredient_id))
    return ingredient


@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingredient(
    ingredient_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ingredient).where(
            Ingredient.id == ingredient_id,
            Ingredient.tenant_id == current_user.tenant_id,
        )
    )
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")

    ingredient.is_active = False  # Soft delete (preserva histórico de CMV)
    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="DELETE", entity="ingredient", entity_id=str(ingredient_id))
