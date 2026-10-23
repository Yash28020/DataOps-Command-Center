"""SQLAlchemy relational models for DataOps Command Center."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Numeric, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    source_type = Column(String(50), nullable=False) # CSV, XLSX, ERP_SYSTEM, GL_SYSTEM
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    schema_info = Column(JSON, default=dict) # detected columns, types, null counts
    status = Column(String(50), default="ACTIVE") # ACTIVE, ARCHIVED, ERROR
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    batches = relationship("IngestionBatch", back_populates="data_source", cascade="all, delete-orphan")


class IngestionBatch(Base):
    __tablename__ = "ingestion_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String(100), unique=True, index=True, nullable=False)
    data_source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=True)
    source_name = Column(String(100), nullable=False)
    record_count = Column(Integer, default=0)
    valid_record_count = Column(Integer, default=0)
    invalid_record_count = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETED") # PENDING, PROCESSING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    checksum = Column(String(64), nullable=True) # SHA-256 for idempotency
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    data_source = relationship("DataSource", back_populates="batches")
    transactions = relationship("BusinessTransaction", back_populates="batch")


class ProcessingRun(Base):
    __tablename__ = "processing_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_code = Column(String(100), unique=True, index=True, nullable=False)
    pipeline_stage = Column(String(50), nullable=False) # INGESTION, VALIDATION, RECONCILIATION, REPORTING
    status = Column(String(50), default="RUNNING") # RUNNING, COMPLETED, FAILED, WARNING
    records_processed = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    duration_ms = Column(Float, default=0.0)
    summary_metrics = Column(JSON, default=dict)
    error_details = Column(Text, nullable=True)
    triggered_by = Column(String(100), default="SYSTEM")
    created_at = Column(DateTime, default=datetime.utcnow)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    segment = Column(String(50), default="Commercial") # Enterprise, SMB, Commercial, Consumer
    region = Column(String(50), default="North America")
    country = Column(String(50), default="United States")
    credit_limit = Column(Float, default=50000.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    unit_cost = Column(Float, default=0.0)
    list_price = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    cost_center = Column(String(50), nullable=False)
    head_of_department = Column(String(100), nullable=True)
    budget = Column(Float, default=0.0)


class BusinessTransaction(Base):
    __tablename__ = "business_transactions"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("ingestion_batches.id"), nullable=True)
    transaction_id = Column(String(100), index=True, nullable=False)
    transaction_date = Column(DateTime, index=True, nullable=False)
    customer_id = Column(String(50), index=True, nullable=True)
    customer_name = Column(String(150), nullable=True)
    product_sku = Column(String(50), index=True, nullable=True)
    product_category = Column(String(100), nullable=True)
    department = Column(String(100), index=True, nullable=True)
    region = Column(String(50), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    payment_status = Column(String(50), default="COMPLETED") # COMPLETED, PENDING, FAILED, REFUNDED
    is_valid = Column(Boolean, default=True)
    validation_notes = Column(Text, nullable=True)
    raw_payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("IngestionBatch", back_populates="transactions")

    __table_args__ = (
        Index("idx_btxn_date_dept", "transaction_date", "department"),
        Index("idx_btxn_txn_id", "transaction_id"),
    )


class FinanceLedgerRecord(Base):
    __tablename__ = "finance_ledger_records"

    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String(100), nullable=False, index=True)
    ledger_reference = Column(String(100), unique=True, index=True, nullable=False)
    posting_date = Column(DateTime, index=True, nullable=False)
    account_code = Column(String(50), nullable=False)
    cost_center = Column(String(50), nullable=False)
    external_reference = Column(String(100), index=True, nullable=True) # Maps to ERP transaction_id
    customer_ref = Column(String(50), nullable=True)
    posted_amount = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    entry_type = Column(String(20), default="CREDIT") # DEBIT, CREDIT
    reconciliation_status = Column(String(50), default="UNRECONCILED") # MATCHED, VARIANCE, UNMATCHED, DUPLICATE
    matched_transaction_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ValidationRule(Base):
    __tablename__ = "validation_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    rule_type = Column(String(50), nullable=False) # NULL_CHECK, DUPLICATE_CHECK, TYPE_CHECK, RANGE_CHECK, ALLOWED_VALUES, CROSS_COLUMN, REFERENTIAL
    target_dataset = Column(String(100), default="business_transactions")
    target_field = Column(String(100), nullable=True)
    parameters = Column(JSON, default=dict) # e.g. {"min": 0.01, "allowed": ["Sales", "Finance"]}
    severity = Column(String(20), default="CRITICAL") # CRITICAL, WARNING, INFO
    weight = Column(Float, default=1.0)
    dimension = Column(String(50), default="Validity") # Completeness, Uniqueness, Validity, Integrity
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(100), index=True, nullable=False)
    rule_code = Column(String(50), ForeignKey("validation_rules.rule_code"), nullable=False)
    records_evaluated = Column(Integer, default=0)
    records_passed = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    pass_rate = Column(Float, default=100.0)
    status = Column(String(20), default="PASS") # PASS, WARN, FAIL
    executed_at = Column(DateTime, default=datetime.utcnow)


class DataQualityIssue(Base):
    __tablename__ = "data_quality_issues"

    id = Column(Integer, primary_key=True, index=True)
    issue_code = Column(String(100), unique=True, index=True, nullable=False)
    run_id = Column(String(100), index=True, nullable=False)
    rule_code = Column(String(50), nullable=False)
    rule_name = Column(String(150), nullable=False)
    dimension = Column(String(50), default="Validity")
    severity = Column(String(20), default="CRITICAL") # CRITICAL, WARNING, INFO
    dataset_name = Column(String(100), default="business_transactions")
    record_identifier = Column(String(100), index=True, nullable=False) # transaction_id or row key
    field_name = Column(String(100), nullable=False)
    original_value = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=False)
    status = Column(String(30), default="OPEN") # OPEN, UNDER_REVIEW, RESOLVED, SUPPRESSED
    assigned_to = Column(String(100), default="Unassigned")
    resolution_notes = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class ReconciliationRun(Base):
    __tablename__ = "reconciliation_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_code = Column(String(100), unique=True, index=True, nullable=False)
    source_a_name = Column(String(100), nullable=False)
    source_b_name = Column(String(100), nullable=False)
    matching_key = Column(String(100), default="transaction_id <-> external_reference")
    tolerance_amount = Column(Float, default=0.05)
    
    source_a_count = Column(Integer, default=0)
    source_b_count = Column(Integer, default=0)
    source_a_amount = Column(Float, default=0.0)
    source_b_amount = Column(Float, default=0.0)
    
    matched_count = Column(Integer, default=0)
    matched_amount = Column(Float, default=0.0)
    tolerance_matched_count = Column(Integer, default=0)
    
    missing_a_count = Column(Integer, default=0)
    missing_b_count = Column(Integer, default=0)
    amount_mismatch_count = Column(Integer, default=0)
    timing_difference_count = Column(Integer, default=0)
    duplicate_key_count = Column(Integer, default=0)
    
    net_variance = Column(Float, default=0.0)
    reconciliation_rate = Column(Float, default=0.0) # (matched / total) * 100
    status = Column(String(30), default="COMPLETED") # COMPLETED, FAILED, WITH_EXCEPTIONS
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    exceptions = relationship("ReconciliationException", back_populates="run", cascade="all, delete-orphan")


class ReconciliationException(Base):
    __tablename__ = "reconciliation_exceptions"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("reconciliation_runs.id"), nullable=False)
    exception_type = Column(String(50), nullable=False) # MISSING_IN_A, MISSING_IN_B, AMOUNT_MISMATCH, DUPLICATE_KEY, TIMING_DIFFERENCE
    key_value = Column(String(100), index=True, nullable=False)
    source_a_record_id = Column(String(100), nullable=True)
    source_b_record_id = Column(String(100), nullable=True)
    source_a_amount = Column(Float, nullable=True)
    source_b_amount = Column(Float, nullable=True)
    variance_amount = Column(Float, default=0.0)
    posting_date_a = Column(DateTime, nullable=True)
    posting_date_b = Column(DateTime, nullable=True)
    status = Column(String(30), default="NEW") # NEW, INVESTIGATING, APPROVED_VARIANCE, RESOLVED
    owner = Column(String(100), default="Finance Operations")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    run = relationship("ReconciliationRun", back_populates="exceptions")


class ReportRun(Base):
    __tablename__ = "report_runs"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(100), unique=True, index=True, nullable=False)
    report_type = Column(String(50), default="EXCEL_FULL_PACK")
    title = Column(String(200), nullable=False)
    period = Column(String(50), default="Current")
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    record_count = Column(Integer, default=0)
    sheet_count = Column(Integer, default=6)
    status = Column(String(30), default="COMPLETED")
    generated_by = Column(String(100), default="System")
    generated_at = Column(DateTime, default=datetime.utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False) # INGESTION, VALIDATION, RECONCILIATION, EXPORT, ISSUE_UPDATE
    entity_type = Column(String(50), nullable=False) # DataSource, Batch, Issue, Exception, Report
    entity_id = Column(String(100), nullable=True)
    user_id = Column(String(100), default="data_ops_lead")
    action = Column(String(200), nullable=False)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
