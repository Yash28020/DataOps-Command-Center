"""Pydantic schemas for DataOps Command Center API."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict

# Base & Generic
class MessageResponse(BaseModel):
    message: str
    status: str = "success"

# Data Source Schemas
class DataSourceBase(BaseModel):
    name: str
    source_type: str
    description: Optional[str] = None

class DataSourceCreate(DataSourceBase):
    pass

class DataSourceResponse(BaseModel):
    id: int
    name: str
    source_type: str
    file_name: Optional[str] = None
    file_size_bytes: int
    row_count: int
    column_count: int
    schema_info: dict[str, Any] = Field(default_factory=dict)
    status: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FilePreviewResponse(BaseModel):
    file_name: str
    file_size_bytes: int
    total_rows: int
    columns: list[str]
    column_types: dict[str, str]
    null_counts: dict[str, int]
    sample_rows: list[dict[str, Any]]
    validation_warnings: list[str]

# Validation & Quality Schemas
class ValidationRuleBase(BaseModel):
    rule_code: str
    name: str
    description: str
    rule_type: str
    target_dataset: str = "business_transactions"
    target_field: Optional[str] = None
    parameters: dict[str, Any] = Field(default_factory=dict)
    severity: str = "CRITICAL"
    weight: float = 1.0
    dimension: str = "Validity"
    is_active: bool = True

class ValidationRuleCreate(ValidationRuleBase):
    pass

class ValidationRuleResponse(ValidationRuleBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ValidationRuleResult(BaseModel):
    rule_code: str
    rule_name: str
    dimension: str
    severity: str
    records_evaluated: int
    records_passed: int
    records_failed: int
    pass_rate: float
    status: str

class ValidationSummaryResponse(BaseModel):
    run_id: str
    executed_at: datetime
    total_records: int
    passed_records: int
    failed_records: int
    overall_quality_score: float
    dimension_scores: dict[str, float]
    rule_results: list[ValidationRuleResult]

class DataQualityIssueResponse(BaseModel):
    id: int
    issue_code: str
    run_id: str
    rule_code: str
    rule_name: str
    dimension: str
    severity: str
    dataset_name: str
    record_identifier: str
    field_name: str
    original_value: Optional[str] = None
    failure_reason: str
    status: str
    assigned_to: str
    resolution_notes: Optional[str] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class IssueStatusUpdate(BaseModel):
    status: str
    resolution_notes: Optional[str] = None
    assigned_to: Optional[str] = None

# Reconciliation Schemas
class ReconciliationRunRequest(BaseModel):
    source_a_name: str = "ERP Operations Transactions"
    source_b_name: str = "Finance General Ledger"
    tolerance_amount: float = 0.05
    matching_key: str = "transaction_id"

class ReconciliationExceptionResponse(BaseModel):
    id: int
    run_id: int
    exception_type: str
    key_value: str
    source_a_record_id: Optional[str] = None
    source_b_record_id: Optional[str] = None
    source_a_amount: Optional[float] = None
    source_b_amount: Optional[float] = None
    variance_amount: float
    posting_date_a: Optional[datetime] = None
    posting_date_b: Optional[datetime] = None
    status: str
    owner: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReconciliationRunResponse(BaseModel):
    id: int
    run_code: str
    source_a_name: str
    source_b_name: str
    matching_key: str
    tolerance_amount: float
    source_a_count: int
    source_b_count: int
    source_a_amount: float
    source_b_amount: float
    matched_count: int
    matched_amount: float
    tolerance_matched_count: int
    missing_a_count: int
    missing_b_count: int
    amount_mismatch_count: int
    timing_difference_count: int
    duplicate_key_count: int
    net_variance: float
    reconciliation_rate: float
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    exceptions: list[ReconciliationExceptionResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class ExceptionStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    owner: Optional[str] = None

# SQL Analytics Schemas
class SqlQueryRequest(BaseModel):
    query: str
    limit: int = 100

class SqlQueryResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    execution_time_ms: float
    query: str

class SqlTemplateItem(BaseModel):
    id: str
    title: str
    category: str
    description: str
    sql: str

# Excel & Reports Schemas
class ReportRunResponse(BaseModel):
    id: int
    report_code: str
    report_type: str
    title: str
    period: str
    file_name: str
    file_size_bytes: int
    record_count: int
    sheet_count: int
    status: str
    generated_by: str
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Overview Dashboard Schemas
class OverviewMetricsResponse(BaseModel):
    total_records_processed: int
    validation_pass_rate: float
    unresolved_exceptions_count: int
    reconciliation_rate: float
    average_processing_duration_ms: float
    quality_score: float
    dimension_scores: dict[str, float]
    pipeline_stages: list[dict[str, Any]]
    volume_trend: list[dict[str, Any]]
    quality_distribution: list[dict[str, Any]]
    source_health: list[dict[str, Any]]
    recent_activity: list[dict[str, Any]]
    priority_issues: list[dict[str, Any]]

# Business Insights Schemas
class BusinessInsightItem(BaseModel):
    id: str
    title: str
    category: str # Revenue, Quality Impact, Operational, Department
    severity: str # POSITIVE, WARNING, CRITICAL, NEUTRAL
    metric_value: str
    period: str
    supporting_data: dict[str, Any]
    observation: str
    action_recommendation: str

class InsightsResponse(BaseModel):
    reporting_period: str
    total_volume: float
    net_leakage_detected: float
    insights: list[BusinessInsightItem]
    department_breakdown: list[dict[str, Any]]
    trend_analysis: list[dict[str, Any]]

# Audit Event Schema
class AuditEventResponse(BaseModel):
    id: int
    event_type: str
    entity_type: str
    entity_id: Optional[str] = None
    user_id: str
    action: str
    details: dict[str, Any]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
