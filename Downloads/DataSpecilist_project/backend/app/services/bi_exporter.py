"""Power BI and Tableau Star-Schema BI Exporter Service.

Generates normalized dimensional CSV datasets, Power Query M formulas,
DAX calculation scripts, and Tableau calculated fields for direct enterprise BI consumption.
"""
from datetime import datetime
from pathlib import Path
from typing import Any
import zipfile
import pandas as pd
from sqlalchemy.orm import Session
from app.config import settings
from app.models import (
    BusinessTransaction, Customer, Product,
    Department, DataQualityIssue, ReconciliationRun
)

DAX_MEASURES = [
    {
        "name": "Total Monitored Transactions",
        "description": "Distinct count of all ingested enterprise operational transactions.",
        "dax": "Total Transactions = DISTINCTCOUNT(FactTransactions[transaction_id])"
    },
    {
        "name": "Total Monitored Revenue",
        "description": "Sum of net monetary volume across all transactions.",
        "dax": "Total Revenue = SUM(FactTransactions[total_amount])"
    },
    {
        "name": "Data Quality Pass Rate",
        "description": "Percentage of transactions that passed all active validation rules without error.",
        "dax": "DQ Pass Rate = \nDIVIDE(\n    CALCULATE(COUNTROWS(FactTransactions), FactTransactions[is_valid] = TRUE()),\n    COUNTROWS(FactTransactions),\n    1.0\n)"
    },
    {
        "name": "Total Unresolved Exceptions",
        "description": "Count of open or investigating data quality exceptions requiring specialist remediation.",
        "dax": "Unresolved Exceptions = CALCULATE(COUNTROWS(FactDataQualityIssues), FactDataQualityIssues[status] IN {\"OPEN\", \"UNDER_REVIEW\"})"
    },
    {
        "name": "Reconciliation Match Rate",
        "description": "Monetary proportion of ERP transactions reconciled against Finance General Ledger within tolerance.",
        "dax": "Reconciliation Rate = \nDIVIDE(\n    SUM(FactReconciliationRuns[matched_amount]),\n    SUM(FactReconciliationRuns[source_a_amount]),\n    1.0\n)"
    },
    {
        "name": "Net Ledger Variance",
        "description": "Aggregate dollar discrepancy between ERP Operations and Finance Ledger.",
        "dax": "Net Variance = SUM(FactReconciliationRuns[net_variance])"
    }
]

TABLEAU_CALCULATED_FIELDS = [
    {
        "name": "DQ Pass Percentage",
        "formula": "SUM(IF [Is Valid] = TRUE THEN 1 ELSE 0 END) / COUNT([Transaction Id])",
        "description": "Ratio of clean records evaluated across dimensions."
    },
    {
        "name": "Variance Impact Flag",
        "formula": "IF ABS([Source A Amount] - [Source B Amount]) > 0.05 THEN 'High Variance' ELSE 'Within Tolerance' END",
        "description": "Flags line items exceeding enterprise reconciliation tolerance threshold."
    },
    {
        "name": "Weighted Quality Health Score",
        "formula": "([Completeness Score] * 0.30) + ([Uniqueness Score] * 0.25) + ([Validity Score] * 0.25) + ([Integrity Score] * 0.20)",
        "description": "Calculates normalized data trust index for BI executive cockpit."
    }
]

POWER_QUERY_M_SCRIPT = """// DataOps Command Center - Power Query M Ingestion Template
let
    Source = Csv.Document(File.Contents("FactTransactions.csv"),[Delimiter=",", Columns=14, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{
        {"transaction_id", type text},
        {"transaction_date", type datetime},
        {"customer_id", type text},
        {"product_sku", type text},
        {"department_code", type text},
        {"quantity", Int64.Type},
        {"unit_price", Currency.Type},
        {"total_amount", Currency.Type},
        {"is_valid", type logical}
    })
in
    #"Changed Type"
"""

