import React, { useState, useEffect } from 'react';
import {
  GitCompare, ArrowRight, CheckCircle2, AlertTriangle,
  Download, RefreshCw, Play, Filter, Search, SlidersHorizontal,
  DollarSign, FileSpreadsheet, ShieldAlert
} from 'lucide-react';
import { api } from '../api/client';
import { ReconciliationRun, ReconciliationException } from '../types';

export const ReconciliationPage: React.FC = () => {
  const [latestRun, setLatestRun] = useState<ReconciliationRun | null>(null);
  const [exceptions, setExceptions] = useState<ReconciliationException[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [tolerance, setTolerance] = useState<number>(0.05);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [runData, excData] = await Promise.all([
        api.getLatestReconciliation(),
        api.getReconciliationExceptions({
          exception_type: typeFilter,
          status: statusFilter,
          search: searchQuery
        })
      ]);
      setLatestRun(runData);
      setExceptions(excData.exceptions);
      if (runData?.tolerance_amount !== undefined) {
        setTolerance(runData.tolerance_amount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter, searchQuery]);

  const handleRunRecon = async () => {
    setReconciling(true);
    try {
      await api.executeReconciliation(tolerance);
      await fetchData();
    } catch (err) {
      alert('Reconciliation execution failed');
    } finally {
      setReconciling(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.updateExceptionStatus(id, { status: newStatus });
      await fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
            <span>Dual-System Reconciliation Lab</span>
            <span className="text-xs font-mono font-normal text-violet-accent px-2 py-0.5 rounded bg-violet-accent/10 border border-violet-accent/20">
              ERP vs General Ledger
            </span>
          </h1>
          <p className="text-xs text-universe-muted mt-1">
            Automated transaction matching, penny tolerance boundary evaluation, timing difference detection, and net variance calculation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <a
            href="/api/reconciliation/export"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-universe-muted hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={handleRunRecon}
            disabled={reconciling}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-violet-accent hover:bg-violet-accent/80 text-white font-semibold text-xs shadow-md shadow-violet-accent/20 transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${reconciling ? 'animate-spin' : ''}`} />
            <span>{reconciling ? 'Reconciling Ledgers...' : 'Execute Reconciliation'}</span>
          </button>
        </div>
      </div>

      {/* Matching Configuration Panel */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-universe-border gap-3">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-accent" />
            <h3 className="font-display font-bold text-sm text-white">Reconciliation Matching Configuration</h3>
          </div>
          <div className="text-xs text-universe-dim font-mono">
            Active Run: <span className="text-white font-semibold">{latestRun?.run_code || 'Pending'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Source A */}
          <div className="p-3.5 rounded-xl bg-universe-surface border border-universe-border space-y-1">
            <div className="text-[10px] font-mono uppercase text-universe-dim">Source A (Operational)</div>
            <div className="font-semibold text-white">ERP Sales Cloud Ledger</div>
            <div className="text-universe-muted font-mono text-[11px]">Key: transaction_id</div>
          </div>

          {/* Source B */}
          <div className="p-3.5 rounded-xl bg-universe-surface border border-universe-border space-y-1">
            <div className="text-[10px] font-mono uppercase text-universe-dim">Source B (Financial)</div>
            <div className="font-semibold text-white">Finance General Ledger</div>
            <div className="text-universe-muted font-mono text-[11px]">Key: external_reference</div>
          </div>

          {/* Tolerance Threshold */}
          <div className="p-3.5 rounded-xl bg-universe-surface border border-universe-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-universe-dim">Amount Tolerance</span>
              <span className="font-mono text-cyan-accent font-bold">${tolerance.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.01"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                className="w-full accent-cyan-accent cursor-pointer"
              />
              <span className="text-[11px] text-universe-dim whitespace-nowrap">± ${tolerance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reconciliation Summary Metrics */}
      {latestRun && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl glass-card text-center">
            <div className="text-[10px] font-mono uppercase text-universe-dim">Recon Match Rate</div>
            <div className="text-2xl font-display font-bold text-mint-accent mt-1">{latestRun.reconciliation_rate}%</div>
            <div className="text-[11px] text-universe-muted mt-0.5">{latestRun.matched_count} Pairs Matched</div>
          </div>

          <div className="p-4 rounded-xl glass-card text-center">
            <div className="text-[10px] font-mono uppercase text-universe-dim">Net Ledger Variance</div>
            <div className="text-2xl font-display font-bold text-coral-accent mt-1">
              ${Math.abs(latestRun.net_variance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-universe-muted mt-0.5">ERP vs GL Total $ Diff</div>
          </div>

          <div className="p-4 rounded-xl glass-card text-center">
            <div className="text-[10px] font-mono uppercase text-universe-dim">Tolerance Matches</div>
            <div className="text-2xl font-display font-bold text-cyan-accent mt-1">{latestRun.tolerance_matched_count}</div>
            <div className="text-[11px] text-universe-muted mt-0.5">Variance ≤ ${latestRun.tolerance_amount}</div>
          </div>

          <div className="p-4 rounded-xl glass-card text-center">
            <div className="text-[10px] font-mono uppercase text-universe-dim">Amount Mismatches</div>
            <div className="text-2xl font-display font-bold text-amber-accent mt-1">{latestRun.amount_mismatch_count}</div>
            <div className="text-[11px] text-universe-muted mt-0.5">Exceeds Tolerance</div>
          </div>

          <div className="p-4 rounded-xl glass-card text-center">
            <div className="text-[10px] font-mono uppercase text-universe-dim">Missing in GL (B)</div>
            <div className="text-2xl font-display font-bold text-coral-accent mt-1">{latestRun.missing_b_count}</div>
            <div className="text-[11px] text-universe-muted mt-0.5">Unposted ERP Sales</div>
          </div>

          <div className="p-4 rounded-xl glass-card text-center">
            <div className="text-[10px] font-mono uppercase text-universe-dim">Timing Differences</div>
            <div className="text-2xl font-display font-bold text-violet-accent mt-1">{latestRun.timing_difference_count}</div>
            <div className="text-[11px] text-universe-muted mt-0.5">Cut-off Cycle Pending</div>
          </div>
        </div>
      )}

      {/* Exception Review Register */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center space-x-2">
              <span>Reconciliation Exception Register & Remediation</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-violet-accent/15 border border-violet-accent/30 text-violet-accent">
                {exceptions.length} Itemized Exceptions
              </span>
            </h3>
            <p className="text-xs text-universe-muted">
              Unmatched records, dollar variances, orphan GL postings, and audit notes
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-universe-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference key or notes..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-universe-surface border border-universe-border text-xs text-white placeholder-universe-dim focus:outline-none focus:border-cyan-accent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-universe-border text-xs">
          <span className="text-universe-dim font-mono text-[11px] mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Type Filter:
          </span>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-universe-surface border border-universe-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
            <option value="MISSING_IN_B">Missing in GL (B)</option>
            <option value="MISSING_IN_A">Missing in ERP (A)</option>
            <option value="TIMING_DIFFERENCE">Timing Difference</option>
            <option value="DUPLICATE_KEY">Duplicate Key</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-universe-surface border border-universe-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="APPROVED_VARIANCE">APPROVED VARIANCE</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); setSearchQuery(''); }}
              className="text-cyan-accent hover:underline text-[11px] ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Exceptions Table */}
        <div className="overflow-x-auto border border-universe-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-universe-surface text-universe-dim font-mono text-[10px] uppercase">
              <tr>
                <th className="p-3">Exception Type</th>
                <th className="p-3">Key Reference</th>
                <th className="p-3">Source A (ERP)</th>
                <th className="p-3">Source B (GL)</th>
                <th className="p-3">Variance ($)</th>
                <th className="p-3">Assigned Owner</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-universe-border text-universe-text font-sans">
              {exceptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-universe-dim">
                    No exceptions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                exceptions.map((exc) => (
                  <tr key={exc.id} className="hover:bg-universe-surface/50 transition-colors">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        exc.exception_type === 'AMOUNT_MISMATCH' ? 'bg-amber-accent/15 text-amber-accent border border-amber-accent/30' :
                        exc.exception_type === 'TIMING_DIFFERENCE' ? 'bg-violet-accent/15 text-violet-accent border border-violet-accent/30' :
                        'bg-coral-accent/15 text-coral-accent border border-coral-accent/30'
                      }`}>
                        {exc.exception_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-cyan-accent">{exc.key_value}</td>
                    <td className="p-3 font-mono">
                      {exc.source_a_amount !== null && exc.source_a_amount !== undefined ? `$${exc.source_a_amount.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="p-3 font-mono">
                      {exc.source_b_amount !== null && exc.source_b_amount !== undefined ? `$${exc.source_b_amount.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="p-3 font-mono font-semibold text-coral-accent">
                      ${exc.variance_amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-universe-muted">{exc.owner}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        exc.status === 'NEW' ? 'bg-coral-accent/15 text-coral-accent border border-coral-accent/30' :
                        exc.status === 'INVESTIGATING' ? 'bg-amber-accent/15 text-amber-accent border border-amber-accent/30' :
                        'bg-mint-accent/15 text-mint-accent border border-mint-accent/30'
                      }`}>
                        {exc.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={exc.status}
                        onChange={(e) => handleUpdateStatus(exc.id, e.target.value)}
                        className="bg-universe-surface border border-universe-border rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-accent"
                      >
                        <option value="NEW">Mark: NEW</option>
                        <option value="INVESTIGATING">Mark: INVESTIGATING</option>
                        <option value="APPROVED_VARIANCE">Mark: APPROVED</option>
                        <option value="RESOLVED">Mark: RESOLVED</option>
                      </select>
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
