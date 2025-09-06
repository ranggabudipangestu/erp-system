from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import init_engine_and_session

# Routers (module registrations)
from app.modules.master_data.product.router import router as product_router


def create_app() -> FastAPI:
    app = FastAPI(title="ERP System API", version="0.1.0")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # DB setup
    init_engine_and_session(settings.database_url)

    # Register routers (Modular Monolith entrypoint)
    app.include_router(product_router, prefix="/api/master-data/products", tags=["MasterData: Products"])

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()

