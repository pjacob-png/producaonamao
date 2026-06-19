import uuid
from decimal import Decimal
from sqlalchemy import String, Boolean, ForeignKey, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import relationship, mapped_column, Mapped
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from app.models._base import TimestampMixin, new_uuid


class Ingredient(Base, TimestampMixin):
    __tablename__ = "ingredients"
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_ingredients_tenant_code"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    # unit_id nulo = insumo compartilhado entre todas as unidades
    unit_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("units.id", ondelete="SET NULL"))

    code: Mapped[str | None] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    unit_of_measure: Mapped[str] = mapped_column(String(20), nullable=False)  # kg, g, L, ml, un
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    supplier: Mapped[str | None] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ERP sync
    erp_code: Mapped[str | None] = mapped_column(String(100))

    tenant = relationship("Tenant", back_populates="ingredients")
    recipe_ingredients = relationship("RecipeIngredient", back_populates="ingredient")
