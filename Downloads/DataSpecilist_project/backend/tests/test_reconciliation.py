"""Tests for Reconciliation Lab Engine."""
from datetime import datetime, timedelta
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import BusinessTransaction, FinanceLedgerRecord
from app.services.reconciliation_engine import run_reconciliation

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    yield session
    session.close()

def test_reconciliation_matching_and_tolerances(db_session):
    now = datetime(2026, 10, 15, 12, 0)
    
    # 1. Exact Match Pair
    t_exact = BusinessTransaction(
        transaction_id="TXN-REC-01",
        transaction_date=now,
        customer_id="CUST-1",
        total_amount=500.00,
        is_valid=True
    )
    l_exact = FinanceLedgerRecord(
        batch_number="B-1",
        ledger_reference="GL-01",
        posting_date=now,
        account_code="GL-40010",
        cost_center="CC-101",
        external_reference="TXN-REC-01",
        posted_amount=500.00
    )
    
    # 2. Match within tolerance ($0.03 diff <= $0.05)
    t_tol = BusinessTransaction(
        transaction_id="TXN-REC-02",
        transaction_date=now,
        customer_id="CUST-2",
        total_amount=125.00,
        is_valid=True
    )
    l_tol = FinanceLedgerRecord(
        batch_number="B-1",
        ledger_reference="GL-02",
        posting_date=now,
        account_code="GL-40010",
        cost_center="CC-101",
        external_reference="TXN-REC-02",
        posted_amount=125.03
    )
    
    # 3. Amount Mismatch ($25.00 diff > $0.05)
    t_diff = BusinessTransaction(
        transaction_id="TXN-REC-03",
        transaction_date=now,
        customer_id="CUST-3",
        total_amount=1000.00,
        is_valid=True
    )
    l_diff = FinanceLedgerRecord(
        batch_number="B-1",
        ledger_reference="GL-03",
        posting_date=now,
        account_code="GL-40010",
        cost_center="CC-101",
        external_reference="TXN-REC-03",
        posted_amount=975.00
    )
    
    # 4. Missing in Ledger (ERP transaction exists, no GL entry)
    t_missing_b = BusinessTransaction(
        transaction_id="TXN-REC-04",
        transaction_date=now - timedelta(days=10),
        customer_id="CUST-4",
        total_amount=300.00,
        is_valid=True
    )
    
    # 5. Missing in ERP (Orphan GL record)
    l_missing_a = FinanceLedgerRecord(
        batch_number="B-1",
        ledger_reference="GL-ORPHAN-05",
        posting_date=now,
        account_code="GL-80020",
        cost_center="CC-102",
        external_reference="TXN-NOT-FOUND",
        posted_amount=450.00
    )
    
    db_session.add_all([t_exact, l_exact, t_tol, l_tol, t_diff, l_diff, t_missing_b, l_missing_a])
    db_session.commit()
    
    run = run_reconciliation(db_session, tolerance_amount=0.05)
    
    assert run.source_a_count == 4
    assert run.source_b_count == 4
    assert run.matched_count == 2 # 1 exact + 1 within tolerance
    assert run.tolerance_matched_count == 1
    assert run.amount_mismatch_count == 1
    assert run.missing_b_count == 1
    assert run.missing_a_count == 1
    assert len(run.exceptions) == 3 # diff + missing_b + missing_a
