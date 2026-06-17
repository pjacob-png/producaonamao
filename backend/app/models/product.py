import uuid
import enum
from decimal import Decimal
from sqlalchemy import String, Boolean, ForeignKey, Numeric, Text, Enum as SAEnum
from sqlalchemy.orm import relationship, mapped_column, Mapped
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from app.models._base import TimestampMixin, new_uuid


class ABCCurve(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    # unit_id nulo = produto disponível em todas as unidades
    unit_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("units.id", ondelete="SET NULL"))
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"))

    code: Mapped[str | None] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    preparation_method: Mapped[str | None] = mapped_column(Text)  # Modo de preparo
    photo_url: Mapped[str | None] = mapped_column(String(500))

    abc_curve: Mapped[str | None] = mapped_column(SAEnum(ABCCurve))
    selling_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ERP sync
    erp_code: Mapped[str | None] = mapped_column(String(100))

    tenant = relationship("Tenant", back_populates="products")
    category = relationship("Category", back_populates="products")
    recipe = relationship("Recipe", back_populates="product", uselist=False, cascade="all, delete-orphan")
