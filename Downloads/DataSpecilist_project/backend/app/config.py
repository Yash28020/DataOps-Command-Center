"""Configuration settings for DataOps Command Center."""
from pathlib import Path
import os
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "DataOps Command Center"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Primary is PostgreSQL; fallback to local persistent SQLite if not provided
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR / 'dataops.db'}"
    )
    
    # Storage Paths
    BASE_PATH: Path = BASE_DIR
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    EXPORT_DIR: Path = BASE_DIR / "exports"
    REPORTS_DIR: Path = BASE_DIR / "exports" / "reports"
    BI_EXPORT_DIR: Path = BASE_DIR / "exports" / "bi"
    SAMPLE_DIR: Path = BASE_DIR / "data" / "samples"
    
    # Limits & Parameters
    MAX_UPLOAD_SIZE_MB: int = 50
    DEFAULT_RECON_TOLERANCE: float = 0.05
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    model_config = {"env_file": ".env", "extra": "allow"}

settings = Settings()

# Ensure directories exist
for path in [
    settings.UPLOAD_DIR,
    settings.EXPORT_DIR,
    settings.REPORTS_DIR,
    settings.BI_EXPORT_DIR,
    settings.SAMPLE_DIR
]:
    path.mkdir(parents=True, exist_ok=True)
