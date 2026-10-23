import React, { useState, useEffect } from 'react';
import {
  BarChart3, Download, Copy, CheckCircle2,
  Database, Layers, Code, ArrowRight, ExternalLink, Sparkles
} from 'lucide-react';
import { api } from '../api/client';

export const BiWorkspacePage: React.FC = () => {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchBiData = async () => {
      try {
        setLoading(true);
        const data = await api.getBiMetadata();
        setMetadata(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBiData();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setExportSuccess(null);
    try {
      const res = await api.exportBiPackage();
      setExportSuccess(`Exported ${res.tables_count} star-schema tables into downloadable zip package.`);
    } catch (err) {
      alert('Failed to export BI package');
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
            <span>Power BI & Tableau Readiness Workspace</span>
            <span className="text-xs font-mono font-normal text-violet-accent px-2 py-0.5 rounded bg-violet-accent/10 border border-violet-accent/20">
              Star-Schema 3NF Model
            </span>
          </h1>
          <p className="text-xs text-universe-muted mt-1">
            Enterprise dimensional architecture, copyable DAX calculations, Tableau formulas, and direct CSV data package exports.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-white transition disabled:opacity-50"
          >
            <Layers className={`w-3.5 h-3.5 text-cyan-accent ${exporting ? 'animate-spin' : ''}`} />
            <span>{exporting ? 'Generating CSVs...' : 'Generate Star-Schema CSVs'}</span>
          </button>
          <a
            href="/api/bi/download-package"
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-violet-accent hover:bg-violet-accent/80 text-white font-semibold text-xs shadow-md shadow-violet-accent/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download BI Zip Package</span>
          </a>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-3 rounded-lg bg-mint-accent/15 border border-mint-accent/30 text-mint-accent text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Dimensional Star-Schema Overview */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-universe-border">
          <div>
            <h3 className="font-display font-bold text-sm text-white">Recommended Dimensional Star-Schema Model</h3>
            <p className="text-xs text-universe-muted">Optimized for high-performance aggregation in Power BI VertiPaq & Tableau Hyper Engine</p>
          </div>
          <span className="text-xs font-mono text-cyan-accent font-semibold">3 Fact Tables • 4 Conformed Dimensions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fact Transactions */}
          <div className="p-4 rounded-xl bg-universe-surface border border-cyan-accent/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-accent font-mono">FactTransactions</span>
              <span className="text-[10px] font-mono text-universe-dim">Grain: Order Item</span>
            </div>
            <p className="text-[11px] text-universe-muted leading-relaxed">
              Operational transactions with monetary revenue, quantities, and validation compliance flag.
            </p>
            <div className="pt-2 border-t border-universe-border text-[10px] font-mono text-universe-dim space-y-0.5">
              <div>FK: customer_id, product_sku</div>
              <div>FK: date_key, department</div>
            </div>
          </div>

          {/* Fact Quality Issues */}
          <div className="p-4 rounded-xl bg-universe-surface border border-violet-accent/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-accent font-mono">FactDataQualityIssues</span>
              <span className="text-[10px] font-mono text-universe-dim">Grain: Exception</span>
            </div>
            <p className="text-[11px] text-universe-muted leading-relaxed">
              Line-item validation anomalies categorized by dimension, severity, and remediation status.
            </p>
            <div className="pt-2 border-t border-universe-border text-[10px] font-mono text-universe-dim space-y-0.5">
              <div>FK: rule_code, record_id</div>
              <div>Measures: issue_count, severity</div>
            </div>
          </div>

          {/* Fact Reconciliation */}
          <div className="p-4 rounded-xl bg-universe-surface border border-mint-accent/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-mint-accent font-mono">FactReconciliationRuns</span>
              <span className="text-[10px] font-mono text-universe-dim">Grain: Recon Batch</span>
            </div>
            <p className="text-[11px] text-universe-muted leading-relaxed">
              Cross-system matching results, penny variance amounts, and ledger reconciliation rates.
            </p>
            <div className="pt-2 border-t border-universe-border text-[10px] font-mono text-universe-dim space-y-0.5">
              <div>AK: run_code, source_pair</div>
              <div>Measures: net_variance, match_rate</div>
            </div>
          </div>

          {/* Dimensions Bundle */}
          <div className="p-4 rounded-xl bg-universe-surface border border-universe-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">Conformed Dimensions</span>
              <span className="text-[10px] font-mono text-universe-dim">4 Dimensions</span>
            </div>
            <ul className="text-[11px] text-universe-muted space-y-1 font-mono">
              <li>• DimCustomer (Segment, Region)</li>
              <li>• DimProduct (SKU, Category)</li>
              <li>• DimDepartment (Cost Center)</li>
              <li>• DimDate (Y-Q-M Hierarchy)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Two Column: DAX Measures & Tableau Formulas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power BI DAX Measures */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-universe-border">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-accent"></span>
              <h3 className="font-display font-bold text-sm text-white">Power BI DAX Measures Library</h3>
            </div>
            <span className="text-xs font-mono text-universe-dim">Copy-Paste Ready</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto">
            {metadata?.dax_measures?.map((m: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-universe-surface border border-universe-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-white">{m.name}</div>
                  <button
                    onClick={() => copyToClipboard(m.dax, `dax-${idx}`)}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded bg-universe-card hover:bg-universe-hover border border-universe-border text-[10px] text-cyan-accent transition"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === `dax-${idx}` ? 'Copied' : 'Copy DAX'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-universe-muted leading-tight">{m.description}</p>
                <div className="p-2.5 rounded bg-universe-bg border border-universe-border font-mono text-[11px] text-amber-accent whitespace-pre overflow-x-auto">
                  {m.dax}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tableau Calculated Fields & M Script */}
        <div className="space-y-6">
          {/* Tableau Calculated Fields */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-universe-border">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-accent"></span>
                <h3 className="font-display font-bold text-sm text-white">Tableau Calculated Fields</h3>
              </div>
              <span className="text-xs font-mono text-universe-dim">Hyper Engine Syntax</span>
            </div>

            <div className="space-y-3">
              {metadata?.tableau_fields?.map((tf: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-universe-surface border border-universe-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{tf.name}</span>
                    <button
                      onClick={() => copyToClipboard(tf.formula, `tab-${idx}`)}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded bg-universe-card hover:bg-universe-hover border border-universe-border text-[10px] text-cyan-accent transition"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === `tab-${idx}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-universe-muted leading-tight">{tf.description}</p>
                  <div className="p-2 rounded bg-universe-bg border border-universe-border font-mono text-[11px] text-cyan-accent whitespace-pre overflow-x-auto">
                    {tf.formula}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Power Query M Ingestion Script */}
          <div className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-white">Power Query (M) Script Template</h3>
              <button
                onClick={() => copyToClipboard(metadata?.power_query_script || '', 'pq')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-cyan-accent transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedKey === 'pq' ? 'Copied' : 'Copy M Script'}</span>
              </button>
            </div>
            <p className="text-xs text-universe-muted">
              Paste directly into Power BI Advanced Editor to ingest FactTransactions.csv with strict typing.
            </p>
            <div className="p-3 rounded-lg bg-universe-bg border border-universe-border font-mono text-[11px] text-violet-accent max-h-36 overflow-y-auto whitespace-pre">
              {metadata?.power_query_script}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
