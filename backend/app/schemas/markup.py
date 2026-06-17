import uuid
from decimal import Decimal
from pydantic import BaseModel, field_validator


class MarkupRuleCreate(BaseModel):
    name: str
    applies_to: str   # "global", "category", "curve"
    category_id: uuid.UUID | None = None
    abc_curve: str | None = None
    markup_type: str  # "percentage_over_cost" ou "target_margin"
    markup_value: Decimal
    priority: int = 0

    @field_validator("applies_to")
    @classmethod
    def valid_applies_to(cls, v):
        if v not in ("global", "category", "curve"):
            raise ValueError("applies_to deve ser: global, category ou curve")
        return v

    @field_validator("markup_type")
    @classmethod
    def valid_markup_type(cls, v):
        if v not in ("percentage_over_cost", "target_margin"):
            raise ValueError("markup_type inválido")
        return v

    @field_validator("markup_value")
    @classmethod
    def positive_value(cls, v):
        if v <= 0:
            raise ValueError("markup_value deve ser positivo")
        return v

    @field_validator("abc_curve")
    @classmethod
    def valid_curve(cls, v):
        if v is not None and v not in ("A", "B", "C"):
            raise ValueError("abc_curve deve ser A, B ou C")
        return v


class MarkupRuleUpdate(BaseModel):
    name: str | None = None
    markup_value: Decimal | None = None
    priority: int | None = None
    is_active: bool | None = None


class MarkupRuleOut(MarkupRuleCreate):
    id: uuid.UUID
    tenant_id: uuid.UUID
    is_active: bool

    model_config = {"from_attributes": True}


class PriceSuggestionOut(BaseModel):
    product_id: uuid.UUID
    product_name: str
    cmv_value: Decimal
    rule_applied: str
    markup_type: str
    markup_value: Decimal
    suggested_price: Decimal
    gross_margin_pct: Decimal


class PromotionSuggestion(BaseModel):
    title: str
    type: str           # "combo", "desconto_curva_c", "brinde", "oferta_horario"
    description: str
    products: list[str]
    estimated_margin: str | None = None
