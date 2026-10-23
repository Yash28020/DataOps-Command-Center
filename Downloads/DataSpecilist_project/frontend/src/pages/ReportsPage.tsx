import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Download, RefreshCw, CheckCircle2,
  Calendar, Layers, Table, Sparkles, FileDown
} from 'lucide-react';
import { api } from '../api/client';
import { ReportItem } from '../types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Q4 2026');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.listReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setDownloadSuccess(null);
    try {
      const res = await api.generateExcelReport(selectedPeriod);
      setDownloadSuccess(`Generated 6-tab workbook: ${res.file_name} (${(res.file_size_bytes / 1024).toFixed(1)} KB)`);
      await fetchReports();
    } catch (err) {
      alert('Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const sheetsInfo = [
    { name: '1. Executive Summary', desc: 'KPI cards (Records, Revenue, Pass Rate, Reconciliation Rate, Net Variance), period metadata, and corporate executive snapshot.' },
    { name: '2. Data Quality Report', desc: 'Active governance rules, evaluated vs failed records, pass rate percentages, and color-coded conditional alert fills.' },
    { name: '3. Reconciliation Summary', desc: 'Operational ERP vs General Ledger cross-system comparison, tolerance counts, net variances, and reconciliation percentages.' },
    { name: '4. Exception Register', desc: 'Itemized register of all discrepancies with reference keys, variance amounts, assigned owners, and stewardship notes.' },
    { name: '5. Cleaned Data', desc: 'Standardized operational transactions with verified status, formatted currencies ($#,##0.00), and clean timestamps.' },
    { name: '6. Processing Audit', desc: 'System-level audit trail with execution timestamps, batch IDs, user actions, and IP tracking.' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
            <span>Excel Reporting Studio</span>
            <span className="text-xs font-mono font-normal text-cyan-accent px-2 py-0.5 rounded bg-cyan-accent/10 border border-cyan-accent/20">
              OpenPyXL Multi-Sheet Engine
            </span>
          </h1>
          <p className="text-xs text-universe-muted mt-1">
            Production-grade Microsoft Excel (.xlsx) workbooks formatted with freeze panes, conditional fills, and formulas.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-universe-surface border border-universe-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="Q4 2026">Period: Q4 2026</option>
            <option value="Batch-2026-10">Period: Oct 2026</option>
            <option value="Batch-2026-11">Period: Nov 2026</option>
            <option value="Batch-2026-12">Period: Dec 2026</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-cyan-accent hover:bg-cyan-bright text-universe-bg font-semibold text-xs shadow-md shadow-cyan-accent/20 transition disabled:opacity-50"
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${generating ? 'animate-bounce' : ''}`} />
            <span>{generating ? 'Generating Workbook...' : 'Generate Excel Pack'}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 rounded-lg bg-mint-accent/15 border border-mint-accent/30 text-mint-accent text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* 6-Tab Workbook Architecture Overview */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-universe-border">
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-accent" />
              <span>Multi-Sheet Workbook Structure & Styling Specification</span>
            </h3>
            <p className="text-xs text-universe-muted">
              Built using OpenPyXL with Segoe UI typography, frozen header panes, auto-fit column widths, and strict financial formatting.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-accent font-semibold">6 Native Worksheets</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sheetsInfo.map((s, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-universe-surface border border-universe-border space-y-1">
              <div className="font-semibold text-xs text-cyan-accent flex items-center justify-between">
                <span>{s.name}</span>
                <span className="text-[10px] font-mono text-universe-dim">Tab 0{idx + 1}</span>
              </div>
              <p className="text-[11px] text-universe-muted leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Report Generation History Table */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-white">Generated Report History & Downloads</h3>
          <span className="text-xs font-mono text-cyan-accent">{reports.length} Reports Archived</span>
        </div>

        <div className="overflow-x-auto border border-universe-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-universe-surface text-universe-dim font-mono text-[10px] uppercase">
              <tr>
                <th className="p-3">Report Code</th>
                <th className="p-3">Report Title / Description</th>
                <th className="p-3">Period</th>
                <th className="p-3">File Size</th>
                <th className="p-3">Generated At</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-universe-border text-universe-text font-sans">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-universe-dim">
                    No reports generated yet. Click 'Generate Excel Pack' above.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-universe-surface/50 transition-colors">
                    <td className="p-3 font-mono font-semibold text-cyan-accent">{r.report_code}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{r.title}</div>
                      <div className="text-[10px] font-mono text-universe-dim">{r.sheet_count} worksheets • {r.file_name}</div>
                    </td>
                    <td className="p-3 font-mono text-universe-muted">{r.period}</td>
                    <td className="p-3 font-mono text-universe-dim">{(r.file_size_bytes / 1024).toFixed(1)} KB</td>
                    <td className="p-3 font-mono text-universe-dim">{r.generated_at ? new Date(r.generated_at).toLocaleString() : 'N/A'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-mint-accent/15 text-mint-accent border border-mint-accent/30">
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={`/api/reports/download/${r.id}`}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-cyan-accent/10 hover:bg-cyan-accent/20 border border-cyan-accent/30 text-cyan-accent font-semibold text-xs transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .xlsx</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
