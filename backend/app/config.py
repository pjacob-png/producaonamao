from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    # App
    app_name: str = "Produção na Mão"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/producao_na_mao"

    @field_validator("database_url", mode="before")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Security
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    refresh_token_expire_days: int = 30
    encryption_key: str = "change-me-fernet-key="

    # Anthropic
    anthropic_api_key: str = ""

    # Asaas (pagamentos)
    asaas_api_key: str = ""
    asaas_sandbox: bool = True   # True = sandbox, False = produção
    asaas_webhook_token: str = ""  # Token para validar webhooks

    # Storage
    storage_type: str = "local"
    local_upload_dir: str = "uploads/"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket: str = ""
    aws_s3_region: str = "sa-east-1"

    # CORS
    allowed_origins: str = "http://localhost:3000"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
