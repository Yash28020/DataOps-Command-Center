"""Audit & Operations Router.

Provides pipeline processing run history, ingestion batch metrics, audit logging,
and data lineage graphs.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ProcessingRun, IngestionBatch, AuditEvent, DataSource

router = APIRouter(prefix="/api/operations", tags=["Audit & Operations"])

@router.get("/runs")
def list_processing_runs(db: Session = Depends(get_db)):
    """Retrieves all pipeline processing executions."""
    return db.query(ProcessingRun).order_by(ProcessingRun.id.desc()).limit(50).all()

@router.get("/batches")
def list_ingestion_batches(db: Session = Depends(get_db)):
    """Retrieves all staged ingestion batches."""
    return db.query(IngestionBatch).order_by(IngestionBatch.id.desc()).limit(50).all()

@router.get("/audit")
def list_audit_events(
    event_type: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieves system audit trail events."""
    query = db.query(AuditEvent)
    if event_type and event_type != "ALL":
        query = query.filter(AuditEvent.event_type == event_type)
    return query.order_by(AuditEvent.id.desc()).limit(limit).all()

@router.get("/lineage")
def get_data_lineage(db: Session = Depends(get_db)):
    """Returns nodes and directed edges representing the enterprise data lineage."""
    sources = db.query(DataSource).all()
    source_names = [s.name for s in sources] or ["ERP Sales Cloud", "Finance General Ledger"]
    
    nodes = [
        {"id": "src-1", "label": "ERP Sales Cloud (CSV/XLSX)", "type": "SOURCE", "status": "ACTIVE"},
        {"id": "src-2", "label": "Finance General Ledger", "type": "SOURCE", "status": "ACTIVE"},
        {"id": "stage-ingest", "label": "Ingestion Staging & Schema Profiler", "type": "PIPELINE", "status": "HEALTHY"},
        {"id": "stage-val", "label": "Data Quality Studio & Rule Validator", "type": "PIPELINE", "status": "ACTIVE"},
        {"id": "stage-recon", "label": "Dual-System Reconciliation Lab", "type": "PIPELINE", "status": "ACTIVE"},
        {"id": "sink-curated", "label": "Curated Relational Ledger", "type": "STORAGE", "status": "ACTIVE"},
        {"id": "out-excel", "label": "OpenPyXL Excel Executive Pack", "type": "DELIVERABLE", "status": "READY"},
        {"id": "out-bi", "label": "Power BI & Tableau Star Schema", "type": "DELIVERABLE", "status": "READY"},
    ]
    
    edges = [
        {"from": "src-1", "to": "stage-ingest", "label": "Batch Ingest"},
        {"from": "src-2", "to": "stage-ingest", "label": "GL Ingest"},
        {"from": "stage-ingest", "to": "stage-val", "label": "Profiled Rows"},
        {"from": "stage-val", "to": "stage-recon", "label": "Validated ERP"},
        {"from": "stage-ingest", "to": "stage-recon", "label": "GL Journal Entries"},
        {"from": "stage-recon", "to": "sink-curated", "label": "Matched & Reconciled"},
        {"from": "sink-curated", "to": "out-excel", "label": "Automated Multi-Tab Export"},
        {"from": "sink-curated", "to": "out-bi", "label": "Dimensional Fact/Dim Tables"},
    ]
    
    return {
        "nodes": nodes,
        "edges": edges
    }
