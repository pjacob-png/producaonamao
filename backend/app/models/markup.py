import uuid
import enum
from decimal import Decimal
from sqlalchemy import String, Boolean, ForeignKey, Numeric, Integer, Enum as SAEnum
from sqlalchemy.orm import relationship, mapped_column, Mapped
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from app.models._base import TimestampMixin, new_uuid


class MarkupAppliesTo(str, enum.Enum):
    global_ = "global"
    category = "category"
    curve = "curve"


class MarkupType(str, enum.Enum):
    percentage_over_cost = "percentage_over_cost"   # Preço = Custo × (1 + markup%)
    target_margin = "target_margin"                 # Preço = Custo / (1 - margem%)


class MarkupRule(Base, TimestampMixin):
    """Regra de markup configurável pelo proprietário."""
    __tablename__ = "markup_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    applies_to: Mapped[str] = mapped_column(SAEnum(MarkupAppliesTo), nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"))
    abc_curve: Mapped[str | None] = mapped_column(String(1))  # "A", "B" ou "C"

    markup_type: Mapped[str] = mapped_column(SAEnum(MarkupType), nullable=False)
    markup_value: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)  # ex: 300 = 300%

    # Prioridade: regra mais específica sobrepõe a global (maior número = maior prioridade)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    tenant = relationship("Tenant", back_populates="markup_rules")
    category = relationship("Category", back_populates="markup_rules")
