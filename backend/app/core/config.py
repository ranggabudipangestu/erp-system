import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from a .env file if present
# This reads from the working directory (backend/) during local dev
load_dotenv()


class Settings(BaseModel):
    database_url: str = (
        os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg2://erp_user:erp_password@localhost:5432/erp_system_new",
        )
    )
    cors_origins: list[str] = (
        os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if os.getenv("CORS_ORIGINS")
        else ["http://localhost:3000"]
    )


settings = Settings()
