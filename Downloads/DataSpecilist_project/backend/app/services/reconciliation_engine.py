"""Reconciliation Engine for DataOps Command Center.

Performs robust two-way data reconciliation between Operational ERP Transactions (Source A)
and Financial General Ledger Records (Source B) with configurable tolerances, duplicate-key detection,
timing difference handling, and full exception logging.
"""
from datetime import datetime, timedelta, timezone
import time
from typing import Any
from sqlalchemy.orm import Session
from app.models import (
    BusinessTransaction, FinanceLedgerRecord,
    ReconciliationRun, ReconciliationException,
    ProcessingRun, AuditEvent
)

def run_reconciliation(
    db: Session,
    source_a_name: str = "ERP Operations Transactions",
    source_b_name: str = "Finance General Ledger",
    tolerance_amount: float = 0.05,
    batch_number: str | None = None
) -> ReconciliationRun:
    """
    Executes a structured two-way reconciliation run with clear matching precedence.
    Enforces strict 1-to-1 matching to prevent double attribution.
    """
    start_time = time.time()
    run_code = f"REC-RUN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')[:18]}"
    
    # 1. Fetch Source A (ERP) records
    q_a = db.query(BusinessTransaction)
    if batch_number:
        q_a = q_a.filter(BusinessTransaction.batch.has(batch_number=batch_number))
    records_a = q_a.all()
    
    # 2. Fetch Source B (GL Ledger) records
    q_b = db.query(FinanceLedgerRecord)
    if batch_number:
        q_b = q_b.filter(FinanceLedgerRecord.batch_number == batch_number)
    records_b = q_b.all()
    
    # Totals
    source_a_count = len(records_a)
    source_b_count = len(records_b)
    source_a_amount = round(sum(r.total_amount or 0.0 for r in records_a), 2)
    source_b_amount = round(sum(r.posted_amount or 0.0 for r in records_b), 2)
    
    # Group Source A by key (transaction_id)
    dict_a: dict[str, list[BusinessTransaction]] = {}
    for r in records_a:
        key = str(r.transaction_id).strip()
        dict_a.setdefault(key, []).append(r)
        
    # Group Source B by key (external_reference)
    dict_b: dict[str, list[FinanceLedgerRecord]] = {}
    for r in records_b:
        key = str(r.external_reference).strip() if r.external_reference else f"UNLINKED-{r.ledger_reference}"
        dict_b.setdefault(key, []).append(r)
        
    matched_count = 0
    matched_amount = 0.0
    tolerance_matched_count = 0
    missing_a_count = 0
    missing_b_count = 0
    amount_mismatch_count = 0
    timing_difference_count = 0
    duplicate_key_count = 0
    
    exceptions_to_save: list[ReconciliationException] = []
    
    # Track keys evaluated
    all_keys = set(dict_a.keys()).union(set(dict_b.keys()))
    
    # Determine maximum date in records for timing difference heuristic
    all_dates = [r.transaction_date for r in records_a if r.transaction_date]
    max_date = max(all_dates) if all_dates else datetime.utcnow()
    
    for key in all_keys:
        items_a = dict_a.get(key, [])
        items_b = dict_b.get(key, [])
        
        # Precedence 1: Duplicate Key Detection on either side
        if len(items_a) > 1 or len(items_b) > 1:
            duplicate_key_count += 1
            amt_a = sum(x.total_amount for x in items_a)
            amt_b = sum(y.posted_amount for y in items_b)
            var = round(amt_a - amt_b, 2)
            
            exceptions_to_save.append(ReconciliationException(
                exception_type="DUPLICATE_KEY",
                key_value=key,
                source_a_record_id=items_a[0].transaction_id if items_a else None,
                source_b_record_id=items_b[0].ledger_reference if items_b else None,
                source_a_amount=amt_a,
                source_b_amount=amt_b,
                variance_amount=var,
                status="NEW",
                owner="Finance & ERP Systems Lead",
                notes=f"Key '{key}' appears {len(items_a)} times in Source A and {len(items_b)} times in Source B."
            ))
            continue
            
        # Precedence 2: Exists in Source A only (Missing in GL)
        if items_a and not items_b:
            rec_a = items_a[0]
            amt_a = round(rec_a.total_amount or 0.0, 2)
            
            # Check for legitimate cut-off timing difference
            days_from_end = (max_date - rec_a.transaction_date).days if rec_a.transaction_date else 99
            if days_from_end <= 3:
                timing_difference_count += 1
                exceptions_to_save.append(ReconciliationException(
                    exception_type="TIMING_DIFFERENCE",
                    key_value=key,
                    source_a_record_id=rec_a.transaction_id,
                    source_b_record_id=None,
                    source_a_amount=amt_a,
                    source_b_amount=0.0,
                    variance_amount=amt_a,
                    posting_date_a=rec_a.transaction_date,
                    status="NEW",
                    owner="Treasury Operations",
                    notes="Transaction posted near month-end cutoff; pending GL journal posting in subsequent cycle."
                ))
            else:
                missing_b_count += 1
                exceptions_to_save.append(ReconciliationException(
                    exception_type="MISSING_IN_B",
                    key_value=key,
                    source_a_record_id=rec_a.transaction_id,
                    source_b_record_id=None,
                    source_a_amount=amt_a,
                    source_b_amount=0.0,
                    variance_amount=amt_a,
                    posting_date_a=rec_a.transaction_date,
                    status="NEW",
                    owner="Billing Operations",
                    notes=f"Operational transaction exists in ERP but has no corresponding General Ledger entry."
                ))
            continue
            
        # Precedence 3: Exists in Source B only (Missing in ERP)
        if items_b and not items_a:
            rec_b = items_b[0]
            amt_b = round(rec_b.posted_amount or 0.0, 2)
            missing_a_count += 1
            exceptions_to_save.append(ReconciliationException(
                exception_type="MISSING_IN_A",
                key_value=key,
                source_a_record_id=None,
                source_b_record_id=rec_b.ledger_reference,
                source_a_amount=0.0,
                source_b_amount=amt_b,
                variance_amount=-amt_b,
                posting_date_b=rec_b.posting_date,
                status="NEW",
                owner="Accounting Audit",
                notes=f"General Ledger reference has no source ERP transaction. Potential manual journal adjustment."
            ))
            continue
            
        # Precedence 4: Exists on both sides -> Amount comparison
        rec_a = items_a[0]
        rec_b = items_b[0]
        amt_a = round(rec_a.total_amount or 0.0, 2)
        amt_b = round(rec_b.posted_amount or 0.0, 2)
        variance = round(amt_a - amt_b, 2)
        abs_variance = abs(variance)
        
        if abs_variance == 0.0:
            # Exact Match
            matched_count += 1
            matched_amount += amt_a
            rec_b.reconciliation_status = "MATCHED"
            rec_b.matched_transaction_id = rec_a.transaction_id
        elif abs_variance <= tolerance_amount:
            # Match within tolerance (e.g. minor penny rounding)
            tolerance_matched_count += 1
            matched_count += 1
            matched_amount += amt_a
            rec_b.reconciliation_status = "MATCHED_WITH_TOLERANCE"
            rec_b.matched_transaction_id = rec_a.transaction_id
        else:
            # Amount Mismatch
            amount_mismatch_count += 1
            rec_b.reconciliation_status = "AMOUNT_MISMATCH"
            exceptions_to_save.append(ReconciliationException(
                exception_type="AMOUNT_MISMATCH",
                key_value=key,
                source_a_record_id=rec_a.transaction_id,
                source_b_record_id=rec_b.ledger_reference,
                source_a_amount=amt_a,
                source_b_amount=amt_b,
                variance_amount=variance,
                posting_date_a=rec_a.transaction_date,
                posting_date_b=rec_b.posting_date,
                status="NEW",
                owner="Revenue Assurance",
                notes=f"Amount variance of ${variance:+.2f} exceeds tolerance of ${tolerance_amount:.2f}."
            ))

    net_variance = round(source_a_amount - source_b_amount, 2)
    total_reconciled_base = max(source_a_count, 1)
    reconciliation_rate = round((matched_count / total_reconciled_base) * 100, 1)
    
    total_exceptions = (
        missing_a_count + missing_b_count + amount_mismatch_count +
        timing_difference_count + duplicate_key_count
    )
    status = "COMPLETED" if total_exceptions == 0 else "WITH_EXCEPTIONS"
    
    run = ReconciliationRun(
        run_code=run_code,
        source_a_name=source_a_name,
        source_b_name=source_b_name,
        matching_key="transaction_id <-> external_reference",
        tolerance_amount=tolerance_amount,
        source_a_count=source_a_count,
        source_b_count=source_b_count,
        source_a_amount=source_a_amount,
        source_b_amount=source_b_amount,
        matched_count=matched_count,
        matched_amount=round(matched_amount, 2),
        tolerance_matched_count=tolerance_matched_count,
        missing_a_count=missing_a_count,
        missing_b_count=missing_b_count,
        amount_mismatch_count=amount_mismatch_count,
        timing_difference_count=timing_difference_count,
        duplicate_key_count=duplicate_key_count,
        net_variance=net_variance,
        reconciliation_rate=reconciliation_rate,
        status=status,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )
    db.add(run)
    db.flush()
    
    for exc in exceptions_to_save:
        exc.run_id = run.id
        db.add(exc)
        
    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    
    # Record processing run
    db.add(ProcessingRun(
        run_code=run_code,
        pipeline_stage="RECONCILIATION",
        status="COMPLETED" if total_exceptions == 0 else "WARNING",
        records_processed=source_a_count + source_b_count,
        records_failed=total_exceptions,
        duration_ms=elapsed_ms,
        summary_metrics={
            "matched_count": matched_count,
            "reconciliation_rate": reconciliation_rate,
            "net_variance": net_variance,
            "total_exceptions": total_exceptions
        },
        triggered_by="RECONCILIATION_LAB"
    ))
    
    # Audit log
    db.add(AuditEvent(
        event_type="RECONCILIATION",
        entity_type="ReconciliationRun",
        entity_id=run_code,
        action=f"Reconciled {source_a_count} ERP vs {source_b_count} GL records. Rate: {reconciliation_rate}%, Exceptions: {total_exceptions}",
        details={"run_code": run_code, "net_variance": net_variance, "rate": reconciliation_rate}
    ))
    
    db.commit()
    db.refresh(run)
    return run
