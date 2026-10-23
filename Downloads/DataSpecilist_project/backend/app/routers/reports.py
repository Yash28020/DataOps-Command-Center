"""Excel Reporting Studio Router.

Generates and serves multi-sheet openpyxl Excel reporting packs.
"""
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ReportRun
from app.services.excel_generator import generate_enterprise_report_pack

router = APIRouter(prefix="/api/reports", tags=["Excel Reporting Studio"])

@router.get("")
def list_reports(db: Session = Depends(get_db)):
    """Retrieves reporting history."""
    return db.query(ReportRun).order_by(ReportRun.id.desc()).all()

@router.post("/generate")
def trigger_excel_report_generation(
    period: str = "Q4 2026",
    db: Session = Depends(get_db)
):
    """Triggers generation of a formatted 6-tab Excel report workbook."""
    report = generate_enterprise_report_pack(db, reporting_period=period)
    return {
        "status": "success",
        "report_id": report.id,
        "report_code": report.report_code,
        "file_name": report.file_name,
        "sheet_count": report.sheet_count,
        "file_size_bytes": report.file_size_bytes,
        "download_url": f"/api/reports/download/{report.id}"
    }

@router.get("/download/{report_id}")
def download_excel_report(report_id: int, db: Session = Depends(get_db)):
    """Downloads the generated .xlsx workbook."""
    report = db.query(ReportRun).filter(ReportRun.id == report_id).first()
    if not report or not Path(report.file_path).exists():
        raise HTTPException(status_code=404, detail="Report file not found.")
        
    return FileResponse(
        path=report.file_path,
        filename=report.file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
