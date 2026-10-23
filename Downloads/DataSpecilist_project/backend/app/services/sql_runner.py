"""SQL Intelligence and Analytics Service.

Executes parameterized, strictly read-only analytical SQL queries with guardrails against
destructive operations. Offers a catalog of business reporting templates with CTEs,
window functions, running totals, and reconciliation analysis.
"""
import re
import time
from typing import Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import HTTPException

# Disallowed SQL keywords for security
FORBIDDEN_KEYWORDS = [
    r"\bDROP\b", r"\bDELETE\b", r"\bUPDATE\b", r"\bINSERT\b",
    r"\bALTER\b", r"\bTRUNCATE\b", r"\bGRANT\b", r"\bREVOKE\b",
    r"\bEXEC\b", r"\bEXECUTE\b", r"\bCREATE\b", r"\bREPLACE\b"
]

PRESET_SQL_TEMPLATES = [
    {
        "id": "monthly_revenue_cte",
        "title": "Monthly Revenue & Growth (CTE)",
        "category": "Financial Analytics",
        "description": "Calculates monthly recognized revenue and month-over-month growth using Common Table Expressions.",
        "sql": """WITH MonthlyTotals AS (
    SELECT 
        strftime('%Y-%m', transaction_date) AS reporting_month,
        COUNT(id) AS transaction_count,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_deal_size
    FROM business_transactions
    WHERE is_valid = 1
    GROUP BY strftime('%Y-%m', transaction_date)
)
SELECT 
    reporting_month,
    transaction_count,
    ROUND(total_revenue, 2) AS total_revenue,
    ROUND(avg_deal_size, 2) AS avg_deal_size,
    ROUND(total_revenue - LAG(total_revenue, 1, total_revenue) OVER (ORDER BY reporting_month), 2) AS mom_variance
FROM MonthlyTotals
ORDER BY reporting_month ASC;"""
    },
    {
        "id": "window_running_totals",
        "title": "Cumulative Daily Revenue (Window Function)",
        "category": "Window Functions",
        "description": "Computes daily running revenue total using SUM(...) OVER (ORDER BY ...) window function.",
        "sql": """SELECT 
    DATE(transaction_date) AS txn_day,
    department,
    ROUND(SUM(total_amount), 2) AS daily_revenue,
    ROUND(SUM(SUM(total_amount)) OVER (
        PARTITION BY department 
        ORDER BY DATE(transaction_date) 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ), 2) AS cumulative_running_total
FROM business_transactions
WHERE is_valid = 1
GROUP BY DATE(transaction_date), department
ORDER BY txn_day ASC, department;"""
    },
    {
        "id": "dept_error_rate",
        "title": "Department Data Quality Error Rate",
        "category": "Data Quality",
        "description": "Evaluates data cleanliness rates across enterprise departments to identify risk concentration.",
        "sql": """SELECT 
    COALESCE(department, 'Unknown') AS department,
    COUNT(id) AS total_records,
    SUM(CASE WHEN is_valid = 1 THEN 1 ELSE 0 END) AS valid_records,
    SUM(CASE WHEN is_valid = 0 THEN 1 ELSE 0 END) AS defective_records,
    ROUND(100.0 * SUM(CASE WHEN is_valid = 1 THEN 1 ELSE 0 END) / COUNT(id), 2) AS pass_percentage,
    ROUND(SUM(CASE WHEN is_valid = 0 THEN total_amount ELSE 0 END), 2) AS revenue_at_risk
FROM business_transactions
GROUP BY department
ORDER BY defective_records DESC;"""
    },
    {
        "id": "reconciliation_unmatched",
        "title": "Unmatched Ledger Exceptions & Variances",
        "category": "Reconciliation",
        "description": "Identifies high-priority variances and unmatched records between ERP Operations and GL.",
        "sql": """SELECT 
    e.exception_type,
    e.key_value,
    e.source_a_amount,
    e.source_b_amount,
    ROUND(e.variance_amount, 2) AS variance_amount,
    e.owner,
    e.status,
    e.created_at
FROM reconciliation_exceptions e
JOIN reconciliation_runs r ON e.run_id = r.id
ORDER BY ABS(e.variance_amount) DESC;"""
    },
    {
        "id": "top_dq_issue_categories",
        "title": "Top Data Quality Defect Categories",
        "category": "Data Quality",
        "description": "Aggregates issues by rule code, dimension, and severity with impact counts.",
        "sql": """SELECT 
    rule_code,
    rule_name,
    dimension,
    severity,
    COUNT(id) AS total_occurrences,
    COUNT(DISTINCT record_identifier) AS affected_records,
    SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) AS open_issues
FROM data_quality_issues
GROUP BY rule_code, rule_name, dimension, severity
ORDER BY total_occurrences DESC;"""
    },
    {
        "id": "duplicate_transactions_check",
        "title": "Duplicate Transaction Identifier Detection",
        "category": "Integrity Check",
        "description": "Finds duplicate transaction keys with counts and total repeated revenue.",
        "sql": """SELECT 
    transaction_id,
    COUNT(*) AS occurrence_count,
    ROUND(SUM(total_amount), 2) AS total_exposure,
    GROUP_CONCAT(id) AS database_record_ids
FROM business_transactions
GROUP BY transaction_id
HAVING COUNT(*) > 1;"""
    }
]

def execute_readonly_sql(db: Session, query: str, limit: int = 100) -> dict[str, Any]:
    """
    Validates and executes a read-only SQL query against the active database.
    Enforces strict safety checks and row limits.
    """
    clean_query = query.strip()
    
    # 1. Reject empty queries
    if not clean_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    # 2. Check for multiple statements separated by semicolon
    statements = [s.strip() for s in clean_query.split(";") if s.strip()]
    if len(statements) > 1:
        raise HTTPException(status_code=400, detail="Multiple SQL statements in a single execution are prohibited.")
        
    single_stmt = statements[0]
    
    # 3. Must begin with SELECT or WITH
    if not (single_stmt.upper().startswith("SELECT") or single_stmt.upper().startswith("WITH")):
        raise HTTPException(status_code=400, detail="Only SELECT and WITH (CTE) queries are permitted in this analytics environment.")
        
    # 4. Check forbidden keywords
    for pattern in FORBIDDEN_KEYWORDS:
        if re.search(pattern, single_stmt, re.IGNORECASE):
            raise HTTPException(status_code=400, detail=f"Destructive or mutating SQL operations are forbidden.")
            
    # Execute query
    start_time = time.time()
    try:
        result = db.execute(text(single_stmt))
        columns = list(result.keys()) if result.returns_rows else []
        rows = [dict(zip(columns, row)) for row in result.fetchmany(limit)]
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        
        # Serialize datetime / decimal objects
        for r in rows:
            for k, v in r.items():
                if hasattr(v, "isoformat"):
                    r[k] = v.isoformat()
                elif hasattr(v, "__float__") and not isinstance(v, (int, float, bool)):
                    r[k] = float(v)
                    
        return {
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "execution_time_ms": elapsed_ms,
            "query": single_stmt
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL Execution Error: {str(e)}")
