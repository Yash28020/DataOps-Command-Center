"""End-to-End Pipeline Integration Test.

Tests the complete lifecycle:
Seed/Ingest -> Validate Rules -> Reconcile Sources -> Generate Report -> Verify Metrics Consistency.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c

def test_full_pipeline_lifecycle(client):
    # Step 1: Seed synthetic batches with controlled defects
    seed_res = client.post("/api/sources/seed-demo")
    assert seed_res.status_code == 200
    seed_data = seed_res.json()
    assert seed_data["status"] == "success"
    assert seed_data["erp_records_loaded"] > 100
    assert seed_data["ledger_records_loaded"] > 100

    # Step 2: Validate Data Quality Studio evaluation
    eval_res = client.post("/api/quality/evaluate")
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["total_records"] == seed_data["erp_records_loaded"]
    assert eval_data["overall_quality_score"] > 0
    assert len(eval_data["rule_results"]) >= 5

    # Step 3: Run Reconciliation Lab
    recon_res = client.post("/api/reconciliation/execute", json={
        "source_a_name": "ERP Operational Sales",
        "source_b_name": "Finance General Ledger",
        "tolerance_amount": 0.05
    })
    assert recon_res.status_code == 200
    recon_data = recon_res.json()
    assert recon_data["status"] == "success"
    assert recon_data["matched_count"] > 0
    assert recon_data["reconciliation_rate"] > 80.0

    # Step 4: Generate Excel Executive Pack
    report_res = client.post("/api/reports/generate?period=Q4%202026")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["sheet_count"] == 6
    assert report_data["file_size_bytes"] > 0

    # Step 5: Verify Overview Dashboard Metrics are properly aggregated
    overview_res = client.get("/api/overview/metrics")
    assert overview_res.status_code == 200
    overview_data = overview_res.json()
    assert overview_data["total_records_processed"] == seed_data["erp_records_loaded"]
    assert overview_data["reconciliation_rate"] == recon_data["reconciliation_rate"]
    assert len(overview_data["pipeline_stages"]) == 6
    assert len(overview_data["priority_issues"]) > 0

    # Step 6: Verify Business Insights
    insights_res = client.get("/api/insights")
    assert insights_res.status_code == 200
    insights_data = insights_res.json()
    assert len(insights_data["insights"]) >= 3
    assert insights_data["total_volume"] > 0
