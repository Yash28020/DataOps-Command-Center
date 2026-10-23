"""Data Quality Studio Router.

Manages data quality rules, evaluation runs, and the issue investigation workbench.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ValidationRule, ValidationResult, DataQualityIssue, AuditEvent
from app.schemas import ValidationRuleResponse, ValidationRuleCreate, IssueStatusUpdate
from app.services.quality_engine import run_data_quality_evaluation, ensure_default_rules

router = APIRouter(prefix="/api/quality", tags=["Data Quality Studio"])

@router.get("/rules", response_model=list[ValidationRuleResponse])
def get_validation_rules(db: Session = Depends(get_db)):
    """Returns all active and inactive validation rules."""
    ensure_default_rules(db)
    return db.query(ValidationRule).order_by(ValidationRule.id.asc()).all()

@router.post("/rules", response_model=ValidationRuleResponse)
def create_validation_rule(rule_in: ValidationRuleCreate, db: Session = Depends(get_db)):
    """Registers a new custom validation rule."""
    existing = db.query(ValidationRule).filter(ValidationRule.rule_code == rule_in.rule_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Rule with code '{rule_in.rule_code}' already exists.")
        
    rule = ValidationRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.post("/rules/{rule_id}/toggle")
def toggle_validation_rule(rule_id: int, db: Session = Depends(get_db)):
    """Toggles rule active status."""
    rule = db.query(ValidationRule).filter(ValidationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found.")
    rule.is_active = not rule.is_active
    db.commit()
    return {"message": f"Rule '{rule.rule_code}' active status is now {rule.is_active}"}

@router.post("/evaluate")
def evaluate_quality_rules(batch_number: str | None = None, db: Session = Depends(get_db)):
    """Executes all active rules against business transactions and calculates scores."""
    result = run_data_quality_evaluation(db, batch_number=batch_number)
    return result

@router.get("/issues")
def list_quality_issues(
    severity: str | None = None,
    dimension: str | None = None,
    status: str | None = None,
    rule_code: str | None = None,
    search: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Filters data quality issues with search and pagination."""
    query = db.query(DataQualityIssue)
    
    if severity and severity != "ALL":
        query = query.filter(DataQualityIssue.severity == severity)
    if dimension and dimension != "ALL":
        query = query.filter(DataQualityIssue.dimension == dimension)
    if status and status != "ALL":
        query = query.filter(DataQualityIssue.status == status)
    if rule_code and rule_code != "ALL":
        query = query.filter(DataQualityIssue.rule_code == rule_code)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (DataQualityIssue.record_identifier.ilike(s)) |
            (DataQualityIssue.failure_reason.ilike(s)) |
            (DataQualityIssue.field_name.ilike(s))
        )
        
    total_count = query.count()
    issues = query.order_by(DataQualityIssue.id.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "issues": issues
    }

@router.get("/issues/{issue_id}")
def get_issue_detail(issue_id: int, db: Session = Depends(get_db)):
    """Fetches single issue detail with historical context."""
    issue = db.query(DataQualityIssue).filter(DataQualityIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
    return issue

@router.patch("/issues/{issue_id}")
def update_issue_status(
    issue_id: int,
    payload: IssueStatusUpdate,
    db: Session = Depends(get_db)
):
    """Updates issue status, resolution notes, and assigns owners."""
    issue = db.query(DataQualityIssue).filter(DataQualityIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
        
    old_status = issue.status
    issue.status = payload.status
    if payload.resolution_notes:
        issue.resolution_notes = payload.resolution_notes
    if payload.assigned_to:
        issue.assigned_to = payload.assigned_to
        
    if payload.status in ["RESOLVED", "SUPPRESSED"]:
        issue.resolved_at = datetime.utcnow()
        
    db.add(AuditEvent(
        event_type="ISSUE_UPDATE",
        entity_type="DataQualityIssue",
        entity_id=issue.issue_code,
        action=f"Updated issue {issue.issue_code} status from '{old_status}' to '{payload.status}'",
        details={"notes": payload.resolution_notes, "assigned_to": payload.assigned_to}
    ))
    db.commit()
    db.refresh(issue)
    return issue
