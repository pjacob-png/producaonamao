"""
Endpoints de gerenciamento do próprio usuário autenticado.
Inclui atualização de perfil, troca de senha e direitos LGPD (exportação/exclusão).
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.security import verify_password, hash_password
from app.core.lgpd import log_action

router = APIRouter(prefix="/users", tags=["Usuários"])


class ProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.patch("/me")
async def update_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.name is not None:
        if len(body.name.strip()) < 2:
            raise HTTPException(status_code=422, detail="Nome muito curto")
        current_user.name = body.name.strip()
    if body.phone is not None:
        current_user.phone = body.phone or None
    await db.commit()
    return {"message": "Perfil atualizado com sucesso"}


@router.post("/me/change-password")
async def change_password(
    body: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Senha mínima de 8 caracteres")
    if len(body.new_password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Senha não pode ter mais de 72 caracteres")
    current_user.hashed_password = hash_password(body.new_password)
    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="UPDATE", entity="user_password", entity_id=str(current_user.id))
    await db.commit()
    return {"message": "Senha alterada com sucesso"}


@router.post("/me/data-export")
async def request_data_export(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """LGPD Art. 18 — direito de portabilidade. Registra a solicitação; envio por e-mail é manual ou via task assíncrona."""
    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="DATA_EXPORT_REQUEST", entity="user", entity_id=str(current_user.id),
                     details={"email": current_user.email})
    await db.commit()
    return {"message": "Solicitação registrada. Você receberá um e-mail em até 24h com seus dados."}


@router.delete("/me")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """LGPD Art. 18 — direito de exclusão. Desativa a conta sem apagar imediatamente (grace period de 30 dias)."""
    current_user.is_active = False
    await log_action(db, tenant_id=current_user.tenant_id, user_id=current_user.id,
                     action="ACCOUNT_DELETE_REQUEST", entity="user", entity_id=str(current_user.id),
                     details={"email": current_user.email, "requested_at": datetime.now(timezone.utc).isoformat()})
    await db.commit()
    return {"message": "Conta marcada para exclusão. Acesso encerrado."}
