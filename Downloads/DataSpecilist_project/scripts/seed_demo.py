"""Standalone CLI Script to Seed Multi-Batch Demonstration Datasets."""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.database import init_db, SessionLocal
from app.routers.sources import seed_synthetic_demonstration_data

def main():
    print("[1/3] Initializing DataOps Command Center Database...")
    init_db()
    
    print("[2/3] Generating multi-batch synthetic ERP & GL datasets with controlled defects...")
    db = SessionLocal()
    try:
        res = seed_synthetic_demonstration_data(db)
        print(f"[3/3] Success! Loaded {res['erp_records_loaded']} ERP records and {res['ledger_records_loaded']} GL records.")
        print(f"      Injected Defects: {res['defects_injected']}")
        print(f"      Initial Quality Score: {res['quality_score']}%")
        print(f"      Reconciliation Match Rate: {res['reconciliation_rate']}%")
    finally:
        db.close()
    print("\nDataset ready for DataOps Command Center exploration.")

if __name__ == "__main__":
    main()
