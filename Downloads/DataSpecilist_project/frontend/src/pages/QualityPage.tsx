import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle, Play,
  Search, Filter, Sliders, RefreshCw, Eye, Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { ValidationRule, DataQualityIssue } from '../types';
import { IssueDrawer } from '../components/IssueDrawer';

export const QualityPage: React.FC = () => {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<DataQualityIssue | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [dimensionFilter, setDimensionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesData, issuesData] = await Promise.all([
        api.getRules(),
        api.getQualityIssues({
          severity: severityFilter,
          dimension: dimensionFilter,
          status: statusFilter,
          search: searchQuery,
          limit: 100
        })
      ]);
      setRules(rulesData);
      setIssues(issuesData.issues);
      setTotalIssues(issuesData.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [severityFilter, dimensionFilter, statusFilter, searchQuery]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await api.runValidation();
      await fetchData();
    } catch (err) {
      alert('Validation evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const handleToggleRule = async (ruleId: number) => {
    await api.toggleRule(ruleId);
    await fetchData();
  };

  const handleUpdateIssue = async (id: number, status: string, notes: string, assignedTo: string) => {
    await api.updateIssueStatus(id, { status, resolution_notes: notes, assigned_to: assignedTo });
    await fetchData();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
            <span>Data Quality Studio</span>
            <span className="text-xs font-mono font-normal text-mint-accent px-2 py-0.5 rounded bg-mint-accent/10 border border-mint-accent/20">
              Rule Engine Active
            </span>
          </h1>
          <p className="text-xs text-universe-muted mt-1">
            Configurable rule governance, dimensional scoring (Completeness, Uniqueness, Validity, Integrity), and exception remediation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-universe-muted hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-cyan-accent hover:bg-cyan-bright text-universe-bg font-semibold text-xs shadow-md shadow-cyan-accent/20 transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Evaluating Rules...' : 'Execute Validation Run'}</span>
          </button>
        </div>
      </div>

      {/* Rules Governance Grid */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm text-white">Active Validation Rule Inventory</h3>
            <p className="text-xs text-universe-muted">6 canonical data governance checks evaluated against operational datasets</p>
          </div>
          <span className="text-xs font-mono text-cyan-accent font-semibold">{rules.length} Rules Configured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-xl border transition-all ${
                rule.is_active
                  ? 'bg-universe-surface border-universe-border hover:border-cyan-accent/50'
                  : 'bg-universe-card/50 border-universe-border/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-cyan-accent px-1.5 py-0.5 rounded bg-universe-bg border border-universe-border">
                  {rule.rule_code}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  rule.severity === 'CRITICAL' ? 'bg-coral-accent/15 text-coral-accent border border-coral-accent/30' :
                  'bg-amber-accent/15 text-amber-accent border border-amber-accent/30'
                }`}>
                  {rule.severity}
                </span>
              </div>

              <div className="font-semibold text-xs text-white mb-1">{rule.name}</div>
              <p className="text-[11px] text-universe-muted leading-relaxed line-clamp-2 mb-3">
                {rule.description}
              </p>

              <div className="pt-2 border-t border-universe-border flex items-center justify-between text-[11px] font-mono">
                <span className="text-universe-dim">{rule.dimension} (wt: {rule.weight}%)</span>
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    rule.is_active
                      ? 'bg-mint-accent/20 text-mint-accent hover:bg-mint-accent/30'
                      : 'bg-universe-card text-universe-dim hover:text-white'
                  }`}
                >
                  {rule.is_active ? 'ACTIVE' : 'DISABLED'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exception Explorer & Filters */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center space-x-2">
              <span>Data Quality Exception Explorer</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-accent/10 border border-cyan-accent/30 text-cyan-accent">
                {totalIssues} Exceptions Detected
              </span>
            </h3>
            <p className="text-xs text-universe-muted">
              Granular record-level failure register with preserved original values and audit tracking
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-universe-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, field, or reason..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-universe-surface border border-universe-border text-xs text-white placeholder-universe-dim focus:outline-none focus:border-cyan-accent"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-universe-border text-xs">
          <span className="text-universe-dim font-mono text-[11px] mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Filters:
          </span>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-universe-surface border border-universe-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warnings Only</option>
          </select>

          {/* Dimension */}
          <select
            value={dimensionFilter}
            onChange={(e) => setDimensionFilter(e.target.value)}
            className="bg-universe-surface border border-universe-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Dimensions</option>
            <option value="Completeness">Completeness</option>
            <option value="Uniqueness">Uniqueness</option>
            <option value="Validity">Validity</option>
            <option value="Integrity">Integrity</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-universe-surface border border-universe-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="SUPPRESSED">SUPPRESSED</option>
          </select>

          {(severityFilter !== 'ALL' || dimensionFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSeverityFilter('ALL');
                setDimensionFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="text-cyan-accent hover:underline text-[11px] ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Issues Table */}
        <div className="overflow-x-auto border border-universe-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-universe-surface text-universe-dim font-mono text-[10px] uppercase">
              <tr>
                <th className="p-3">Issue ID</th>
                <th className="p-3">Record Identifier</th>
                <th className="p-3">Rule / Dimension</th>
                <th className="p-3">Captured Invalid Value</th>
                <th className="p-3">Failure Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-universe-border text-universe-text font-sans">
              {issues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-universe-dim">
                    No exceptions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-universe-surface/50 transition-colors">
                    <td className="p-3 font-mono text-universe-dim">{issue.issue_code.slice(-14)}</td>
                    <td className="p-3 font-mono font-semibold text-cyan-accent">{issue.record_identifier}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{issue.rule_name}</div>
                      <div className="text-[10px] font-mono text-universe-dim">{issue.dimension}</div>
                    </td>
                    <td className="p-3 font-mono text-coral-accent max-w-xs truncate">
                      {issue.original_value || <span className="text-universe-dim italic">null</span>}
                    </td>
                    <td className="p-3 text-universe-muted max-w-xs truncate">{issue.failure_reason}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        issue.status === 'OPEN' ? 'bg-coral-accent/15 text-coral-accent border border-coral-accent/30' :
                        issue.status === 'UNDER_REVIEW' ? 'bg-amber-accent/15 text-amber-accent border border-amber-accent/30' :
                        'bg-mint-accent/15 text-mint-accent border border-mint-accent/30'
                      }`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="px-2.5 py-1 rounded bg-universe-surface hover:bg-cyan-accent/20 border border-universe-border hover:border-cyan-accent/40 text-universe-text hover:text-cyan-accent font-semibold text-[11px] transition"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Drawer */}
      <IssueDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onUpdateStatus={handleUpdateIssue}
      />
    </div>
  );
};
