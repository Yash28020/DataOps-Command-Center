"""Synthetic Data Generator for DataOps Command Center.

Generates realistic enterprise operational ERP transactions and matching Finance Ledger records
with controlled, documented defects across multiple batches.
"""
import random
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
from app.config import settings

# Master Reference Data
DEPARTMENTS = [
    {"code": "DEP-SALES", "name": "Sales", "cost_center": "CC-101", "hod": "Sarah Jenkins", "budget": 1250000.0},
    {"code": "DEP-FIN", "name": "Finance", "cost_center": "CC-102", "hod": "Marcus Vance", "budget": 850000.0},
    {"code": "DEP-OPS", "name": "Operations", "cost_center": "CC-103", "hod": "Elena Rostova", "budget": 2100000.0},
    {"code": "DEP-SUP", "name": "Supply Chain", "cost_center": "CC-104", "hod": "David Chen", "budget": 1750000.0},
    {"code": "DEP-RET", "name": "Retail", "cost_center": "CC-105", "hod": "Amira Patel", "budget": 3200000.0},
    {"code": "DEP-ENT", "name": "Enterprise", "cost_center": "CC-106", "hod": "Liam O'Connor", "budget": 4500000.0},
]

PRODUCTS = [
    {"sku": "SKU-ENT-101", "name": "Apex Cloud Gateway Enterprise", "category": "Cloud Infrastructure", "department": "Enterprise", "unit_cost": 1200.0, "list_price": 2499.0},
    {"sku": "SKU-ENT-102", "name": "Vortex AI Analytics Suite", "category": "Data Platforms", "department": "Enterprise", "unit_cost": 3100.0, "list_price": 5800.0},
    {"sku": "SKU-RET-201", "name": "Smart Edge POS Terminal X3", "category": "Hardware", "department": "Retail", "unit_cost": 210.0, "list_price": 499.0},
    {"sku": "SKU-RET-202", "name": "Omni-Channel Loyalty Sensor", "category": "Hardware", "department": "Retail", "unit_cost": 85.0, "list_price": 189.0},
    {"sku": "SKU-OPS-301", "name": "Warehouse Autonomous Scanner", "category": "Industrial IoT", "department": "Operations", "unit_cost": 450.0, "list_price": 950.0},
    {"sku": "SKU-OPS-302", "name": "Fleet Telematics Module 4G", "category": "Industrial IoT", "department": "Operations", "unit_cost": 140.0, "list_price": 320.0},
    {"sku": "SKU-SUP-401", "name": "Pallet RFID Tracker Pack", "category": "Logistics", "department": "Supply Chain", "unit_cost": 65.0, "list_price": 145.0},
    {"sku": "SKU-SUP-402", "name": "Cold-Chain Temperature Probe", "category": "Logistics", "department": "Supply Chain", "unit_cost": 110.0, "list_price": 275.0},
    {"sku": "SKU-FIN-501", "name": "Treasury Reconciliation Connector", "category": "Financial Software", "department": "Finance", "unit_cost": 500.0, "list_price": 1200.0},
    {"sku": "SKU-SAL-601", "name": "B2B Lead Intelligence Seat", "category": "SaaS Subscription", "department": "Sales", "unit_cost": 45.0, "list_price": 120.0},
]

CUSTOMERS = [
    {"customer_id": "CUST-1001", "name": "Nexora Global Logistics", "segment": "Enterprise", "region": "North America", "country": "United States", "credit_limit": 250000.0},
    {"customer_id": "CUST-1002", "name": "BlueHarbor Retail Group", "segment": "Enterprise", "region": "Europe", "country": "United Kingdom", "credit_limit": 500000.0},
    {"customer_id": "CUST-1003", "name": "Zenith Medical Supplies", "segment": "Commercial", "region": "North America", "country": "Canada", "credit_limit": 150000.0},
    {"customer_id": "CUST-1004", "name": "Kuroda Precision Robotics", "segment": "Enterprise", "region": "Asia-Pacific", "country": "Japan", "credit_limit": 400000.0},
    {"customer_id": "CUST-1005", "name": "Solstice Energy Labs", "segment": "Commercial", "region": "Europe", "country": "Germany", "credit_limit": 175000.0},
    {"customer_id": "CUST-1006", "name": "Meridian Maritime Freight", "segment": "Enterprise", "region": "Asia-Pacific", "country": "Singapore", "credit_limit": 300000.0},
    {"customer_id": "CUST-1007", "name": "Vanguard Agritech", "segment": "SMB", "region": "Latin America", "country": "Brazil", "credit_limit": 90000.0},
    {"customer_id": "CUST-1008", "name": "Beacon FinTech Holdings", "segment": "Enterprise", "region": "North America", "country": "United States", "credit_limit": 600000.0},
    {"customer_id": "CUST-1009", "name": "Nordic Data Systems", "segment": "Commercial", "region": "Europe", "country": "Sweden", "credit_limit": 140000.0},
    {"customer_id": "CUST-1010", "name": "Aether Dynamics Aerospace", "segment": "Enterprise", "region": "North America", "country": "United States", "credit_limit": 800000.0},
]

