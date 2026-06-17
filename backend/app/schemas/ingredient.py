import uuid
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, field_validator


VALID_UNITS = {"kg", "g", "L", "ml", "un", "cx", "pc", "pct", "lt", "oz"}


class IngredientBase(BaseModel):
    code: str | None = None
    name: str
    category: str | None = None
    unit_of_measure: str
    unit_cost: Decimal
    supplier: str | None = None
    notes: str | None = None
    unit_id: uuid.UUID | None = None

    @field_validator("unit_of_measure")
    @classmethod
    def valid_unit(cls, v):
        if v not in VALID_UNITS:
            raise ValueError(f"Unidade inválida. Use: {', '.join(sorted(VALID_UNITS))}")
        return v

    @field_validator("unit_cost")
    @classmethod
    def positive_cost(cls, v):
        if v < 0:
            raise ValueError("Custo não pode ser negativo")
        return v


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    category: str | None = None
    unit_of_measure: str | None = None
    unit_cost: Decimal | None = None
    supplier: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class IngredientOut(IngredientBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    is_active: bool
    erp_code: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