def export_star_schema_package(db: Session) -> dict[str, Any]:
    """
    Exports all Fact and Dimension tables to CSVs in exports/bi/
    and packages them into a single zip archive for Power BI / Tableau Desktop.
    """
    bi_dir = settings.BI_EXPORT_DIR
    bi_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. FactTransactions
    txns = db.query(BusinessTransaction).all()
    fact_txns = []
    for t in txns:
        fact_txns.append({
            "transaction_key": t.id,
            "transaction_id": t.transaction_id,
            "date_key": t.transaction_date.strftime("%Y%m%d") if t.transaction_date else None,
            "transaction_date": t.transaction_date.strftime("%Y-%m-%d %H:%M:%S") if t.transaction_date else None,
            "customer_id": t.customer_id,
            "product_sku": t.product_sku,
            "department": t.department,
            "region": t.region,
            "quantity": t.quantity,
            "unit_price": t.unit_price,
            "total_amount": t.total_amount,
            "tax_amount": t.tax_amount,
            "net_amount": t.net_amount,
            "is_valid": t.is_valid,
            "payment_status": t.payment_status
        })
    df_txns = pd.DataFrame(fact_txns)
    txns_csv = bi_dir / "FactTransactions.csv"
    df_txns.to_csv(txns_csv, index=False)
    
    # 2. DimCustomer
    custs = db.query(Customer).all()
    cust_data = [{
        "customer_key": c.id,
        "customer_id": c.customer_id,
        "customer_name": c.name,
        "email": c.email,
        "segment": c.segment,
        "region": c.region,
        "country": c.country,
        "credit_limit": c.credit_limit
    } for c in custs]
    df_cust = pd.DataFrame(cust_data)
    cust_csv = bi_dir / "DimCustomer.csv"
    df_cust.to_csv(cust_csv, index=False)
    
    # 3. DimProduct
    prods = db.query(Product).all()
    prod_data = [{
        "product_key": p.id,
        "product_sku": p.sku,
        "product_name": p.name,
        "category": p.category,
        "department": p.department,
        "unit_cost": p.unit_cost,
        "list_price": p.list_price
    } for p in prods]
    df_prod = pd.DataFrame(prod_data)
    prod_csv = bi_dir / "DimProduct.csv"
    df_prod.to_csv(prod_csv, index=False)
    
    # 4. DimDepartment
    depts = db.query(Department).all()
    dept_data = [{
        "department_key": d.id,
        "department_code": d.code,
        "department_name": d.name,
        "cost_center": d.cost_center,
        "head_of_department": d.head_of_department,
        "budget": d.budget
    } for d in depts]
    df_dept = pd.DataFrame(dept_data)
    dept_csv = bi_dir / "DimDepartment.csv"
    df_dept.to_csv(dept_csv, index=False)
    
    # 5. DimDate
    if fact_txns:
        dates = pd.to_datetime([t["transaction_date"] for t in fact_txns if t["transaction_date"]])
        date_range = pd.date_range(start=dates.min().floor("D"), end=dates.max().ceil("D"))
    else:
        date_range = pd.date_range(start="2026-10-01", end="2026-12-31")
        
    date_records = []
    for d in date_range:
        date_records.append({
            "date_key": d.strftime("%Y%m%d"),
            "full_date": d.strftime("%Y-%m-%d"),
            "year": d.year,
            "quarter": f"Q{d.quarter}",
            "month_number": d.month,
            "month_name": d.strftime("%B"),
            "day_of_month": d.day,
            "day_of_week": d.strftime("%A"),
            "is_weekend": d.weekday() >= 5
        })
    df_date = pd.DataFrame(date_records)
    date_csv = bi_dir / "DimDate.csv"
    df_date.to_csv(date_csv, index=False)
    
    # 6. FactDataQualityIssues
    issues = db.query(DataQualityIssue).all()
    issues_data = [{
        "issue_key": i.id,
        "issue_code": i.issue_code,
        "run_id": i.run_id,
        "rule_code": i.rule_code,
        "rule_name": i.rule_name,
        "dimension": i.dimension,
        "severity": i.severity,
        "record_identifier": i.record_identifier,
        "field_name": i.field_name,
        "original_value": i.original_value,
        "failure_reason": i.failure_reason,
        "status": i.status,
        "assigned_to": i.assigned_to,
        "detected_at": i.detected_at.strftime("%Y-%m-%d %H:%M:%S") if i.detected_at else None
    } for i in issues]
    df_issues = pd.DataFrame(issues_data)
    issues_csv = bi_dir / "FactDataQualityIssues.csv"
    df_issues.to_csv(issues_csv, index=False)
    
    # 7. FactReconciliationRuns
    recons = db.query(ReconciliationRun).all()
    recon_data = [{
        "recon_key": r.id,
        "run_code": r.run_code,
        "source_a_name": r.source_a_name,
        "source_b_name": r.source_b_name,
        "source_a_count": r.source_a_count,
        "source_b_count": r.source_b_count,
        "source_a_amount": r.source_a_amount,
        "source_b_amount": r.source_b_amount,
        "matched_count": r.matched_count,
        "matched_amount": r.matched_amount,
        "missing_a_count": r.missing_a_count,
        "missing_b_count": r.missing_b_count,
        "amount_mismatch_count": r.amount_mismatch_count,
        "timing_difference_count": r.timing_difference_count,
        "duplicate_key_count": r.duplicate_key_count,
        "net_variance": r.net_variance,
        "reconciliation_rate": r.reconciliation_rate,
        "status": r.status,
        "completed_at": r.completed_at.strftime("%Y-%m-%d %H:%M:%S") if r.completed_at else None
    } for r in recons]
    df_recon = pd.DataFrame(recon_data)
    recon_csv = bi_dir / "FactReconciliationRuns.csv"
    df_recon.to_csv(recon_csv, index=False)
    
    # Create ZIP archive containing all 7 CSV files
    zip_path = bi_dir / "DataOps_StarSchema_Package.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for csv_f in [txns_csv, cust_csv, prod_csv, dept_csv, date_csv, issues_csv, recon_csv]:
            zipf.write(csv_f, arcname=csv_f.name)
            
    return {
        "zip_path": str(zip_path),
        "files_generated": [
            "FactTransactions.csv", "DimCustomer.csv", "DimProduct.csv",
            "DimDepartment.csv", "DimDate.csv", "FactDataQualityIssues.csv", "FactReconciliationRuns.csv"
        ],
        "tables_count": 7,
        "dax_measures": DAX_MEASURES,
        "tableau_fields": TABLEAU_CALCULATED_FIELDS,
        "power_query_script": POWER_QUERY_M_SCRIPT
    }
