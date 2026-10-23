"""File Ingestion and Data Profiling Service.

Handles CSV and XLSX parsing, data type inference, null detection,
schema validation, and database batch staging.
"""
import hashlib
import io
import os
from pathlib import Path
from typing import Any
import numpy as np
import pandas as pd
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.models import DataSource, IngestionBatch, AuditEvent

MAX_PREVIEW_ROWS = 15

def infer_column_type(series: pd.Series) -> str:
    """Infers simplified data type for a Pandas series."""
    dropped = series.dropna()
    if dropped.empty:
        return "UNKNOWN"
    
    if pd.api.types.is_datetime64_any_dtype(series):
        return "DATETIME"
    if pd.api.types.is_bool_dtype(series):
        return "BOOLEAN"
    if pd.api.types.is_integer_dtype(series):
        return "INTEGER"
    if pd.api.types.is_float_dtype(series):
        return "FLOAT"
    
    # Try parsing sample strings as dates or numbers
    sample = dropped.astype(str).head(50)
    
    # Check numeric
    numeric_converted = pd.to_numeric(sample, errors="coerce")
    if numeric_converted.notna().mean() > 0.8:
        if (numeric_converted.dropna() % 1 == 0).all():
            return "INTEGER"
        return "FLOAT"
        
    # Check datetime
    try:
        date_converted = pd.to_datetime(sample, errors="coerce")
        if date_converted.notna().mean() > 0.8:
            return "DATETIME"
    except Exception:
        pass
        
    return "STRING"

def profile_dataframe(df: pd.DataFrame, file_name: str, file_size: int) -> dict[str, Any]:
    """Generates comprehensive profile metadata for a dataframe."""
    total_rows = len(df)
    columns = list(df.columns)
    column_types = {}
    null_counts = {}
    warnings = []
    
    for col in columns:
        col_type = infer_column_type(df[col])
        column_types[col] = col_type
        null_count = int(df[col].isna().sum())
        null_counts[col] = null_count
        
        null_pct = (null_count / total_rows * 100) if total_rows > 0 else 0
        if null_pct > 20:
            warnings.append(f"Column '{col}' has high null rate: {null_pct:.1f}% ({null_count}/{total_rows})")
            
    # Check duplicate row identifiers if id-like column exists
    id_candidates = [c for c in columns if any(k in c.lower() for k in ["id", "ref", "key", "code"])]
    for id_col in id_candidates:
        dup_count = df[id_col].duplicated().sum()
        if dup_count > 0:
            warnings.append(f"Potential key column '{id_col}' contains {dup_count} duplicate values")

    # Clean sample rows for JSON serialization
    sample_df = df.head(MAX_PREVIEW_ROWS).copy()
    sample_df = sample_df.replace({np.nan: None})
    for col in sample_df.columns:
        if pd.api.types.is_datetime64_any_dtype(sample_df[col]):
            sample_df[col] = sample_df[col].dt.strftime("%Y-%m-%d %H:%M:%S")

    sample_rows = sample_df.to_dict(orient="records")
    
    return {
        "file_name": file_name,
        "file_size_bytes": file_size,
        "total_rows": total_rows,
        "columns": columns,
        "column_types": column_types,
        "null_counts": null_counts,
        "sample_rows": sample_rows,
        "validation_warnings": warnings
    }

async def read_uploaded_file_to_df(file: UploadFile) -> tuple[pd.DataFrame, bytes, str]:
    """Safely reads uploaded CSV or XLSX into a DataFrame with size validation."""
    content = await file.read()
    file_size = len(content)
    
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB")
        
    ext = Path(file.filename or "").suffix.lower()
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx, .xls) files are supported")
        
    try:
        if ext == ".csv":
            # Try utf-8 then fallback to latin1
            try:
                df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(content), encoding="latin1")
        else:
            # Excel files - openpyxl does not execute macros or formulas by default
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    return df, content, ext

def save_and_stage_datasource(
    db: Session,
    file_name: str,
    file_content: bytes,
    df: pd.DataFrame,
    source_type: str = "CSV_UPLOAD"
) -> DataSource:
    """Saves raw file to storage and registers DataSource and IngestionBatch in DB."""
    # Compute SHA-256 checksum for idempotency
    checksum = hashlib.sha256(file_content).hexdigest()
    
    # Save file to upload directory
    safe_name = f"{checksum[:12]}_{Path(file_name).name}"
    save_path = settings.UPLOAD_DIR / safe_name
    with open(save_path, "wb") as f:
        f.write(file_content)
        
    profile = profile_dataframe(df, file_name, len(file_content))
    
    data_source = DataSource(
        name=Path(file_name).stem.replace("_", " ").title(),
        source_type=source_type,
        file_name=file_name,
        file_path=str(save_path),
        file_size_bytes=len(file_content),
        row_count=len(df),
        column_count=len(df.columns),
        schema_info=profile,
        status="ACTIVE"
    )
    db.add(data_source)
    db.flush()
    
    batch_num = f"BATCH-{data_source.id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    batch = IngestionBatch(
        batch_number=batch_num,
        data_source_id=data_source.id,
        source_name=data_source.name,
        record_count=len(df),
        valid_record_count=len(df),
        invalid_record_count=0,
        status="COMPLETED",
        checksum=checksum,
        completed_at=datetime.utcnow()
    )
    db.add(batch)
    
    # Record audit event
    audit = AuditEvent(
        event_type="INGESTION",
        entity_type="DataSource",
        entity_id=str(data_source.id),
        action=f"Uploaded and staged file '{file_name}' ({len(df)} records)",
        details={"file_name": file_name, "rows": len(df), "checksum": checksum}
    )
    db.add(audit)
    db.commit()
    db.refresh(data_source)
    
    return data_source
