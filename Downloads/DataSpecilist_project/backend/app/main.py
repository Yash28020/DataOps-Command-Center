"""DataOps Command Center - FastAPI Backend Application.

The Intelligence Layer for Trusted Business Data.
Provides APIs for data ingestion, profiling, quality validation,
dual-system reconciliation, read-only SQL analytics, Excel generation,
and Power BI / Tableau star-schema integration.
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.services.quality_engine import ensure_default_rules
from app.routers import (
    overview, sources, quality, reconciliation,
    sql, reports, bi, operations, insights
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("dataops.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    logger.info("Initializing DataOps Command Center Database...")
    init_db()
    
    # Initialize default validation rules
    db = SessionLocal()
    try:
        ensure_default_rules(db)
        logger.info("Default validation rules verified.")
    finally:
        db.close()
        
    logger.info(f"DataOps Command Center v{settings.APP_VERSION} initialized successfully.")
    yield
    logger.info("DataOps Command Center shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="The Intelligence Layer for Trusted Business Data - Enterprise Quality, Reconciliation & BI Platform",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Subsystem Routers
app.include_router(overview.router)
app.include_router(sources.router)
app.include_router(quality.router)
app.include_router(reconciliation.router)
app.include_router(sql.router)
app.include_router(reports.router)
app.include_router(bi.router)
app.include_router(operations.router)
app.include_router(insights.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint for Docker and monitoring agents."""
    return {
        "status": "HEALTHY",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "CONNECTED",
        "environment": settings.ENVIRONMENT
    }
