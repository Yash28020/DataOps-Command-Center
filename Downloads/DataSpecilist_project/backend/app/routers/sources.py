"""Data Sources Management Router.

Handles CSV/XLSX uploads, file schema profiling, synthetic demonstration seeding,
and source catalog operations.
"""
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import DataSource, IngestionBatch, BusinessTransaction, FinanceLedgerRecord, Customer, Product, Department, AuditEvent
from app.services.ingestion import read_uploaded_file_to_df, save_and_stage_datasource, profile_dataframe
from app.services.data_generator import generate_synthetic_batches, export_synthetic_sample_files, CUSTOMERS, PRODUCTS, DEPARTMENTS
from app.services.quality_engine import run_data_quality_evaluation
from app.services.reconciliation_engine import run_reconciliation

router = APIRouter(prefix="/api/sources", tags=["Data Sources"])

@router.get("")
def list_data_sources(db: Session = Depends(get_db)):
    """Retrieves all registered enterprise data sources."""
    sources = db.query(DataSource).order_by(DataSource.id.desc()).all()
    return sources

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    source_type: str = "CSV_UPLOAD",
    db: Session = Depends(get_db)
):
    """Uploads, validates, profiles, and stages an operational dataset."""
    df, content, ext = await read_uploaded_file_to_df(file)
    data_source = save_and_stage_datasource(
        db=db,
        file_name=file.filename or "uploaded_dataset",
        file_content=content,
        df=df,
        source_type=source_type
    )
    return {
        "message": f"Successfully ingested and profiled {file.filename}",
        "source_id": data_source.id,
        "name": data_source.name,
        "row_count": data_source.row_count,
        "column_count": data_source.column_count,
        "schema_info": data_source.schema_info
    }

