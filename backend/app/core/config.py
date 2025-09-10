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
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production-please")
    
    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Feature Flags
    REQUIRE_TENANT_DOMAIN: bool = os.getenv("REQUIRE_TENANT_DOMAIN", "false").lower() == "true"
    
    # Rate Limiting
    LOGIN_RATE_LIMIT: int = int(os.getenv("LOGIN_RATE_LIMIT", "5"))  # attempts per minute
    LOGIN_RATE_WINDOW: int = int(os.getenv("LOGIN_RATE_WINDOW", "60"))  # seconds


def get_settings() -> Settings:
    return Settings()


settings = Settings()
