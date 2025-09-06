from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import init_engine_and_session
from app.api.routing import register_routers


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
    register_routers(app)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
