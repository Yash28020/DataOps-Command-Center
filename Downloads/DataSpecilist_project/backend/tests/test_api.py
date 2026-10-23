"""API endpoint tests using FastAPI TestClient."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["service"] == "DataOps Command Center"

def test_sql_templates_catalog(client):
    response = client.get("/api/sql/templates")
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) >= 5
    assert any(t["id"] == "monthly_revenue_cte" for t in templates)

def test_bi_metadata(client):
    response = client.get("/api/bi/metadata")
    assert response.status_code == 200
    data = response.json()
    assert "schema_model" in data
    assert "dax_measures" in data
    assert "tableau_fields" in data
    assert len(data["dax_measures"]) >= 4

def test_read_only_sql_guardrails(client):
    # Valid SELECT
    valid_res = client.post("/api/sql/execute", json={"query": "SELECT 1 AS test_val;"})
    assert valid_res.status_code == 200
    assert valid_res.json()["rows"][0]["test_val"] == 1

    # Forbidden DROP / DELETE
    forbidden_res = client.post("/api/sql/execute", json={"query": "DROP TABLE business_transactions;"})
    assert forbidden_res.status_code == 400
