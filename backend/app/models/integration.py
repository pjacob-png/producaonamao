import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base
from app.models._base import TimestampMixin, new_uuid
import enum


class WhatsAppProvider(str, enum.Enum):
    evolution_api = "evolution_api"
    twilio = "twilio"


class ERPIntegration(Base, TimestampMixin):
    """Configuração de integração com ERP externo (ex: Linx, TOTVS)."""
    __tablename__ = "erp_integrations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    erp_name: Mapped[str] = mapped_column(String(100), nullable=False)
    api_url: Mapped[str] = mapped_column(String(500), nullable=False)
    api_key_encrypted: Mapped[str | None] = mapped_column(Text)   # Fernet-encrypted
    mapping_config: Mapped[dict | None] = mapped_column(JSONB)   # Mapeamento de campos ERP → sistema
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class WhatsAppConfig(Base, TimestampMixin):
    """Configuração de WhatsApp por tenant."""
    __tablename__ = "whatsapp_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    provider: Mapped[str] = mapped_column(SAEnum(WhatsAppProvider), default=WhatsAppProvider.evolution_api)
    api_url: Mapped[str | None] = mapped_column(String(500))
    api_key_encrypted: Mapped[str | None] = mapped_column(Text)   # Fernet-encrypted
    instance_name: Mapped[str | None] = mapped_column(String(100))
    phone_number: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
