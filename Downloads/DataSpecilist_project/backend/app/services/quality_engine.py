"""Data Quality Studio Engine.

Executes rule evaluation, computes dimension scores (Completeness, Uniqueness,
Validity, Integrity), detects anomalies, preserves original values, and logs audit issues.
"""
from datetime import datetime, timedelta, timezone
import time
from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    ValidationRule, ValidationResult, DataQualityIssue,
    BusinessTransaction, ProcessingRun, AuditEvent
)

DEFAULT_RULES = [
    {
        "rule_code": "REQ_CUST_ID",
        "name": "Mandatory Customer Reference",
        "description": "Customer ID must not be null or blank to preserve customer attribution.",
        "rule_type": "NULL_CHECK",
        "target_field": "customer_id",
        "severity": "CRITICAL",
        "dimension": "Completeness",
        "weight": 25.0,
        "parameters": {}
    },
    {
        "rule_code": "UNQ_TXN_ID",
        "name": "Transaction Identifier Uniqueness",
        "description": "Each transaction ID must be unique across the ledger to prevent double-booking.",
        "rule_type": "DUPLICATE_CHECK",
        "target_field": "transaction_id",
        "severity": "CRITICAL",
        "dimension": "Uniqueness",
        "weight": 25.0,
        "parameters": {}
    },
    {
        "rule_code": "NUM_AMOUNT_POS",
        "name": "Positive Revenue Threshold",
        "description": "Total Amount must be strictly greater than $0.00 unless explicitly flagged as credit memo.",
        "rule_type": "RANGE_CHECK",
        "target_field": "total_amount",
        "severity": "CRITICAL",
        "dimension": "Validity",
        "weight": 20.0,
        "parameters": {"min": 0.01}
    },
    {
        "rule_code": "CROSS_TOTAL_MATCH",
        "name": "Internal Invoice Mathematical Coherence",
        "description": "Total Amount must match Quantity * Unit Price within $0.02 rounding margin.",
        "rule_type": "CROSS_COLUMN",
        "target_field": "total_amount",
        "severity": "WARNING",
        "dimension": "Integrity",
        "weight": 15.0,
        "parameters": {"tolerance": 0.02}
    },
    {
        "rule_code": "CAT_VALID_DEPT",
        "name": "Standardized Department Classification",
        "description": "Department must belong to approved enterprise cost center list.",
        "rule_type": "ALLOWED_VALUES",
        "target_field": "department",
        "severity": "WARNING",
        "dimension": "Validity",
        "weight": 10.0,
        "parameters": {"allowed": ["Sales", "Finance", "Operations", "Supply Chain", "Retail", "Enterprise"]}
    },
    {
        "rule_code": "DATE_VALID_RANGE",
        "name": "Posting Period Temporal Bounds",
        "description": "Transaction date must not be placed beyond 30 days into the future.",
        "rule_type": "DATE_CHECK",
        "target_field": "transaction_date",
        "severity": "WARNING",
        "dimension": "Validity",
        "weight": 5.0,
        "parameters": {"max_future_days": 30}
    }
]

def ensure_default_rules(db: Session):
    """Initializes default validation rules if they don't already exist."""
    existing_codes = {r.rule_code for r in db.query(ValidationRule.rule_code).all()}
    for r_def in DEFAULT_RULES:
        if r_def["rule_code"] not in existing_codes:
            rule = ValidationRule(**r_def)
            db.add(rule)
    db.commit()

