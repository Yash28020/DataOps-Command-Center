"""Enterprise Excel Reporting Studio.

Generates multi-sheet, beautifully formatted .xlsx workbooks using openpyxl:
1. Executive Summary
2. Data Quality Report
3. Reconciliation Summary
4. Exception Register
5. Cleaned Data
6. Processing Audit
"""
from datetime import datetime
from pathlib import Path
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session
from app.config import settings
from app.models import (
    BusinessTransaction, FinanceLedgerRecord,
    ValidationResult, DataQualityIssue,
    ReconciliationRun, ReconciliationException,
    ReportRun, ProcessingRun, AuditEvent
)

# Design System Palette (Luminous Data Universe Corporate)
NAVY_HEADER = "0F172A"       # Deep slate midnight
CYAN_ACCENT = "0284C7"       # Vibrant professional cyan
LIGHT_ROW_ALT = "F8FAFC"     # Clean soft row zebra
BORDER_GRAY = "CBD5E1"       # Clean divider border
MINT_PASS = "DCFCE7"         # Soft success mint
AMBER_WARN = "FEF3C7"        # Soft warning amber
CORAL_FAIL = "FEE2E2"        # Soft alert coral

def style_header_cell(cell, text: str, bg_color: str = NAVY_HEADER, font_color: str = "FFFFFF", size: int = 11):
    cell.value = text
    cell.font = Font(name="Segoe UI", size=size, bold=True, color=font_color)
    cell.fill = PatternFill(start_color=bg_color, end_color=bg_color, fill_type="solid")
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

def style_data_cell(cell, value, is_numeric=False, is_currency=False, is_pct=False, is_date=False, is_alt=False):
    cell.value = value
    cell.font = Font(name="Segoe UI", size=10, color="0F172A")
    cell.alignment = Alignment(
        horizontal="right" if (is_numeric or is_currency or is_pct) else "left",
        vertical="center"
    )
    if is_alt:
        cell.fill = PatternFill(start_color=LIGHT_ROW_ALT, end_color=LIGHT_ROW_ALT, fill_type="solid")
    thin = Side(border_style="thin", color=BORDER_GRAY)
    cell.border = Border(top=thin, left=thin, right=thin, bottom=thin)
    
    if is_currency:
        cell.number_format = '$#,##0.00'
    elif is_pct:
        cell.number_format = '0.0%'
    elif is_numeric:
        cell.number_format = '#,##0'
    elif is_date and value:
        cell.number_format = 'yyyy-mm-dd hh:mm'

def autofit_column_widths(ws, min_width=12, max_width=50):
    for col in ws.columns:
        col_letter = get_column_letter(col[0].column)
        max_len = 0
        for cell in col:
            val = str(cell.value or '')
            if cell.number_format and '$' in cell.number_format:
                val = '$' + val
            max_len = max(max_len, len(val))
        ws.column_dimensions[col_letter].width = max(min_width, min(max_len + 3, max_width))

