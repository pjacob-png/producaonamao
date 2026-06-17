"""
Utilitários de conformidade com a LGPD (Lei 13.709/2018).
- Registro de consentimento
- Auditoria de acesso e modificação de dados pessoais
- Anonimização para exclusão de conta
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog


async def log_action(
    db: AsyncSession,
    *,
    tenant_id: uuid.UUID | None,
    user_id: uuid.UUID | None,
    action: str,
    entity: str,
    entity_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    details: dict | None = None,
) -> None:
    entry = AuditLog(
        tenant_id=tenant_id,
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(entry)
    # Commit delegado ao caller (dentro da transação da requisição)
