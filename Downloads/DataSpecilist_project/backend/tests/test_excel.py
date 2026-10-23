"""Tests for Excel Reporting Studio."""
from datetime import datetime
from pathlib import Path
import openpyxl
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import BusinessTransaction, ReconciliationRun
from app.services.excel_generator import generate_enterprise_report_pack

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    yield session
    session.close()

def test_excel_multi_sheet_generation(db_session):
    # Add sample transaction
    txn = BusinessTransaction(
        transaction_id="TXN-EXCEL-01",
        transaction_date=datetime(2026, 10, 15, 12, 0),
        customer_id="CUST-1001",
        customer_name="Excel Test Corp",
        product_sku="SKU-ENT-101",
        department="Enterprise",
        quantity=5,
        unit_price=100.0,
        total_amount=500.0,
        is_valid=True
    )
    db_session.add(txn)
    
    recon = ReconciliationRun(
        run_code="REC-EXCEL-01",
        source_a_name="ERP",
        source_b_name="GL",
        source_a_count=1,
        source_b_count=1,
        source_a_amount=500.0,
        source_b_amount=500.0,
        matched_count=1,
        matched_amount=500.0,
        reconciliation_rate=100.0,
        net_variance=0.0
    )
    db_session.add(recon)
    db_session.commit()
    
    report_run = generate_enterprise_report_pack(db_session, reporting_period="Q4 2026")
    
    assert report_run.id is not None
    assert report_run.sheet_count == 6
    assert Path(report_run.file_path).exists()
    assert report_run.file_size_bytes > 0
    
    # Open workbook with openpyxl and verify sheets and freeze panes
    wb = openpyxl.load_workbook(report_run.file_path)
    expected_sheets = [
        "Executive Summary",
        "Data Quality Report",
        "Reconciliation Summary",
        "Exception Register",
        "Cleaned Data",
        "Processing Audit"
    ]
    for s_name in expected_sheets:
        assert s_name in wb.sheetnames
        
    # Check that Executive Summary has title and freeze panes
    ws_exec = wb["Executive Summary"]
    assert "DATAOPS COMMAND CENTER" in str(ws_exec["A1"].value)
    assert ws_exec.freeze_panes is not None
