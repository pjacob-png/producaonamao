from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from app.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Garante índices únicos em tabelas já existentes (sem Alembic)
        await conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_ingredients_tenant_code "
            "ON ingredients (tenant_id, code) WHERE code IS NOT NULL"
        ))
        await conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_products_tenant_code "
            "ON products (tenant_id, code) WHERE code IS NOT NULL"
        ))
