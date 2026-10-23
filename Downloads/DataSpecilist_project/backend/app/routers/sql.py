"""SQL Intelligence Router.

Provides preset business query templates and an interactive read-only SQL executor.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import SqlQueryRequest, SqlQueryResponse, SqlTemplateItem
from app.services.sql_runner import PRESET_SQL_TEMPLATES, execute_readonly_sql

router = APIRouter(prefix="/api/sql", tags=["SQL Intelligence"])

@router.get("/templates", response_model=list[SqlTemplateItem])
def list_sql_templates():
    """Returns curated library of business analytics SQL templates."""
    return PRESET_SQL_TEMPLATES

@router.post("/execute", response_model=SqlQueryResponse)
def execute_sql(payload: SqlQueryRequest, db: Session = Depends(get_db)):
    """Runs a validated read-only SQL query against the active database."""
    result = execute_readonly_sql(db=db, query=payload.query, limit=payload.limit)
    return result
