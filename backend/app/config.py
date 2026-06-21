from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Qcode Backtesting API"
    jwt_secret: str = "qcode-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24
    cors_origins: list[str] = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "https://backtest-nu-gilt.vercel.app",
]
    demo_email: str = "demo@qcode.com"
    demo_password: str = "demo1234"
    demo_name: str = "Demo User"


@lru_cache
def get_settings() -> Settings:
    return Settings()
