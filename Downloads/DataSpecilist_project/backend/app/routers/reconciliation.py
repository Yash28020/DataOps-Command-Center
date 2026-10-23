"""Reconciliation Lab Router.

Handles two-way dataset comparison, configurable tolerance matching,
and exception remediation management.
"""
from datetime import datetime
import io
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ReconciliationRun, ReconciliationException, AuditEvent
from app.schemas import ReconciliationRunRequest, ExceptionStatusUpdate
from app.services.reconciliation_engine import run_reconciliation

router = APIRouter(prefix="/api/reconciliation", tags=["Reconciliation Lab"])

@router.post("/execute")
def execute_reconciliation(
    payload: ReconciliationRunRequest,
    db: Session = Depends(get_db)
):
    """Executes reconciliation run with custom matching key and dollar tolerance."""
    run = run_reconciliation(
        db=db,
        source_a_name=payload.source_a_name,
        source_b_name=payload.source_b_name,
        tolerance_amount=payload.tolerance_amount
    )
    return {
        "status": "success",
        "run_id": run.id,
        "run_code": run.run_code,
        "source_a_count": run.source_a_count,
        "source_b_count": run.source_b_count,
        "matched_count": run.matched_count,
        "tolerance_matched_count": run.tolerance_matched_count,
        "reconciliation_rate": run.reconciliation_rate,
        "net_variance": run.net_variance,
        "total_exceptions": (
            run.missing_a_count + run.missing_b_count + run.amount_mismatch_count +
            run.timing_difference_count + run.duplicate_key_count
        )
    }

@router.get("/runs")
def list_reconciliation_runs(db: Session = Depends(get_db)):
    """Retrieves list of past reconciliation runs."""
    return db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).limit(20).all()

@router.get("/latest")
def get_latest_reconciliation_run(db: Session = Depends(get_db)):
    """Fetches most recent reconciliation execution details."""
    run = db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).first()
    if not run:
        return None
    return run

@router.get("/exceptions")
def list_reconciliation_exceptions(
    run_id: int | None = None,
    exception_type: str | None = None,
    status: str | None = None,
    search: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Filters reconciliation exceptions with search and pagination."""
    query = db.query(ReconciliationException)
    if run_id:
        query = query.filter(ReconciliationException.run_id == run_id)
    if exception_type and exception_type != "ALL":
        query = query.filter(ReconciliationException.exception_type == exception_type)
    if status and status != "ALL":
        query = query.filter(ReconciliationException.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (ReconciliationException.key_value.ilike(s)) |
            (ReconciliationException.notes.ilike(s))
        )
        
    total = query.count()
    exceptions = query.order_by(ReconciliationException.id.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "exceptions": exceptions
    }

@router.patch("/exceptions/{exception_id}")
def update_exception(
    exception_id: int,
    payload: ExceptionStatusUpdate,
    db: Session = Depends(get_db)
):
    """Updates exception remediation status, owner assignment, and audit notes."""
    exc = db.query(ReconciliationException).filter(ReconciliationException.id == exception_id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found.")
        
    old_status = exc.status
    exc.status = payload.status
    if payload.notes:
        exc.notes = payload.notes
    if payload.owner:
        exc.owner = payload.owner
    exc.updated_at = datetime.utcnow()
    
    db.add(AuditEvent(
        event_type="RECON_EXCEPTION_UPDATE",
        entity_type="ReconciliationException",
        entity_id=str(exc.id),
        action=f"Changed exception {exc.id} status from '{old_status}' to '{payload.status}'",
        details={"owner": payload.owner, "notes": payload.notes}
    ))
    db.commit()
    db.refresh(exc)
    return exc

@router.get("/export")
def export_reconciliation_results(db: Session = Depends(get_db)):
    """Downloads current reconciliation exceptions as a CSV file."""
    exceptions = db.query(ReconciliationException).order_by(ReconciliationException.id.asc()).all()
    output = io.StringIO()
    output.write("Exception_ID,Type,Key_Value,Source_A_Ref,Source_B_Ref,Source_A_Amount,Source_B_Amount,Variance,Status,Owner,Notes\n")
    for e in exceptions:
        output.write(f'"{e.id}","{e.exception_type}","{e.key_value}","{e.source_a_record_id or ""}","{e.source_b_record_id or ""}",{e.source_a_amount or 0.0},{e.source_b_amount or 0.0},{e.variance_amount or 0.0},"{e.status}","{e.owner}","{e.notes or ""}"\n')
        
    csv_bytes = output.getvalue().encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reconciliation_exceptions.csv"}
    )