def run_data_quality_evaluation(db: Session, batch_number: str | None = None) -> dict[str, Any]:
    """
    Executes all active data quality rules against the business_transactions table.
    Records granular issues with original values, computes dimensional scores,
    and updates transaction validity flags.
    """
    start_time = time.time()
    ensure_default_rules(db)
    
    run_id = f"RUN-DQ-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')[:18]}"
    
    query = db.query(BusinessTransaction)
    if batch_number:
        query = query.filter(BusinessTransaction.batch.has(batch_number=batch_number))
        
    transactions = query.all()
    total_records = len(transactions)
    
    if total_records == 0:
        return {
            "run_id": run_id,
            "executed_at": datetime.now(timezone.utc),
            "total_records": 0,
            "passed_records": 0,
            "failed_records": 0,
            "overall_quality_score": 100.0,
            "dimension_scores": {"Completeness": 100.0, "Uniqueness": 100.0, "Validity": 100.0, "Integrity": 100.0},
            "rule_results": []
        }
        
    active_rules = db.query(ValidationRule).filter(ValidationRule.is_active == True).all()
    
    rule_results = []
    issues_to_create = []
    
    # Track which transactions have any defect
    invalid_txn_ids = set()
    
    # Pre-compute uniqueness counts for UNQ_TXN_ID
    txn_id_counts: dict[str, int] = {}
    for t in transactions:
        txn_id_counts[t.transaction_id] = txn_id_counts.get(t.transaction_id, 0) + 1
        
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    for rule in active_rules:
        failed_count = 0
        rule_eval_count = total_records
        
        for t in transactions:
            is_failed = False
            failure_reason = ""
            orig_value = None
            
            # Rule 1: NULL_CHECK
            if rule.rule_type == "NULL_CHECK":
                val = getattr(t, rule.target_field or "", None)
                orig_value = str(val) if val is not None else "NULL"
                if val is None or str(val).strip() == "":
                    is_failed = True
                    failure_reason = f"Field '{rule.target_field}' is NULL or empty"
            
            # Rule 2: DUPLICATE_CHECK
            elif rule.rule_type == "DUPLICATE_CHECK":
                orig_value = t.transaction_id
                if txn_id_counts.get(t.transaction_id, 0) > 1:
                    is_failed = True
                    failure_reason = f"Transaction ID '{t.transaction_id}' appears {txn_id_counts[t.transaction_id]} times"
            
            # Rule 3: RANGE_CHECK (Positive Amount)
            elif rule.rule_type == "RANGE_CHECK":
                val = getattr(t, rule.target_field or "", 0.0)
                orig_value = f"${val:,.2f}"
                min_val = rule.parameters.get("min", 0.0)
                if val is None or val < min_val:
                    is_failed = True
                    failure_reason = f"Value {orig_value} is below minimum allowed {min_val}"
            
            # Rule 4: CROSS_COLUMN (Qty * UnitPrice vs Total)
            elif rule.rule_type == "CROSS_COLUMN":
                expected = round((t.quantity or 0) * (t.unit_price or 0.0), 2)
                actual = round(t.total_amount or 0.0, 2)
                orig_value = f"Total: ${actual:,.2f} vs (Qty {t.quantity} * Price ${t.unit_price:,.2f} = ${expected:,.2f})"
                tol = rule.parameters.get("tolerance", 0.02)
                if abs(expected - actual) > tol:
                    is_failed = True
                    diff = actual - expected
                    failure_reason = f"Calculation variance of ${diff:+.2f} exceeds tolerance of ${tol}"
            
            # Rule 5: ALLOWED_VALUES
            elif rule.rule_type == "ALLOWED_VALUES":
                val = getattr(t, rule.target_field or "", "")
                orig_value = str(val)
                allowed = rule.parameters.get("allowed", [])
                if val not in allowed:
                    is_failed = True
                    failure_reason = f"Value '{val}' is not in approved list: {allowed}"
            
            # Rule 6: DATE_CHECK
            elif rule.rule_type == "DATE_CHECK":
                dt = t.transaction_date
                orig_value = dt.strftime("%Y-%m-%d %H:%M:%S") if dt else "NULL"
                max_days = rule.parameters.get("max_future_days", 30)
                if dt and dt > (now + timedelta(days=max_days)):
                    is_failed = True
                    failure_reason = f"Date {orig_value} is placed too far in the future (> {max_days} days)"
            
            if is_failed:
                failed_count += 1
                invalid_txn_ids.add(t.id)
                issue_code = f"ISSUE-{rule.rule_code}-{t.id}-{run_id[-6:]}"
                
                issues_to_create.append(DataQualityIssue(
                    issue_code=issue_code,
                    run_id=run_id,
                    rule_code=rule.rule_code,
                    rule_name=rule.name,
                    dimension=rule.dimension,
                    severity=rule.severity,
                    dataset_name="business_transactions",
                    record_identifier=t.transaction_id,
                    field_name=rule.target_field or "record",
                    original_value=orig_value,
                    failure_reason=failure_reason,
                    status="OPEN",
                    assigned_to="Unassigned",
                    detected_at=now
                ))
                
        passed_count = rule_eval_count - failed_count
        pass_rate = round((passed_count / rule_eval_count * 100), 2) if rule_eval_count > 0 else 100.0
        status = "PASS" if pass_rate == 100 else ("WARN" if pass_rate >= 90 else "FAIL")
        
        # Save validation result
        db.add(ValidationResult(
            run_id=run_id,
            rule_code=rule.rule_code,
            records_evaluated=rule_eval_count,
            records_passed=passed_count,
            records_failed=failed_count,
            pass_rate=pass_rate,
            status=status,
            executed_at=now
        ))
        
        rule_results.append({
            "rule_code": rule.rule_code,
            "rule_name": rule.name,
            "dimension": rule.dimension,
            "severity": rule.severity,
            "records_evaluated": rule_eval_count,
            "records_passed": passed_count,
            "records_failed": failed_count,
            "pass_rate": pass_rate,
            "status": status,
            "weight": rule.weight
        })
        
    # Bulk insert issues
    for issue in issues_to_create:
        db.add(issue)
        
    # Update is_valid flag on transactions
    for t in transactions:
        t.is_valid = (t.id not in invalid_txn_ids)
        
    # Calculate dimensional and weighted overall quality score
    dimension_scores = {}
    dim_groups = {}
    for r in rule_results:
        dim = r["dimension"]
        dim_groups.setdefault(dim, []).append(r)
        
    for dim, r_list in dim_groups.items():
        total_weight = sum(item["weight"] for item in r_list)
        if total_weight > 0:
            weighted_pass = sum(item["pass_rate"] * item["weight"] for item in r_list)
            dimension_scores[dim] = round(weighted_pass / total_weight, 1)
        else:
            dimension_scores[dim] = 100.0
            
    # Weighted overall score based on canonical weights:
    # Completeness (30%), Uniqueness (25%), Validity (25%), Integrity (20%)
    overall_quality_score = round(
        (dimension_scores.get("Completeness", 100.0) * 0.30) +
        (dimension_scores.get("Uniqueness", 100.0) * 0.25) +
        (dimension_scores.get("Validity", 100.0) * 0.25) +
        (dimension_scores.get("Integrity", 100.0) * 0.20),
        1
    )
    
    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    failed_records_count = len(invalid_txn_ids)
    passed_records_count = total_records - failed_records_count
    
    # Record processing run
    run_record = ProcessingRun(
        run_code=run_id,
        pipeline_stage="VALIDATION",
        status="COMPLETED" if failed_records_count == 0 else "WARNING",
        records_processed=total_records,
        records_failed=failed_records_count,
        duration_ms=elapsed_ms,
        summary_metrics={
            "overall_score": overall_quality_score,
            "dimension_scores": dimension_scores,
            "issues_detected": len(issues_to_create)
        },
        triggered_by="DATA_QUALITY_STUDIO"
    )
    db.add(run_record)
    
    # Audit log
    db.add(AuditEvent(
        event_type="VALIDATION",
        entity_type="ValidationRun",
        entity_id=run_id,
        action=f"Executed data quality rules over {total_records} records. Score: {overall_quality_score}%",
        details={"run_id": run_id, "issues_detected": len(issues_to_create), "score": overall_quality_score}
    ))
    
    db.commit()
    
    return {
        "run_id": run_id,
        "executed_at": now,
        "total_records": total_records,
        "passed_records": passed_records_count,
        "failed_records": failed_records_count,
        "overall_quality_score": overall_quality_score,
        "dimension_scores": dimension_scores,
        "rule_results": rule_results
    }
