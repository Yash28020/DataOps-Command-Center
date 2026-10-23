import {
  OverviewMetrics, DataSourceItem, ValidationRule,
  DataQualityIssue, ReconciliationRun, ReconciliationException,
  SqlTemplate, SqlQueryResult, ReportItem, InsightsResponse
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Overview
  getOverviewMetrics: async (): Promise<OverviewMetrics> => {
    const res = await fetch(`${API_BASE}/overview/metrics`);
    if (!res.ok) throw new Error('Failed to fetch overview metrics');
    return res.json();
  },

  // Sources
  listSources: async (): Promise<DataSourceItem[]> => {
    const res = await fetch(`${API_BASE}/sources`);
    if (!res.ok) throw new Error('Failed to fetch sources');
    return res.json();
  },

  seedDemoData: async () => {
    const res = await fetch(`${API_BASE}/sources/seed-demo`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed synthetic demo data');
    return res.json();
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/sources/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  deleteSource: async (id: number) => {
    const res = await fetch(`${API_BASE}/sources/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete source');
    return res.json();
  },

  // Quality
  getRules: async (): Promise<ValidationRule[]> => {
    const res = await fetch(`${API_BASE}/quality/rules`);
    if (!res.ok) throw new Error('Failed to fetch rules');
    return res.json();
  },

  toggleRule: async (id: number) => {
    const res = await fetch(`${API_BASE}/quality/rules/${id}/toggle`, { method: 'POST' });
    return res.json();
  },

  runValidation: async (batchNumber?: string) => {
    const url = batchNumber ? `${API_BASE}/quality/evaluate?batch_number=${batchNumber}` : `${API_BASE}/quality/evaluate`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Validation execution failed');
    return res.json();
  },

  getQualityIssues: async (params: {
    severity?: string;
    dimension?: string;
    status?: string;
    rule_code?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; issues: DataQualityIssue[] }> => {
    const query = new URLSearchParams();
    if (params.severity) query.append('severity', params.severity);
    if (params.dimension) query.append('dimension', params.dimension);
    if (params.status) query.append('status', params.status);
    if (params.rule_code) query.append('rule_code', params.rule_code);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    const res = await fetch(`${API_BASE}/quality/issues?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch issues');
    return res.json();
  },

  updateIssueStatus: async (id: number, payload: { status: string; resolution_notes?: string; assigned_to?: string }) => {
    const res = await fetch(`${API_BASE}/quality/issues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update issue');
    return res.json();
  },

  // Reconciliation
  executeReconciliation: async (tolerance = 0.05) => {
    const res = await fetch(`${API_BASE}/reconciliation/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_a_name: 'ERP Operational Sales',
        source_b_name: 'Finance General Ledger',
        tolerance_amount: tolerance,
      }),
    });
    if (!res.ok) throw new Error('Reconciliation execution failed');
    return res.json();
  },

  getLatestReconciliation: async (): Promise<ReconciliationRun | null> => {
    const res = await fetch(`${API_BASE}/reconciliation/latest`);
    if (!res.ok) throw new Error('Failed to fetch reconciliation');
    return res.json();
  },

  getReconciliationRuns: async (): Promise<ReconciliationRun[]> => {
    const res = await fetch(`${API_BASE}/reconciliation/runs`);
    if (!res.ok) throw new Error('Failed to fetch runs');
    return res.json();
  },

  getReconciliationExceptions: async (params: {
    run_id?: number;
    exception_type?: string;
    status?: string;
    search?: string;
  }): Promise<{ total: number; exceptions: ReconciliationException[] }> => {
    const query = new URLSearchParams();
    if (params.run_id) query.append('run_id', String(params.run_id));
    if (params.exception_type) query.append('exception_type', params.exception_type);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/reconciliation/exceptions?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch exceptions');
    return res.json();
  },

  updateExceptionStatus: async (id: number, payload: { status: string; notes?: string; owner?: string }) => {
    const res = await fetch(`${API_BASE}/reconciliation/exceptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update exception');
    return res.json();
  },

  // SQL
  getSqlTemplates: async (): Promise<SqlTemplate[]> => {
    const res = await fetch(`${API_BASE}/sql/templates`);
    if (!res.ok) throw new Error('Failed to fetch SQL templates');
    return res.json();
  },

  executeSql: async (query: string, limit = 100): Promise<SqlQueryResult> => {
    const res = await fetch(`${API_BASE}/sql/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'SQL query failed');
    }
    return res.json();
  },

  // Reports
  listReports: async (): Promise<ReportItem[]> => {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  generateExcelReport: async (period = 'Q4 2026') => {
    const res = await fetch(`${API_BASE}/reports/generate?period=${encodeURIComponent(period)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },

  // BI Workspace
  getBiMetadata: async () => {
    const res = await fetch(`${API_BASE}/bi/metadata`);
    if (!res.ok) throw new Error('Failed to fetch BI metadata');
    return res.json();
  },

  exportBiPackage: async () => {
    const res = await fetch(`${API_BASE}/bi/export`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to export BI package');
    return res.json();
  },

  // Operations
  getProcessingRuns: async () => {
    const res = await fetch(`${API_BASE}/operations/runs`);
    if (!res.ok) throw new Error('Failed to fetch processing runs');
    return res.json();
  },

  getIngestionBatches: async () => {
    const res = await fetch(`${API_BASE}/operations/batches`);
    if (!res.ok) throw new Error('Failed to fetch ingestion batches');
    return res.json();
  },

  getAuditEvents: async (eventType?: string) => {
    const url = eventType ? `${API_BASE}/operations/audit?event_type=${eventType}` : `${API_BASE}/operations/audit`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch audit events');
    return res.json();
  },

  getDataLineage: async () => {
    const res = await fetch(`${API_BASE}/operations/lineage`);
    if (!res.ok) throw new Error('Failed to fetch data lineage');
    return res.json();
  },

  // Insights
  getBusinessInsights: async (): Promise<InsightsResponse> => {
    const res = await fetch(`${API_BASE}/insights`);
    if (!res.ok) throw new Error('Failed to fetch business insights');
    return res.json();
  },
};
