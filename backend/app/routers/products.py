import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductPriceUpdate, ProductOut, ProductWithCMV
from app.models.product import Product
from app.models.recipe import Recipe
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user, require_admin
from app.core.lgpd import log_action
from app.services.cmv import calculate_recipe_cost, calculate_cmv_percentage, calculate_gross_margin
from app.services.markup import get_applicable_rule, compute_suggested_price
import aiofiles
import os
from app.config import settings

router = APIRouter(prefix="/products", tags=["Produtos"])


async def _check_code_unique(db, tenant_id, code: str, exclude_id=None):
    if not code:
        return
    q = select(Product).where(Product.tenant_id == tenant_id, Product.code == code)
    if exclude_id:
        q = q.where(Product.id != exclude_id)
    existing = (await db.execute(q)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail=f"Código '{code}' já está cadastrado em outro produto")


@router.get("", response_model=list[ProductOut])
async def list_products(
    search: str | None = Query(None),
    category_id: uuid.UUID | None = Query(None),
    abc_curve: str | None = Query(None),
    is_active: bool | None = Query(True),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Product).where(Product.tenant_id == current_user.tenant_id)
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    if category_id:
        q = q.where(Product.category_id == category_id)
    if abc_curve:
        q = q.where(Product.abc_curve == abc_curve)
    if is_active is not None:
        q = q.where(Product.is_active == is_active)
    q = q.order_by(Product.name).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await _check_code_unique(db, current_user.tenant_id, body.code)
    product = Product(tenant_id=current_user.tenant_id, **body.model_dump())
    db.add(product)
    await db.flush()
    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="CREATE", entity="product", entity_id=str(product.id))
    return product


@router.get("/{product_id}", response_model=ProductWithCMV)
async def get_product(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.tenant_id == current_user.tenant_id,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    product_dict = ProductWithCMV.model_validate(product)

    # Calcula CMV se houver receita
    recipe_result = await db.execute(select(Recipe).where(Recipe.product_id == product_id))
    recipe = recipe_result.scalar_one_or_none()

    if recipe:
        cost_data = await calculate_recipe_cost(db, recipe.id)
        cost = cost_data["cost_per_unit"]
        product_dict.cmv_value = cost

        if product.selling_price:
            product_dict.cmv_percentage = calculate_cmv_percentage(product.selling_price, cost)
            product_dict.gross_margin = calculate_gross_margin(product.selling_price, cost)

        # Preço sugerido pelo markup
        rule = await get_applicable_rule(db, current_user.tenant_id, product)
        if rule:
            product_dict.suggested_price = compute_suggested_price(cost, rule)

    return product_dict


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == current_user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    updates = body.model_dump(exclude_none=True)
    if "code" in updates:
        await _check_code_unique(db, current_user.tenant_id, updates["code"], exclude_id=product_id)
    for field, value in updates.items():
        setattr(product, field, value)

    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="UPDATE", entity="product", entity_id=str(product_id))
    return product


@router.patch("/{product_id}/price", response_model=ProductOut)
async def update_price(
    product_id: uuid.UUID,
    body: ProductPriceUpdate,
    current_user: User = Depends(get_current_user),  # Qualquer usuário pode atualizar preço
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == current_user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    product.selling_price = body.selling_price
    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="UPDATE", entity="product_price", entity_id=str(product_id),
                     details={"new_price": str(body.selling_price)})
    return product


@router.post("/{product_id}/photo")
async def upload_photo(
    product_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Formato inválido. Use JPEG, PNG ou WebP")

    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == current_user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    upload_dir = os.path.join(settings.local_upload_dir, str(current_user.tenant_id), "products")
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{product_id}.{ext}"
    path = os.path.join(upload_dir, filename)

    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)

    product.photo_url = f"/uploads/{current_user.tenant_id}/products/{filename}"
    return {"photo_url": product.photo_url}