def generate_synthetic_batches(seed: int = 42, base_count_per_batch: int = 150):
    """
    Generates 3 synthetic batches with controlled, documented data quality defects
    and financial reconciliation scenarios.
    
    Returns:
        dict: {
            "batches": list of batch metadata,
            "erp_transactions": list of dicts,
            "ledger_records": list of dicts,
            "defect_manifest": list of injected defect explanations
        }
    """
    random.seed(seed)
    
    batches_meta = [
        {"batch_number": "BATCH-2026-10", "name": "October 2026 Operational Batch", "start_date": datetime(2026, 10, 1), "end_date": datetime(2026, 10, 31)},
        {"batch_number": "BATCH-2026-11", "name": "November 2026 Operational Batch", "start_date": datetime(2026, 11, 1), "end_date": datetime(2026, 11, 30)},
        {"batch_number": "BATCH-2026-12", "name": "December 2026 Operational Batch", "start_date": datetime(2026, 12, 1), "end_date": datetime(2026, 12, 31)},
    ]
    
    all_erp_txns = []
    all_ledger_records = []
    defect_manifest = []
    
    global_txn_counter = 10000
    global_ledger_counter = 50000
    
    for b_idx, b_meta in enumerate(batches_meta):
        batch_num = b_meta["batch_number"]
        start_dt = b_meta["start_date"]
        end_dt = b_meta["end_date"]
        batch_duration_days = (end_dt - start_dt).days
        
        batch_txns = []
        batch_ledgers = []
        
        count = base_count_per_batch + (b_idx * 25)
        
        for i in range(count):
            global_txn_counter += 1
            txn_id = f"TXN-{start_dt.year}-{global_txn_counter}"
            
            # Random date within batch period
            day_offset = random.randint(0, batch_duration_days)
            txn_date = start_dt + timedelta(days=day_offset, hours=random.randint(8, 20), minutes=random.randint(0, 59))
            
            cust = random.choice(CUSTOMERS)
            prod = random.choice(PRODUCTS)
            dept = prod["department"]
            qty = random.randint(1, 12)
            unit_price = prod["list_price"]
            total_amount = round(qty * unit_price, 2)
            tax_amount = round(total_amount * 0.0825, 2)
            net_amount = round(total_amount + tax_amount, 2)
            category = prod["category"]
            customer_id = cust["customer_id"]
            customer_name = cust["name"]
            region = cust["region"]
            payment_status = "COMPLETED"
            
            is_valid = True
            validation_notes = []
            
            # --- INJECT CONTROLLED DATA QUALITY DEFECTS (Approx 8-10% of records) ---
            
            # 1. Defect: Missing Customer ID (Completeness error)
            if i in [7, 45, 92]:
                customer_id = None
                customer_name = None
                is_valid = False
                validation_notes.append("NULL_CUSTOMER_ID: Mandatory customer reference is missing")
                defect_manifest.append({"batch": batch_num, "txn_id": txn_id, "type": "NULL_CUSTOMER_ID", "impact": "Violates referential completeness"})
            
            # 2. Defect: Inconsistent Category Casing / Formatting (Standardization error)
            elif i in [12, 60, 110]:
                category = random.choice([category.upper(), category.lower(), category[:4] + "..."])
                is_valid = False
                validation_notes.append("CATEGORY_FORMAT_DRIFT: Category string casing violates naming convention")
                defect_manifest.append({"batch": batch_num, "txn_id": txn_id, "type": "CATEGORY_DRIFT", "impact": "Breaks BI categorization hierarchy"})
            
            # 3. Defect: Invalid / Negative Total Amount (Range validity error)
            elif i in [23, 78]:
                total_amount = -1 * abs(total_amount)
                net_amount = total_amount
                is_valid = False
                validation_notes.append("NEGATIVE_TOTAL_AMOUNT: Transaction revenue cannot be negative without credit memo")
                defect_manifest.append({"batch": batch_num, "txn_id": txn_id, "type": "NEGATIVE_AMOUNT", "impact": "Distorts top-line revenue calculations"})
            
            # 4. Defect: Calculation mismatch (Cross-column integrity error: total != qty * unit_price)
            elif i in [34, 85]:
                total_amount = round(total_amount + 250.00, 2)
                is_valid = False
                validation_notes.append("CALCULATION_MISMATCH: Total Amount does not equal Quantity * Unit Price")
                defect_manifest.append({"batch": batch_num, "txn_id": txn_id, "type": "CROSS_COLUMN_MISMATCH", "impact": "Internal invoice mathematical discrepancy"})

            # 5. Defect: Invalid Date format / Future Out-of-Range Date
            elif i in [18]:
                txn_date = txn_date + timedelta(days=90) # Future date
                is_valid = False
                validation_notes.append("FUTURE_POSTING_DATE: Transaction date exceeds current accounting period")
                defect_manifest.append({"batch": batch_num, "txn_id": txn_id, "type": "FUTURE_DATE", "impact": "Period allocation error"})
            
            # Create ERP record
            erp_record = {
                "batch_number": batch_num,
                "transaction_id": txn_id,
                "transaction_date": txn_date,
                "customer_id": customer_id,
                "customer_name": customer_name,
                "product_sku": prod["sku"],
                "product_category": category,
                "department": dept,
                "region": region,
                "quantity": qty,
                "unit_price": unit_price,
                "total_amount": total_amount,
                "tax_amount": tax_amount,
                "net_amount": net_amount,
                "currency": "USD",
                "payment_status": payment_status,
                "is_valid": is_valid,
                "validation_notes": "; ".join(validation_notes) if validation_notes else "CLEAN",
                "raw_payload": {
                    "source": "ERP_SALES_CLOUD",
                    "terminal_id": f"TERM-{random.randint(100, 999)}",
                    "channel": "DIRECT_ENTERPRISE"
                }
            }
            batch_txns.append(erp_record)
            
            # 6. Defect: Duplicate Transaction ID in ERP (Uniqueness check)
            if i == 50:
                dup_record = dict(erp_record)
                dup_record["quantity"] = 1
                dup_record["total_amount"] = prod["list_price"]
                dup_record["validation_notes"] = "DUPLICATE_KEY: Re-transmitted transaction payload with identical ID"
                dup_record["is_valid"] = False
                batch_txns.append(dup_record)
                defect_manifest.append({"batch": batch_num, "txn_id": txn_id, "type": "DUPLICATE_TXN_ID", "impact": "Double-booking risk in operational reporting"})
            
            # --- FINANCE GENERAL LEDGER RECONCILIATION PAIR GENERATION ---
            global_ledger_counter += 1
            ledger_ref = f"GL-REF-{global_ledger_counter}"
            
            # Scenario A: Timing Difference (Near end of month, exists in ERP but not yet posted to Ledger)
            if (end_dt - txn_date).days <= 2 and i % 9 == 0:
                # Omit from ledger -> will result in MISSING_IN_LEDGER (Timing Difference)
                defect_manifest.append({"batch": batch_num, "txn_id": txn_id, "type": "RECON_TIMING_DIFFERENCE", "impact": "Cut-off timing difference pending monthly close"})
                continue
            
            # Scenario B: Amount Variance within tolerance (e.g. $0.02 rounding variance <= $0.05)
            if i in [14, 66, 115]:
                ledger_amount = round(total_amount + 0.03, 2)
                batch_ledgers.append({
                    "batch_number": batch_num,
                    "ledger_reference": ledger_ref,
                    "posting_date": txn_date + timedelta(hours=random.randint(1, 24)),
                    "account_code": "GL-40010-REVENUE",
                    "cost_center": next(d["cost_center"] for d in DEPARTMENTS if d["name"] == dept),
                    "external_reference": txn_id,
                    "customer_ref": customer_id or "UNRESOLVED",
                    "posted_amount": ledger_amount,
                    "currency": "USD",
                    "entry_type": "CREDIT",
                    "reconciliation_status": "MATCHED_WITH_TOLERANCE"
                })
                defect_manifest.append({"batch": batch_num, "txn_id": txn_id, "type": "RECON_TOLERANCE_VARIANCE", "impact": "Sub-nickel penny rounding difference"})
                continue
                
            # Scenario C: Major Amount Mismatch (Variance > tolerance, e.g. $45.00 discrepancy)
            if i in [28, 88]:
                ledger_amount = round(total_amount - 45.00, 2)
                batch_ledgers.append({
                    "batch_number": batch_num,
                    "ledger_reference": ledger_ref,
                    "posting_date": txn_date + timedelta(hours=random.randint(2, 36)),
                    "account_code": "GL-40010-REVENUE",
                    "cost_center": next(d["cost_center"] for d in DEPARTMENTS if d["name"] == dept),
                    "external_reference": txn_id,
                    "customer_ref": customer_id or "UNRESOLVED",
                    "posted_amount": ledger_amount,
                    "currency": "USD",
                    "entry_type": "CREDIT",
                    "reconciliation_status": "AMOUNT_MISMATCH"
                })
                defect_manifest.append({"batch": batch_num, "txn_id": txn_id, "type": "RECON_AMOUNT_MISMATCH", "impact": "GL variance exceeds tolerance limit ($45.00)"})
                continue
            
            # Scenario D: Perfect Exact Match (Normal behavior, ~85-90% of records)
            batch_ledgers.append({
                "batch_number": batch_num,
                "ledger_reference": ledger_ref,
                "posting_date": txn_date + timedelta(hours=random.randint(1, 12)),
                "account_code": "GL-40010-REVENUE",
                "cost_center": next(d["cost_center"] for d in DEPARTMENTS if d["name"] == dept),
                "external_reference": txn_id,
                "customer_ref": customer_id or "UNRESOLVED",
                "posted_amount": total_amount,
                "currency": "USD",
                "entry_type": "CREDIT",
                "reconciliation_status": "MATCHED"
            })
        
        # Scenario E: Injected Orphan Ledger Entries (Exists in GL but NOT in ERP)
        for o_idx in range(3):
            global_ledger_counter += 1
            orphan_ref = f"GL-REF-{global_ledger_counter}"
            batch_ledgers.append({
                "batch_number": batch_num,
                "ledger_reference": orphan_ref,
                "posting_date": start_dt + timedelta(days=random.randint(5, 25)),
                "account_code": "GL-80020-BANK-ADJ",
                "cost_center": "CC-102",
                "external_reference": f"UNLINKED-WIRE-{global_ledger_counter}",
                "customer_ref": "UNKNOWN-DIRECT",
                "posted_amount": round(random.uniform(500.0, 3200.0), 2),
                "currency": "USD",
                "entry_type": "CREDIT",
                "reconciliation_status": "MISSING_IN_A"
            })
            defect_manifest.append({"batch": batch_num, "txn_id": f"UNLINKED-WIRE-{global_ledger_counter}", "type": "RECON_ORPHAN_GL_ENTRY", "impact": "Ledger entry has no corresponding ERP operational source"})

        all_erp_txns.extend(batch_txns)
        all_ledger_records.extend(batch_ledgers)
        
    return {
        "batches": batches_meta,
        "erp_transactions": all_erp_txns,
        "ledger_records": all_ledger_records,
        "defect_manifest": defect_manifest
    }

