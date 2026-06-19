import uuid
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, field_validator


class ProductBase(BaseModel):
    code: str | None = None
    name: str
    description: str | None = None
    preparation_method: str | None = None
    category_id: uuid.UUID | None = None
    abc_curve: str | None = None
    selling_price: Decimal | None = None
    unit_id: uuid.UUID | None = None


class ProductCreate(ProductBase):
    @field_validator("code")
    @classmethod
    def code_required(cls, v):
        if not v or not str(v).strip():
            raise ValueError("Código é obrigatório")
        return str(v).strip()


class ProductUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    description: str | None = None
    preparation_method: str | None = None
    category_id: uuid.UUID | None = None
    abc_curve: str | None = None
    is_active: bool | None = None


class ProductPriceUpdate(BaseModel):
    """Usuários comuns só podem atualizar o preço de venda."""
    selling_price: Decimal


class ProductOut(ProductBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    photo_url: str | None
    is_active: bool
    erp_code: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductWithCMV(ProductOut):
    """Produto com CMV calculado (retornado para admins)."""
    cmv_value: Decimal | None = None        # R$ custo total da receita
    cmv_percentage: Decimal | None = None   # % sobre o preço de venda
    suggested_price: Decimal | None = None  # Preço sugerido pelo markup
    gross_margin: Decimal | None = None     # Margem bruta %
