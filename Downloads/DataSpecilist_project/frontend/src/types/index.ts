export interface PipelineStage {
  id: string;
  name: string;
  status: 'HEALTHY' | 'SUCCESS' | 'WARNING' | 'FAILED' | 'IDLE';
  metric: string;
  detail: string;
  order: number;
}

export interface VolumeTrendItem {
  department: string;
  total_records: number;
  valid_records: number;
  defective_records: number;
  pass_rate: number;
}

export interface QualityDimensionItem {
  name: string;
  score: number;
  weight: number;
  color: string;
}

export interface SourceHealthItem {
  id: number;
  name: string;
  type: string;
  records: number;
  status: string;
  last_updated: string;
}

export interface ActivityItem {
  id: number;
  event_type: string;
  action: string;
  user_id: string;
  timestamp: string;
}

export interface PriorityIssue {
  id: number;
  issue_code: string;
  rule_name: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  dimension: string;
  record_identifier: string;
  field_name: string;
  failure_reason: string;
  status: string;
}

export interface OverviewMetrics {
  total_records_processed: number;
  validation_pass_rate: number;
  unresolved_exceptions_count: number;
  reconciliation_rate: number;
  average_processing_duration_ms: number;
  quality_score: number;
  dimension_scores: Record<string, number>;
  pipeline_stages: PipelineStage[];
  volume_trend: VolumeTrendItem[];
  quality_distribution: QualityDimensionItem[];
  source_health: SourceHealthItem[];
  recent_activity: ActivityItem[];
  priority_issues: PriorityIssue[];
}

export interface DataSourceItem {
  id: number;
  name: string;
  source_type: string;
  file_name?: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  schema_info: Record<string, any>;
  status: string;
  description?: string;
  created_at: string;
}

export interface ValidationRule {
  id: number;
  rule_code: string;
  name: string;
  description: string;
  rule_type: string;
  target_field?: string;
  severity: string;
  weight: number;
  dimension: string;
  is_active: boolean;
}

export interface DataQualityIssue {
  id: number;
  issue_code: string;
  run_id: string;
  rule_code: string;
  rule_name: string;
  dimension: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  dataset_name: string;
  record_identifier: string;
  field_name: string;
  original_value: string;
  failure_reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'SUPPRESSED';
  assigned_to: string;
  resolution_notes?: string;
  detected_at: string;
  resolved_at?: string;
}

export interface ReconciliationRun {
  id: number;
  run_code: string;
  source_a_name: string;
  source_b_name: string;
  matching_key: string;
  tolerance_amount: number;
  source_a_count: number;
  source_b_count: number;
  source_a_amount: number;
  source_b_amount: number;
  matched_count: number;
  matched_amount: number;
  tolerance_matched_count: number;
  missing_a_count: number;
  missing_b_count: number;
  amount_mismatch_count: number;
  timing_difference_count: number;
  duplicate_key_count: number;
  net_variance: number;
  reconciliation_rate: number;
  status: string;
  started_at: string;
  completed_at?: string;
}

export interface ReconciliationException {
  id: number;
  run_id: number;
  exception_type: string;
  key_value: string;
  source_a_record_id?: string;
  source_b_record_id?: string;
  source_a_amount?: number;
  source_b_amount?: number;
  variance_amount: number;
  status: string;
  owner: string;
  notes?: string;
  created_at: string;
}

export interface SqlTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  sql: string;
}

export interface SqlQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  row_count: number;
  execution_time_ms: number;
  query: string;
}

export interface ReportItem {
  id: number;
  report_code: string;
  report_type: string;
  title: string;
  period: string;
  file_name: string;
  file_size_bytes: number;
  record_count: number;
  sheet_count: number;
  status: string;
  generated_by: string;
  generated_at: string;
}

export interface BusinessInsightItem {
  id: string;
  title: string;
  category: string;
  severity: 'POSITIVE' | 'WARNING' | 'CRITICAL' | 'NEUTRAL';
  metric_value: string;
  period: string;
  supporting_data: Record<string, any>;
  observation: string;
  action_recommendation: string;
}

export interface InsightsResponse {
  reporting_period: string;
  total_volume: number;
  net_leakage_detected: number;
  insights: BusinessInsightItem[];
  department_breakdown: Array<{
    department: string;
    transaction_count: number;
    total_revenue: number;
    defect_count: number;
    error_rate: number;
  }>;
  trend_analysis: Array<{
    period: string;
    revenue: number;
    dq_pass_rate: number;
    recon_rate: number;
  }>;
}