def export_synthetic_sample_files(target_dir: Path | None = None):
    """
    Exports synthetic ERP and Ledger datasets to CSV and Excel files
    in data/samples/ for file upload testing and demonstration.
    """
    target = target_dir or settings.SAMPLE_DIR
    target.mkdir(parents=True, exist_ok=True)
    
    data = generate_synthetic_batches(seed=42)
    erp_df = pd.DataFrame(data["erp_transactions"])
    ledger_df = pd.DataFrame(data["ledger_records"])
    
    # Save CSV files
    erp_csv = target / "erp_operational_transactions.csv"
    ledger_csv = target / "finance_general_ledger.csv"
    
    # Exclude internal debug dicts from flat CSV export
    erp_export_df = erp_df.drop(columns=["raw_payload"], errors="ignore")
    erp_export_df.to_csv(erp_csv, index=False)
    ledger_df.to_csv(ledger_csv, index=False)
    
    # Save sample Excel files with multiple sheets
    sample_xlsx = target / "sample_operations_data.xlsx"
    with pd.ExcelWriter(sample_xlsx, engine="openpyxl") as writer:
        erp_export_df.head(100).to_excel(writer, sheet_name="ERP_Transactions", index=False)
        ledger_df.head(100).to_excel(writer, sheet_name="General_Ledger", index=False)
        pd.DataFrame(CUSTOMERS).to_excel(writer, sheet_name="Customers_Master", index=False)
        pd.DataFrame(PRODUCTS).to_excel(writer, sheet_name="Products_Master", index=False)
        
    return {
        "erp_csv": str(erp_csv),
        "ledger_csv": str(ledger_csv),
        "sample_xlsx": str(sample_xlsx),
        "total_erp_records": len(erp_df),
        "total_ledger_records": len(ledger_df),
        "defects_count": len(data["defect_manifest"])
    }
