import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
import re


class UnitBase(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None
    state: str | None = None


class UnitCreate(UnitBase):
    pass


class UnitUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    is_active: bool | None = None


class UnitOut(UnitBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TenantBase(BaseModel):
    name: str
    cnpj: str | None = None
    phone: str | None = None
    email: EmailStr | None = None

    @field_validator("cnpj")
    @classmethod
    def validate_cnpj(cls, v):
        if v:
            digits = re.sub(r"\D", "", v)
            if len(digits) != 14:
                raise ValueError("CNPJ inválido")
            return f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"
        return v


class TenantCreate(TenantBase):
    slug: str
    plan: str = "basic"
    admin_email: EmailStr
    admin_password: str
    admin_name: str


class TenantOut(TenantBase):
    id: uuid.UUID
    slug: str
    plan: str
    is_active: bool
    created_at: datetime
    units: list[UnitOut] = []

    model_config = {"from_attributes": True}