def generate_enterprise_report_pack(db: Session, reporting_period: str = "Q4 2026") -> ReportRun:
    """
    Generates a full 6-tab executive workbook and persists ReportRun record.
    """
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)
    
    # -------------------------------------------------------------
    # TAB 1: EXECUTIVE SUMMARY
    # -------------------------------------------------------------
    ws_exec = wb.create_sheet(title="Executive Summary")
    ws_exec.views.sheetView[0].showGridLines = True
    
    # Title Banner
    ws_exec.merge_cells("A1:G2")
    banner = ws_exec["A1"]
    banner.value = f"DATAOPS COMMAND CENTER — EXECUTIVE SUMMARY ({reporting_period})"
    banner.font = Font(name="Segoe UI", size=16, bold=True, color="FFFFFF")
    banner.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
    banner.alignment = Alignment(horizontal="center", vertical="center")
    
    # Metadata Subtitle
    ws_exec["A3"] = f"Report Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}  |  Classification: Confidential Enterprise Data"
    ws_exec["A3"].font = Font(name="Segoe UI", size=9, italic=True, color="64748B")
    
    # Gather aggregate data
    total_txns = db.query(BusinessTransaction).count()
    valid_txns = db.query(BusinessTransaction).filter(BusinessTransaction.is_valid == True).count()
    pass_rate = (valid_txns / total_txns * 100) if total_txns > 0 else 100.0
    txns_amounts = db.query(BusinessTransaction.total_amount).all()
    revenue_sum = sum((t[0] or 0.0) for t in txns_amounts)
    
    latest_recon = db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).first()
    recon_rate = latest_recon.reconciliation_rate if latest_recon else 100.0
    net_var = latest_recon.net_variance if latest_recon else 0.0
    
    # KPI Cards Row
    kpis = [
        ("TOTAL TRANSACTIONS", total_txns, False, False),
        ("TOTAL MONITORED REVENUE", revenue_sum, True, False),
        ("DQ PASS RATE", pass_rate / 100, False, True),
        ("RECONCILIATION RATE", recon_rate / 100, False, True),
        ("NET VARIANCE", net_var, True, False)
    ]
    
    for idx, (label, val, is_curr, is_pct) in enumerate(kpis):
        col_start = get_column_letter(idx + 1)
        c_label = ws_exec[f"{col_start}5"]
        c_label.value = label
        c_label.font = Font(name="Segoe UI", size=8, bold=True, color="64748B")
        c_label.alignment = Alignment(horizontal="center", vertical="center")
        c_label.fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
        
        c_val = ws_exec[f"{col_start}6"]
        c_val.value = val
        c_val.font = Font(name="Segoe UI", size=14, bold=True, color=CYAN_ACCENT)
        c_val.alignment = Alignment(horizontal="center", vertical="center")
        c_val.fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
        if is_curr:
            c_val.number_format = '$#,##0.00'
        elif is_pct:
            c_val.number_format = '0.0%'
        else:
            c_val.number_format = '#,##0'
            
    # Section: Core Operations Overview
    ws_exec["A8"] = "OPERATIONAL RECONCILIATION SNAPSHOT"
    ws_exec["A8"].font = Font(name="Segoe UI", size=12, bold=True, color=NAVY_HEADER)
    
    recon_headers = ["Metric / Description", "ERP Operational Source", "General Ledger Source", "Variance", "Status"]
    for c_i, h in enumerate(recon_headers, 1):
        style_header_cell(ws_exec.cell(row=9, column=c_i), h, bg_color="334155")
        
    recon_rows = [
        ("Total Records Evaluated", latest_recon.source_a_count if latest_recon else 0, latest_recon.source_b_count if latest_recon else 0, (latest_recon.source_a_count - latest_recon.source_b_count) if latest_recon else 0, "VERIFIED"),
        ("Monetary Volume Evaluated", latest_recon.source_a_amount if latest_recon else 0.0, latest_recon.source_b_amount if latest_recon else 0.0, latest_recon.net_variance if latest_recon else 0.0, "EXCEPTIONS DETECTED"),
        ("Matched In Both Systems", latest_recon.matched_count if latest_recon else 0, latest_recon.matched_count if latest_recon else 0, 0, "MATCHED"),
        ("Unmatched / Timing Variances", (latest_recon.missing_b_count + latest_recon.timing_difference_count) if latest_recon else 0, latest_recon.missing_a_count if latest_recon else 0, (latest_recon.missing_b_count - latest_recon.missing_a_count) if latest_recon else 0, "IN REVIEW")
    ]
    
    for r_i, (m_name, a_val, b_val, var_val, st) in enumerate(recon_rows, 10):
        is_curr = "Volume" in m_name or "Variance" in m_name
        is_alt = (r_i % 2 == 1)
        style_data_cell(ws_exec.cell(row=r_i, column=1), m_name, is_alt=is_alt)
        style_data_cell(ws_exec.cell(row=r_i, column=2), a_val, is_currency=is_curr, is_numeric=not is_curr, is_alt=is_alt)
        style_data_cell(ws_exec.cell(row=r_i, column=3), b_val, is_currency=is_curr, is_numeric=not is_curr, is_alt=is_alt)
        style_data_cell(ws_exec.cell(row=r_i, column=4), var_val, is_currency=is_curr, is_numeric=not is_curr, is_alt=is_alt)
        c_st = ws_exec.cell(row=r_i, column=5)
        style_data_cell(c_st, st, is_alt=is_alt)
        c_st.alignment = Alignment(horizontal="center")
        
    autofit_column_widths(ws_exec)
    ws_exec.freeze_panes = "A5"
    
    # -------------------------------------------------------------
    # TAB 2: DATA QUALITY REPORT
    # -------------------------------------------------------------
    ws_dq = wb.create_sheet(title="Data Quality Report")
    ws_dq.views.sheetView[0].showGridLines = True
    
    dq_headers = ["Rule Code", "Rule Name", "Dimension", "Severity", "Records Evaluated", "Records Passed", "Records Failed", "Pass Rate %", "Status"]
    for c_i, h in enumerate(dq_headers, 1):
        style_header_cell(ws_dq.cell(row=1, column=c_i), h)
        
    val_results = db.query(ValidationResult).order_by(ValidationResult.id.desc()).limit(20).all()
    for r_i, res in enumerate(val_results, 2):
        is_alt = (r_i % 2 == 1)
        style_data_cell(ws_dq.cell(row=r_i, column=1), res.rule_code, is_alt=is_alt)
        style_data_cell(ws_dq.cell(row=r_i, column=2), res.rule_code.replace("_", " ").title(), is_alt=is_alt)
        style_data_cell(ws_dq.cell(row=r_i, column=3), "Validity", is_alt=is_alt)
        style_data_cell(ws_dq.cell(row=r_i, column=4), "CRITICAL" if res.status == "FAIL" else "WARNING", is_alt=is_alt)
        style_data_cell(ws_dq.cell(row=r_i, column=5), res.records_evaluated, is_numeric=True, is_alt=is_alt)
        style_data_cell(ws_dq.cell(row=r_i, column=6), res.records_passed, is_numeric=True, is_alt=is_alt)
        style_data_cell(ws_dq.cell(row=r_i, column=7), res.records_failed, is_numeric=True, is_alt=is_alt)
        style_data_cell(ws_dq.cell(row=r_i, column=8), res.pass_rate / 100, is_pct=True, is_alt=is_alt)
        
        c_st = ws_dq.cell(row=r_i, column=9)
        style_data_cell(c_st, res.status, is_alt=is_alt)
        c_st.alignment = Alignment(horizontal="center")
        if res.status == "PASS":
            c_st.fill = PatternFill(start_color=MINT_PASS, end_color=MINT_PASS, fill_type="solid")
        elif res.status == "WARN":
            c_st.fill = PatternFill(start_color=AMBER_WARN, end_color=AMBER_WARN, fill_type="solid")
        else:
            c_st.fill = PatternFill(start_color=CORAL_FAIL, end_color=CORAL_FAIL, fill_type="solid")

    autofit_column_widths(ws_dq)
    ws_dq.freeze_panes = "A2"
    
    # -------------------------------------------------------------
    # TAB 3: RECONCILIATION SUMMARY
    # -------------------------------------------------------------
    ws_rec = wb.create_sheet(title="Reconciliation Summary")
    ws_rec.views.sheetView[0].showGridLines = True
    
    rec_headers = ["Run Code", "Source A (ERP)", "Source B (GL)", "Source A Records", "Source B Records", "Source A Amount", "Source B Amount", "Matched Count", "Recon Rate %", "Net Variance", "Status"]
    for c_i, h in enumerate(rec_headers, 1):
        style_header_cell(ws_rec.cell(row=1, column=c_i), h)
        
    rec_runs = db.query(ReconciliationRun).order_by(ReconciliationRun.id.desc()).limit(15).all()
    for r_i, r in enumerate(rec_runs, 2):
        is_alt = (r_i % 2 == 1)
        style_data_cell(ws_rec.cell(row=r_i, column=1), r.run_code, is_alt=is_alt)
        style_data_cell(ws_rec.cell(row=r_i, column=2), r.source_a_name, is_alt=is_alt)
        style_data_cell(ws_rec.cell(row=r_i, column=3), r.source_b_name, is_alt=is_alt)
        style_data_cell(ws_rec.cell(row=r_i, column=4), r.source_a_count, is_numeric=True, is_alt=is_alt)
        style_data_cell(ws_rec.cell(row=r_i, column=5), r.source_b_count, is_numeric=True, is_alt=is_alt)
        style_data_cell(ws_rec.cell(row=r_i, column=6), r.source_a_amount, is_currency=True, is_alt=is_alt)
        style_data_cell(ws_rec.cell(row=r_i, column=7), r.source_b_amount, is_currency=True, is_alt=is_alt)
        style_data_cell(ws_rec.cell(row=r_i, column=8), r.matched_count, is_numeric=True, is_alt=is_alt)
        style_data_cell(ws_rec.cell(row=r_i, column=9), r.reconciliation_rate / 100, is_pct=True, is_alt=is_alt)
        style_data_cell(ws_rec.cell(row=r_i, column=10), r.net_variance, is_currency=True, is_alt=is_alt)
        
        c_st = ws_rec.cell(row=r_i, column=11)
        style_data_cell(c_st, r.status, is_alt=is_alt)
        c_st.alignment = Alignment(horizontal="center")
        
    autofit_column_widths(ws_rec)
    ws_rec.freeze_panes = "A2"
    
    # -------------------------------------------------------------
    # TAB 4: EXCEPTION REGISTER
    # -------------------------------------------------------------
    ws_exc = wb.create_sheet(title="Exception Register")
    ws_exc.views.sheetView[0].showGridLines = True
    
    exc_headers = ["Exception ID", "Type", "Key Value", "Source A Ref", "Source B Ref", "Source A Amount", "Source B Amount", "Variance", "Owner", "Status", "Audit Notes"]
    for c_i, h in enumerate(exc_headers, 1):
        style_header_cell(ws_exc.cell(row=1, column=c_i), h)
        
    exceptions = db.query(ReconciliationException).order_by(ReconciliationException.id.desc()).limit(100).all()
    for r_i, e in enumerate(exceptions, 2):
        is_alt = (r_i % 2 == 1)
        style_data_cell(ws_exc.cell(row=r_i, column=1), f"EXC-{e.id:04d}", is_alt=is_alt)
        style_data_cell(ws_exc.cell(row=r_i, column=2), e.exception_type, is_alt=is_alt)
        style_data_cell(ws_exc.cell(row=r_i, column=3), e.key_value, is_alt=is_alt)
        style_data_cell(ws_exc.cell(row=r_i, column=4), e.source_a_record_id or "N/A", is_alt=is_alt)
        style_data_cell(ws_exc.cell(row=r_i, column=5), e.source_b_record_id or "N/A", is_alt=is_alt)
        style_data_cell(ws_exc.cell(row=r_i, column=6), e.source_a_amount or 0.0, is_currency=True, is_alt=is_alt)
        style_data_cell(ws_exc.cell(row=r_i, column=7), e.source_b_amount or 0.0, is_currency=True, is_alt=is_alt)
        style_data_cell(ws_exc.cell(row=r_i, column=8), e.variance_amount or 0.0, is_currency=True, is_alt=is_alt)
        style_data_cell(ws_exc.cell(row=r_i, column=9), e.owner, is_alt=is_alt)
        
        c_st = ws_exc.cell(row=r_i, column=10)
        style_data_cell(c_st, e.status, is_alt=is_alt)
        c_st.alignment = Alignment(horizontal="center")
        if e.status == "NEW":
            c_st.fill = PatternFill(start_color=CORAL_FAIL, end_color=CORAL_FAIL, fill_type="solid")
        else:
            c_st.fill = PatternFill(start_color=MINT_PASS, end_color=MINT_PASS, fill_type="solid")
            
        style_data_cell(ws_exc.cell(row=r_i, column=11), e.notes or "", is_alt=is_alt)
        
    autofit_column_widths(ws_exc)
    ws_exc.freeze_panes = "A2"
    
    # -------------------------------------------------------------
    # TAB 5: CLEANED DATA
    # -------------------------------------------------------------
    ws_clean = wb.create_sheet(title="Cleaned Data")
    ws_clean.views.sheetView[0].showGridLines = True
    
    clean_headers = ["Transaction ID", "Date", "Customer ID", "Customer Name", "Product SKU", "Category", "Department", "Region", "Quantity", "Unit Price", "Total Amount", "Tax", "Net Amount", "Validation Status"]
    for c_i, h in enumerate(clean_headers, 1):
        style_header_cell(ws_clean.cell(row=1, column=c_i), h)
        
    txns = db.query(BusinessTransaction).order_by(BusinessTransaction.id.desc()).limit(250).all()
    for r_i, t in enumerate(txns, 2):
        is_alt = (r_i % 2 == 1)
        style_data_cell(ws_clean.cell(row=r_i, column=1), t.transaction_id, is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=2), t.transaction_date.strftime("%Y-%m-%d %H:%M") if t.transaction_date else "", is_date=True, is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=3), t.customer_id or "UNASSIGNED", is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=4), t.customer_name or "Unknown Entity", is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=5), t.product_sku or "N/A", is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=6), t.product_category or "Uncategorized", is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=7), t.department or "General", is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=8), t.region or "Global", is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=9), t.quantity, is_numeric=True, is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=10), t.unit_price, is_currency=True, is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=11), t.total_amount, is_currency=True, is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=12), t.tax_amount, is_currency=True, is_alt=is_alt)
        style_data_cell(ws_clean.cell(row=r_i, column=13), t.net_amount, is_currency=True, is_alt=is_alt)
        
        c_st = ws_clean.cell(row=r_i, column=14)
        style_data_cell(c_st, "VERIFIED" if t.is_valid else "DEFECT_FLAGGED", is_alt=is_alt)
        c_st.alignment = Alignment(horizontal="center")
        if t.is_valid:
            c_st.fill = PatternFill(start_color=MINT_PASS, end_color=MINT_PASS, fill_type="solid")
        else:
            c_st.fill = PatternFill(start_color=CORAL_FAIL, end_color=CORAL_FAIL, fill_type="solid")
            
    autofit_column_widths(ws_clean)
    ws_clean.freeze_panes = "A2"
    
    # -------------------------------------------------------------
    # TAB 6: PROCESSING AUDIT
    # -------------------------------------------------------------
    ws_audit = wb.create_sheet(title="Processing Audit")
    ws_audit.views.sheetView[0].showGridLines = True
    
    audit_headers = ["Audit ID", "Timestamp", "Event Type", "Target Entity", "Action Performed", "User / Agent", "IP Address"]
    for c_i, h in enumerate(audit_headers, 1):
        style_header_cell(ws_audit.cell(row=1, column=c_i), h)
        
    audits = db.query(AuditEvent).order_by(AuditEvent.id.desc()).limit(100).all()
    for r_i, a in enumerate(audits, 2):
        is_alt = (r_i % 2 == 1)
        style_data_cell(ws_audit.cell(row=r_i, column=1), f"AUD-{a.id:05d}", is_alt=is_alt)
        style_data_cell(ws_audit.cell(row=r_i, column=2), a.timestamp.strftime("%Y-%m-%d %H:%M:%S") if a.timestamp else "", is_date=True, is_alt=is_alt)
        style_data_cell(ws_audit.cell(row=r_i, column=3), a.event_type, is_alt=is_alt)
        style_data_cell(ws_audit.cell(row=r_i, column=4), f"{a.entity_type} ({a.entity_id or 'All'})", is_alt=is_alt)
        style_data_cell(ws_audit.cell(row=r_i, column=5), a.action, is_alt=is_alt)
        style_data_cell(ws_audit.cell(row=r_i, column=6), a.user_id, is_alt=is_alt)
        style_data_cell(ws_audit.cell(row=r_i, column=7), a.ip_address, is_alt=is_alt)
        
    autofit_column_widths(ws_audit)
    ws_audit.freeze_panes = "A2"
    
    # Save Workbook
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S%f")[:19]
    file_name = f"DataOps_Executive_Pack_{timestamp_str}.xlsx"
    out_path = settings.REPORTS_DIR / file_name
    wb.save(out_path)
    
    file_size = out_path.stat().st_size
    report_code = f"REP-PKG-{timestamp_str}"
    
    report_run = ReportRun(
        report_code=report_code,
        report_type="EXCEL_FULL_PACK",
        title=f"DataOps Executive & Audit Workbook ({reporting_period})",
        period=reporting_period,
        file_name=file_name,
        file_path=str(out_path),
        file_size_bytes=file_size,
        record_count=total_txns,
        sheet_count=6,
        status="COMPLETED",
        generated_by="DataOps Automated Engine"
    )
    db.add(report_run)
    db.commit()
    db.refresh(report_run)
    
    return report_run
