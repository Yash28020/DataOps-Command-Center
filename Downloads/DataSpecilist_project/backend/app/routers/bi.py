"""Power BI / Tableau Readiness Router.

Provides star-schema architecture models, DAX definitions, Tableau calculated fields,
and exports packaged dimensional CSV datasets.
"""
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.bi_exporter import (
    DAX_MEASURES, TABLEAU_CALCULATED_FIELDS, POWER_QUERY_M_SCRIPT,
    export_star_schema_package
)
from app.config import settings

router = APIRouter(prefix="/api/bi", tags=["Power BI & Tableau Readiness"])

@router.get("/metadata")
def get_bi_architecture_metadata():
    """Returns star schema model, entity dictionary, DAX measures, and Tableau formulas."""
    schema_model = {
        "fact_tables": [
            {
                "name": "FactTransactions",
                "description": "Grain: One line per operational sales order transaction.",
                "keys": ["transaction_key (PK)", "customer_id (FK)", "product_sku (FK)", "date_key (FK)", "department (FK)"]
            },
            {
                "name": "FactDataQualityIssues",
                "description": "Grain: One line per detected anomaly / rule violation.",
                "keys": ["issue_key (PK)", "rule_code (FK)", "record_identifier (FK)"]
            },
            {
                "name": "FactReconciliationRuns",
                "description": "Grain: One line per dual-system reconciliation run.",
                "keys": ["recon_key (PK)", "run_code (AK)"]
            }
        ],
        "dimension_tables": [
            {"name": "DimCustomer", "keys": ["customer_key (PK)", "customer_id (AK)"], "attributes": ["customer_name", "segment", "region", "country", "credit_limit"]},
            {"name": "DimProduct", "keys": ["product_key (PK)", "product_sku (AK)"], "attributes": ["product_name", "category", "department", "unit_cost", "list_price"]},
            {"name": "DimDepartment", "keys": ["department_key (PK)", "department_code (AK)"], "attributes": ["department_name", "cost_center", "head_of_department", "budget"]},
            {"name": "DimDate", "keys": ["date_key (PK)"], "attributes": ["full_date", "year", "quarter", "month_number", "month_name", "day_of_month", "day_of_week", "is_weekend"]}
        ],
        "relationships": [
            {"from": "FactTransactions.customer_id", "to": "DimCustomer.customer_id", "cardinality": "Many-to-One (*:1)"},
            {"from": "FactTransactions.product_sku", "to": "DimProduct.product_sku", "cardinality": "Many-to-One (*:1)"},
            {"from": "FactTransactions.department", "to": "DimDepartment.department_name", "cardinality": "Many-to-One (*:1)"},
            {"from": "FactTransactions.date_key", "to": "DimDate.date_key", "cardinality": "Many-to-One (*:1)"}
        ]
    }
    
    return {
        "schema_model": schema_model,
        "dax_measures": DAX_MEASURES,
        "tableau_fields": TABLEAU_CALCULATED_FIELDS,
        "power_query_script": POWER_QUERY_M_SCRIPT
    }

@router.post("/export")
def generate_bi_export(db: Session = Depends(get_db)):
    """Generates all 7 star-schema CSV tables and archives them into a zip package."""
    result = export_star_schema_package(db)
    return {
        "status": "success",
        "message": "Star schema tables successfully generated.",
        "files": result["files_generated"],
        "tables_count": result["tables_count"],
        "download_url": "/api/bi/download-package"
    }

@router.get("/download-package")
def download_star_schema_zip():
    """Serves the generated star-schema zip archive for Power BI & Tableau import."""
    zip_path = settings.BI_EXPORT_DIR / "DataOps_StarSchema_Package.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="BI export archive not found. Please click 'Generate Export' first.")
        
    return FileResponse(
        path=str(zip_path),
        filename="DataOps_StarSchema_Package.zip",
        media_type="application/zip"
    )
