"""Tests for Data Quality Studio Engine."""
from datetime import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import BusinessTransaction, ValidationRule
from app.services.quality_engine import run_data_quality_evaluation, ensure_default_rules

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    ensure_default_rules(session)
    yield session
    session.close()

def test_quality_rule_evaluation(db_session):
    # Insert clean transaction
    t_clean = BusinessTransaction(
        transaction_id="TXN-2026-0001",
        transaction_date=datetime(2026, 10, 15, 10, 0),
        customer_id="CUST-1001",
        customer_name="Test Enterprise Corp",
        product_sku="SKU-ENT-101",
        department="Enterprise",
        quantity=2,
        unit_price=100.0,
        total_amount=200.0,
        is_valid=True
    )
    # Insert transaction with missing customer
    t_null_cust = BusinessTransaction(
        transaction_id="TXN-2026-0002",
        transaction_date=datetime(2026, 10, 15, 11, 0),
        customer_id=None,
        product_sku="SKU-ENT-101",
        department="Enterprise",
        quantity=1,
        unit_price=100.0,
        total_amount=100.0,
        is_valid=True
    )
    # Insert transaction with negative amount
    t_neg = BusinessTransaction(
        transaction_id="TXN-2026-0003",
        transaction_date=datetime(2026, 10, 15, 12, 0),
        customer_id="CUST-1002",
        product_sku="SKU-ENT-101",
        department="Enterprise",
        quantity=1,
        unit_price=100.0,
        total_amount=-50.0,
        is_valid=True
    )
    # Insert transaction with calculation mismatch
    t_calc = BusinessTransaction(
        transaction_id="TXN-2026-0004",
        transaction_date=datetime(2026, 10, 15, 13, 0),
        customer_id="CUST-1003",
        product_sku="SKU-ENT-101",
        department="Enterprise",
        quantity=2,
        unit_price=100.0,
        total_amount=350.0, # Expected 200.0
        is_valid=True
    )
    # Insert duplicate transaction id
    t_dup1 = BusinessTransaction(
        transaction_id="TXN-2026-DUP",
        transaction_date=datetime(2026, 10, 15, 14, 0),
        customer_id="CUST-1004",
        department="Enterprise",
        quantity=1,
        unit_price=50.0,
        total_amount=50.0,
        is_valid=True
    )
    t_dup2 = BusinessTransaction(
        transaction_id="TXN-2026-DUP",
        transaction_date=datetime(2026, 10, 15, 14, 30),
        customer_id="CUST-1004",
        department="Enterprise",
        quantity=1,
        unit_price=50.0,
        total_amount=50.0,
        is_valid=True
    )

    db_session.add_all([t_clean, t_null_cust, t_neg, t_calc, t_dup1, t_dup2])
    db_session.commit()

    summary = run_data_quality_evaluation(db_session)

    assert summary["total_records"] == 6
    assert summary["failed_records"] > 0
    assert summary["overall_quality_score"] < 100.0
    assert "Completeness" in summary["dimension_scores"]
    assert "Uniqueness" in summary["dimension_scores"]
    assert "Validity" in summary["dimension_scores"]
    assert "Integrity" in summary["dimension_scores"]

    # Check that individual defect records are marked is_valid=False
    db_session.refresh(t_null_cust)
    assert t_null_cust.is_valid is False
    db_session.refresh(t_neg)
    assert t_neg.is_valid is False
    db_session.refresh(t_calc)
    assert t_calc.is_valid is False
    db_session.refresh(t_dup1)
    assert t_dup1.is_valid is False
