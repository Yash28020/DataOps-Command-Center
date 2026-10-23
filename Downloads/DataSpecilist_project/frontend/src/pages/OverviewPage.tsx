import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ShieldCheck, GitCompare, FileSpreadsheet,
  AlertTriangle, CheckCircle, Clock, Database,
  ArrowRight, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../api/client';
import { OverviewMetrics, PriorityIssue } from '../types';
import { DataUniverseVisual } from '../components/DataUniverseVisual';
import { KpiCard } from '../components/KpiCard';
import { IssueDrawer } from '../components/IssueDrawer';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getOverviewMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load overview metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleUpdateIssue = async (id: number, status: string, notes: string, assignedTo: string) => {
    await api.updateIssueStatus(id, { status, resolution_notes: notes, assigned_to: assignedTo });
    await fetchMetrics();
  };

  if (loading && !metrics) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-44 bg-universe-card rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-universe-card rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
            <span>Enterprise Data Operations Cockpit</span>
            <span className="text-xs font-mono font-normal text-cyan-accent px-2 py-0.5 rounded bg-cyan-accent/10 border border-cyan-accent/20">
              Live Verified
            </span>
          </h1>
          <p className="text-xs text-universe-muted mt-1">
            Real-time telemetry across Ingestion, Quality Studio, Dual-System Reconciliation, and BI Deliverables.
          </p>
        </div>

        {/* Quick Pipeline Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/quality')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-white transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-accent" />
            <span>Run Quality Rules</span>
          </button>
          <button
            onClick={() => navigate('/reconciliation')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-white transition"
          >
            <GitCompare className="w-3.5 h-3.5 text-violet-accent" />
            <span>Reconcile ERP vs GL</span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-accent hover:bg-cyan-bright text-universe-bg font-semibold text-xs shadow-md shadow-cyan-accent/20 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Generate Excel Pack</span>
          </button>
        </div>
      </div>

      {/* Signature Animated Data Universe Pipeline */}
      {metrics && (
        <DataUniverseVisual stages={metrics.pipeline_stages} />
      )}

      {/* KPI Display Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Records Processed"
            value={metrics.total_records_processed.toLocaleString()}
            subtitle="Operational ERP Transactions"
            icon={Database}
            accentColor="cyan"
            onClick={() => navigate('/sources')}
          />
          <KpiCard
            title="Validation Pass Rate"
            value={`${metrics.validation_pass_rate}%`}
            subtitle="Conforming with 6 DQ Rules"
            trend={metrics.validation_pass_rate > 90 ? '+2.4%' : '-1.5%'}
            trendType={metrics.validation_pass_rate > 90 ? 'positive' : 'negative'}
            icon={ShieldCheck}
            accentColor="mint"
            onClick={() => navigate('/quality')}
          />
          <KpiCard
            title="Unresolved Exceptions"
            value={metrics.unresolved_exceptions_count}
            subtitle="Pending Specialist Review"
            trend={metrics.unresolved_exceptions_count > 0 ? `${metrics.unresolved_exceptions_count} Open` : 'Clean'}
            trendType={metrics.unresolved_exceptions_count > 0 ? 'negative' : 'positive'}
            icon={AlertTriangle}
            accentColor="coral"
            onClick={() => navigate('/quality')}
          />
          <KpiCard
            title="Reconciliation Match"
            value={`${metrics.reconciliation_rate}%`}
            subtitle="Tolerance Margin: $0.05"
            icon={GitCompare}
            accentColor="violet"
            onClick={() => navigate('/reconciliation')}
          />
          <KpiCard
            title="Avg Pipeline Latency"
            value={`${metrics.average_processing_duration_ms}ms`}
            subtitle="Stage Processing Benchmark"
            icon={Clock}
            accentColor="amber"
            onClick={() => navigate('/operations')}
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Processing Volume & Cleanliness by Department */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-white">
                Transaction Volume & Defect Breakdown by Department
              </h3>
              <p className="text-xs text-universe-muted">
                Evaluated operational transactions vs records with detected validation issues
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1 text-cyan-accent">
                <span className="w-2.5 h-2.5 bg-cyan-accent rounded-sm inline-block"></span>
                <span>Valid Records</span>
              </span>
              <span className="flex items-center space-x-1 text-coral-accent">
                <span className="w-2.5 h-2.5 bg-coral-accent rounded-sm inline-block"></span>
                <span>Defective</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {metrics?.volume_trend && metrics.volume_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.volume_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="department" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101728', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="valid_records" name="Valid Records" fill="#42E8F5" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="defective_records" name="Defective Records" fill="#F43F5E" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-universe-dim">
                No volume data staged. Click 'Load Demo Batches' above.
              </div>
            )}
          </div>
        </div>

        {/* Data Quality Dimension Scores */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-sm text-white">
                Quality Index by Dimension
              </h3>
              <span className="text-xs font-mono font-bold text-cyan-accent">
                Score: {metrics?.quality_score}%
              </span>
            </div>
            <p className="text-xs text-universe-muted mb-4">
              Weighted enterprise data trust score across critical dimensions
            </p>

            <div className="space-y-4">
              {metrics?.quality_distribution.map((dim) => (
                <div key={dim.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-universe-text">{dim.name}</span>
                    <span className="font-mono text-cyan-accent font-semibold">{dim.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-universe-bg rounded-full overflow-hidden border border-universe-border">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${dim.score}%`, backgroundColor: dim.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-universe-border flex items-center justify-between text-xs">
            <span className="text-universe-dim">Governed by ISO 8000 & DAMA DQ Standards</span>
            <button
              onClick={() => navigate('/quality')}
              className="text-cyan-accent hover:underline flex items-center space-x-1"
            >
              <span>Explore Rules</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Priority Issues & Source Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Issues Table */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-white flex items-center space-x-2">
                <span>Priority Exceptions Requiring Attention</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-coral-accent/15 text-coral-accent border border-coral-accent/30 font-semibold">
                  Action Required
                </span>
              </h3>
              <p className="text-xs text-universe-muted">
                Line-item anomalies detected by rule evaluation engine with impact details
              </p>
            </div>
            <button
              onClick={() => navigate('/quality')}
              className="text-xs text-cyan-accent hover:underline flex items-center space-x-1"
            >
              <span>View All Issues</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-universe-border text-universe-dim font-mono uppercase text-[10px]">
                <tr>
                  <th className="pb-2.5">Record ID</th>
                  <th className="pb-2.5">Rule / Dimension</th>
                  <th className="pb-2.5">Failure Reason</th>
                  <th className="pb-2.5">Severity</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-universe-border/50 text-universe-text font-sans">
                {metrics?.priority_issues && metrics.priority_issues.length > 0 ? (
                  metrics.priority_issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-universe-surface/60 transition-colors group">
                      <td className="py-2.5 font-mono text-cyan-accent font-semibold">{issue.record_identifier}</td>
                      <td className="py-2.5">
                        <div className="font-semibold text-white">{issue.rule_name}</div>
                        <div className="text-[10px] text-universe-dim">{issue.dimension}</div>
                      </td>
                      <td className="py-2.5 text-universe-muted max-w-xs truncate">{issue.failure_reason}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          issue.severity === 'CRITICAL' ? 'bg-coral-accent/15 text-coral-accent border border-coral-accent/30' :
                          'bg-amber-accent/15 text-amber-accent border border-amber-accent/30'
                        }`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          className="px-2.5 py-1 rounded bg-universe-surface hover:bg-cyan-accent/20 border border-universe-border hover:border-cyan-accent/40 text-universe-text hover:text-cyan-accent font-semibold text-[11px] transition"
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-universe-dim">
                      No active priority exceptions detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Source Health & Live Activity Feed */}
        <div className="space-y-6">
          {/* Source Health */}
          <div className="glass-card p-5">
            <h3 className="font-display font-bold text-sm text-white mb-1">
              Data Source Connectivity & Health
            </h3>
            <p className="text-xs text-universe-muted mb-3">
              Ingested upstream pipelines & active catalogs
            </p>

            <div className="space-y-2.5">
              {metrics?.source_health.map((src) => (
                <div key={src.id} className="p-2.5 rounded-lg bg-universe-surface border border-universe-border flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{src.name}</div>
                    <div className="text-[10px] font-mono text-universe-dim">{src.records.toLocaleString()} records • {src.type}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-mint-accent/15 text-mint-accent border border-mint-accent/30 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint-accent"></span>
                    <span>{src.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass-card p-5">
            <h3 className="font-display font-bold text-sm text-white mb-1">
              System Audit Event Stream
            </h3>
            <p className="text-xs text-universe-muted mb-3">
              Tamper-evident log of transformations & executions
            </p>

            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
                metrics.recent_activity.map((act) => (
                  <div key={act.id} className="text-xs border-l-2 border-cyan-accent/50 pl-2.5 py-0.5">
                    <div className="text-universe-text font-medium leading-tight">{act.action}</div>
                    <div className="text-[10px] font-mono text-universe-dim mt-0.5">
                      {act.event_type} • {act.timestamp}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-universe-dim py-2">No recent audit events.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Issue Investigation Drawer */}
      <IssueDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdateStatus={handleUpdateIssue}
      />
    </div>
  );
};
