import React, { useState, useEffect } from 'react';
import {
  Cpu, Layers, CheckCircle2, AlertTriangle, Clock,
  RefreshCw, Shield, GitCommit, ArrowRight, User
} from 'lucide-react';
import { api } from '../api/client';

export const OperationsPage: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [lineage, setLineage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [runsData, batchesData, auditData, lineageData] = await Promise.all([
        api.getProcessingRuns(),
        api.getIngestionBatches(),
        api.getAuditEvents(),
        api.getDataLineage()
      ]);
      setRuns(runsData);
      setBatches(batchesData);
      setAuditEvents(auditData);
      setLineage(lineageData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
            <span>Audit Trail & Operations Telemetry</span>
            <span className="text-xs font-mono font-normal text-cyan-accent px-2 py-0.5 rounded bg-cyan-accent/10 border border-cyan-accent/20">
              Idempotent Engine
            </span>
          </h1>
          <p className="text-xs text-universe-muted mt-1">
            Processing run telemetry, batch integrity checksums, end-to-end data lineage, and tamper-evident audit logs.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-universe-muted hover:text-white transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Operations</span>
        </button>
      </div>

      {/* End-to-End Lineage Flow Visual */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-universe-border">
          <div>
            <h3 className="font-display font-bold text-sm text-white">Source-to-Target Data Lineage Architecture</h3>
            <p className="text-xs text-universe-muted">Topological traceability across ingestion, cleansing, reconciliation, and deliverables</p>
          </div>
          <span className="text-xs font-mono text-cyan-accent font-semibold">8 Governed Stations</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {lineage?.nodes?.map((node: any, idx: number) => (
            <div
              key={node.id}
              className="p-3 rounded-xl bg-universe-surface border border-universe-border hover:border-cyan-accent/40 transition flex flex-col justify-between space-y-2 text-center"
            >
              <div className="text-[9px] font-mono font-bold text-universe-dim uppercase">
                {node.type}
              </div>
              <div className="text-xs font-semibold text-white leading-tight">
                {node.label}
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-universe-card text-mint-accent border border-mint-accent/20 mx-auto">
                {node.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column: Processing Runs & Ingestion Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Runs History */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-universe-border">
            <h3 className="font-display font-bold text-sm text-white">Processing Run Telemetry</h3>
            <span className="text-xs font-mono text-cyan-accent">{runs.length} Runs Logged</span>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto border border-universe-border rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-universe-surface text-universe-dim uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="p-2.5">Run Code</th>
                  <th className="p-2.5">Stage</th>
                  <th className="p-2.5">Processed</th>
                  <th className="p-2.5">Latency</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-universe-border text-universe-text font-sans">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-universe-dim">No processing runs recorded yet.</td>
                  </tr>
                ) : (
                  runs.map((r) => (
                    <tr key={r.id} className="hover:bg-universe-surface/40">
                      <td className="p-2.5 font-mono text-cyan-accent">{r.run_code}</td>
                      <td className="p-2.5 font-mono text-white text-[11px]">{r.pipeline_stage}</td>
                      <td className="p-2.5 font-mono text-universe-muted">{r.records_processed?.toLocaleString() || 0}</td>
                      <td className="p-2.5 font-mono text-universe-dim">{r.duration_ms}ms</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          r.status === 'COMPLETED' ? 'bg-mint-accent/15 text-mint-accent' :
                          r.status === 'WARNING' ? 'bg-amber-accent/15 text-amber-accent' :
                          'bg-coral-accent/15 text-coral-accent'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ingestion Batches */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-universe-border">
            <h3 className="font-display font-bold text-sm text-white">Ingestion Batches (SHA-256 Checksums)</h3>
            <span className="text-xs font-mono text-violet-accent">{batches.length} Batches Staged</span>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto border border-universe-border rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-universe-surface text-universe-dim uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="p-2.5">Batch Number</th>
                  <th className="p-2.5">Source</th>
                  <th className="p-2.5">Record Count</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-universe-border text-universe-text font-sans">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-universe-dim">No batches staged yet.</td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-universe-surface/40">
                      <td className="p-2.5 font-mono text-violet-accent">{b.batch_number}</td>
                      <td className="p-2.5 text-white font-medium">{b.source_name}</td>
                      <td className="p-2.5 font-mono text-universe-muted">{b.record_count.toLocaleString()}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-mint-accent/15 text-mint-accent">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Comprehensive Audit Trail */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-universe-border">
          <div>
            <h3 className="font-display font-bold text-sm text-white">Immutable System Audit Trail</h3>
            <p className="text-xs text-universe-muted">Detailed change logs across ingestions, quality evaluations, and resolution changes</p>
          </div>
          <span className="text-xs font-mono text-cyan-accent">{auditEvents.length} Events Recorded</span>
        </div>

        <div className="overflow-x-auto border border-universe-border rounded-xl max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-universe-surface text-universe-dim font-mono text-[10px] uppercase sticky top-0">
              <tr>
                <th className="p-3">Audit ID</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Action Description</th>
                <th className="p-3">User / Agent</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-universe-border text-universe-text font-sans">
              {auditEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-universe-dim">No audit events recorded.</td>
                </tr>
              ) : (
                auditEvents.map((a) => (
                  <tr key={a.id} className="hover:bg-universe-surface/40 font-mono text-[11px]">
                    <td className="p-3 text-universe-dim">AUD-{a.id.toString().padStart(5, '0')}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-universe-surface border border-universe-border text-cyan-accent font-semibold text-[10px]">
                        {a.event_type}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-white text-xs">{a.action}</td>
                    <td className="p-3 text-universe-muted font-sans flex items-center space-x-1">
                      <User className="w-3 h-3 text-universe-dim" />
                      <span>{a.user_id}</span>
                    </td>
                    <td className="p-3 text-universe-dim">{a.timestamp ? new Date(a.timestamp).toLocaleString() : 'N/A'}</td>
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
