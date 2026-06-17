import uuid
import enum
from decimal import Decimal
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, Numeric, DateTime, Enum as SAEnum
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from app.models._base import TimestampMixin, new_uuid


class PlanSlug(str, enum.Enum):
    basic = "basic"       # R$ 99/mês — 1 unidade, 100 produtos, 5 usuários
    pro = "pro"           # R$ 199/mês — 3 unidades, ilimitado, IA inclusa
    network = "network"   # R$ 399/mês — ilimitado, WhatsApp + ERP + IA


class SubStatus(str, enum.Enum):
    trial = "trial"
    active = "active"
    overdue = "overdue"
    cancelled = "cancelled"


PLAN_PRICES = {
    PlanSlug.basic: Decimal("99.00"),
    PlanSlug.pro: Decimal("199.00"),
    PlanSlug.network: Decimal("399.00"),
}

PLAN_LIMITS = {
    PlanSlug.basic:   {"units": 1,  "products": 100, "users": 5,  "ai": False, "whatsapp": False},
    PlanSlug.pro:     {"units": 3,  "products": None, "users": 15, "ai": True,  "whatsapp": False},
    PlanSlug.network: {"units": None,"products": None,"users": None,"ai": True, "whatsapp": True},
}


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)

    plan: Mapped[str] = mapped_column(SAEnum(PlanSlug), nullable=False)
    status: Mapped[str] = mapped_column(SAEnum(SubStatus), default=SubStatus.trial, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # IDs do Asaas
    asaas_customer_id: Mapped[str | None] = mapped_column(String(100))
    asaas_subscription_id: Mapped[str | None] = mapped_column(String(100))

    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
