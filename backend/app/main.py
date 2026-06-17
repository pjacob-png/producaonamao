from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import create_tables
from app.routers import auth, ingredients, products, recipes, markup, reports, whatsapp, ai_chat, register, webhooks


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await create_tables()
    except Exception as e:
        print(f"[WARN] create_tables falhou: {e}")
    os.makedirs(settings.local_upload_dir, exist_ok=True)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploads de imagens
if os.path.exists(settings.local_upload_dir):
    app.mount("/uploads", StaticFiles(directory=settings.local_upload_dir), name="uploads")

# Routers
api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(ingredients.router, prefix=api_prefix)
app.include_router(products.router, prefix=api_prefix)
app.include_router(recipes.router, prefix=api_prefix)
app.include_router(markup.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(whatsapp.router, prefix=api_prefix)
app.include_router(ai_chat.router, prefix=api_prefix)
app.include_router(register.router, prefix=api_prefix)
app.include_router(webhooks.router, prefix=api_prefix)


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.app_version}
