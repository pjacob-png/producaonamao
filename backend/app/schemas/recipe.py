import uuid
from decimal import Decimal
from pydantic import BaseModel, field_validator


class RecipeIngredientIn(BaseModel):
    ingredient_id: uuid.UUID
    quantity: Decimal
    unit_of_measure: str
    waste_percentage: Decimal = Decimal("0")

    @field_validator("quantity")
    @classmethod
    def positive_qty(cls, v):
        if v <= 0:
            raise ValueError("Quantidade deve ser positiva")
        return v

    @field_validator("waste_percentage")
    @classmethod
    def valid_waste(cls, v):
        if not (0 <= v < 100):
            raise ValueError("Percentual de perda deve estar entre 0 e 99,99")
        return v


class RecipeIngredientOut(BaseModel):
    id: uuid.UUID
    ingredient_id: uuid.UUID
    ingredient_name: str
    ingredient_unit: str
    quantity: Decimal
    unit_of_measure: str
    waste_percentage: Decimal
    unit_cost: Decimal
    line_cost: Decimal  # quantity_with_waste × unit_cost

    model_config = {"from_attributes": True}


class RecipeCreate(BaseModel):
    product_id: uuid.UUID
    yield_quantity: Decimal = Decimal("1")
    yield_unit: str = "un"
    notes: str | None = None
    ingredients: list[RecipeIngredientIn]


class RecipeUpdate(BaseModel):
    yield_quantity: Decimal | None = None
    yield_unit: str | None = None
    notes: str | None = None
    ingredients: list[RecipeIngredientIn] | None = None


class RecipeOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    yield_quantity: Decimal
    yield_unit: str
    notes: str | None
    ingredients: list[RecipeIngredientOut]
    total_cost: Decimal        # Custo total da receita
    cost_per_unit: Decimal     # Custo por unidade produzida

    model_config = {"from_attributes": True}


class MarkupSchema(BaseModel):
    id: uuid.UUID
    name: str
    applies_to: str
    category_id: uuid.UUID | None
    abc_curve: str | None
    markup_type: str
    markup_value: Decimal
    priority: int
    is_active: bool

    model_config = {"from_attributes": True}
