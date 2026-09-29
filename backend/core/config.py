"""Environment-based settings. Never hardcode secrets here."""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # External services
    WEATHER_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""  # optional alternate provider
    GEOCODING_API_KEY: str = ""

    # LLM for assistant (server-side only)
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"

    # Disease model confidence thresholds (configurable)
    DISEASE_CONFIDENCE_HIGH: float = 0.75
    DISEASE_CONFIDENCE_MEDIUM: float = 0.45
    DISEASE_MODEL_VERSION: str = "v1"

    # Upload limits
    MAX_IMAGE_BYTES: int = 8 * 1024 * 1024  # 8 MB

    # Environment
    ENV: str = "development"
    DEMO_MODE: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