@router.post("/seed-demo")
def seed_synthetic_demonstration_data(db: Session = Depends(get_db)):
    """
    Seeds realistic synthetic ERP Operations and Finance Ledger data across 3 batches
    with controlled, documented defects and executes initial DQ and reconciliation.
    """
    # 1. Seed Reference Data
    # Departments
    existing_depts = {d.code for d in db.query(Department.code).all()}
    for d in DEPARTMENTS:
        if d["code"] not in existing_depts:
            db.add(Department(
                code=d["code"],
                name=d["name"],
                cost_center=d["cost_center"],
                head_of_department=d["hod"],
                budget=d["budget"]
            ))
            
    # Products
    existing_prods = {p.sku for p in db.query(Product.sku).all()}
    for p in PRODUCTS:
        if p["sku"] not in existing_prods:
            db.add(Product(
                sku=p["sku"],
                name=p["name"],
                category=p["category"],
                department=p["department"],
                unit_cost=p["unit_cost"],
                list_price=p["list_price"]
            ))
            
    # Customers
    existing_custs = {c.customer_id for c in db.query(Customer.customer_id).all()}
    for c in CUSTOMERS:
        if c["customer_id"] not in existing_custs:
            db.add(Customer(
                customer_id=c["customer_id"],
                name=c["name"],
                segment=c["segment"],
                region=c["region"],
                country=c["country"],
                credit_limit=c["credit_limit"]
            ))
    db.commit()
    
    # 2. Generate Synthetic Batches
    batches_data = generate_synthetic_batches(seed=42)
    export_synthetic_sample_files()
    
    # 3. Create or Update Data Sources
    source_erp = db.query(DataSource).filter(DataSource.name == "ERP Operational Sales").first()
    if not source_erp:
        source_erp = DataSource(
            name="ERP Operational Sales",
            source_type="ERP_CLOUD",
            file_name="erp_operational_transactions.csv",
            file_size_bytes=1048576,
            row_count=len(batches_data["erp_transactions"]),
            column_count=18,
            schema_info={"columns": list(batches_data["erp_transactions"][0].keys())},
            status="ACTIVE",
            description="Core transactional ERP operational ledger containing order line items."
        )
        db.add(source_erp)
        db.flush()
        
    source_gl = db.query(DataSource).filter(DataSource.name == "Finance General Ledger").first()
    if not source_gl:
        source_gl = DataSource(
            name="Finance General Ledger",
            source_type="GL_SYSTEM",
            file_name="finance_general_ledger.csv",
            file_size_bytes=786432,
            row_count=len(batches_data["ledger_records"]),
            column_count=11,
            schema_info={"columns": list(batches_data["ledger_records"][0].keys())},
            status="ACTIVE",
            description="Corporate accounting General Ledger entries from finance ERP."
        )
        db.add(source_gl)
        db.flush()

    # 4. Clear old transaction & ledger records for idempotent re-seeding
    db.query(BusinessTransaction).delete()
    db.query(FinanceLedgerRecord).delete()
    db.query(IngestionBatch).delete()
    db.commit()
    
    # 5. Insert Ingestion Batches & Transactions
    batch_records_map = {}
    for b_meta in batches_data["batches"]:
        b_num = b_meta["batch_number"]
        ib = IngestionBatch(
            batch_number=b_num,
            data_source_id=source_erp.id,
            source_name=source_erp.name,
            record_count=0,
            status="COMPLETED"
        )
        db.add(ib)
        db.flush()
        batch_records_map[b_num] = ib.id
        
    # Insert ERP Transactions
    erp_db_records = []
    for t in batches_data["erp_transactions"]:
        b_id = batch_records_map.get(t["batch_number"])
        erp_db_records.append(BusinessTransaction(
            batch_id=b_id,
            transaction_id=t["transaction_id"],
            transaction_date=t["transaction_date"],
            customer_id=t["customer_id"],
            customer_name=t["customer_name"],
            product_sku=t["product_sku"],
            product_category=t["product_category"],
            department=t["department"],
            region=t["region"],
            quantity=t["quantity"],
            unit_price=t["unit_price"],
            total_amount=t["total_amount"],
            tax_amount=t["tax_amount"],
            net_amount=t["net_amount"],
            currency=t["currency"],
            payment_status=t["payment_status"],
            is_valid=t["is_valid"],
            validation_notes=t["validation_notes"],
            raw_payload=t["raw_payload"]
        ))
    db.bulk_save_objects(erp_db_records)
    
    # Insert Finance Ledger Records
    gl_db_records = []
    for l in batches_data["ledger_records"]:
        gl_db_records.append(FinanceLedgerRecord(
            batch_number=l["batch_number"],
            ledger_reference=l["ledger_reference"],
            posting_date=l["posting_date"],
            account_code=l["account_code"],
            cost_center=l["cost_center"],
            external_reference=l["external_reference"],
            customer_ref=l["customer_ref"],
            posted_amount=l["posted_amount"],
            currency=l["currency"],
            entry_type=l["entry_type"],
            reconciliation_status=l["reconciliation_status"]
        ))
    db.bulk_save_objects(gl_db_records)
    db.commit()
    
    # 6. Execute initial Data Quality Run & Reconciliation
    dq_summary = run_data_quality_evaluation(db)
    recon_run = run_reconciliation(db, tolerance_amount=0.05)
    
    db.add(AuditEvent(
        event_type="SEED_DEMO",
        entity_type="SyntheticGenerator",
        entity_id="SEED-42",
        action=f"Loaded {len(erp_db_records)} ERP txns and {len(gl_db_records)} GL records with controlled defects.",
        details={"batches": 3, "defects_injected": len(batches_data["defect_manifest"])}
    ))
    db.commit()
    
    return {
        "status": "success",
        "message": "Synthetic demonstration datasets seeded and processed successfully.",
        "erp_records_loaded": len(erp_db_records),
        "ledger_records_loaded": len(gl_db_records),
        "defects_injected": len(batches_data["defect_manifest"]),
        "quality_score": dq_summary["overall_quality_score"],
        "reconciliation_rate": recon_run.reconciliation_rate
    }

@router.delete("/{source_id}")
def delete_data_source(source_id: int, db: Session = Depends(get_db)):
    """Removes a data source and associated staged files."""
    source = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found.")
    
    # Remove file if exists
    if source.file_path and Path(source.file_path).exists():
        try:
            Path(source.file_path).unlink()
        except Exception:
            pass
            
    db.delete(source)
    db.commit()
    return {"message": f"Data source {source_id} removed successfully."}
