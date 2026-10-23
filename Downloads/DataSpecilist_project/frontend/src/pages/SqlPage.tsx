import React, { useState, useEffect } from 'react';
import {
  Terminal, Play, Download, CheckCircle2, AlertCircle,
  Copy, Clock, Shield, Sparkles, Database
} from 'lucide-react';
import { api } from '../api/client';
import { SqlTemplate, SqlQueryResult } from '../types';

export const SqlPage: React.FC = () => {
  const [templates, setTemplates] = useState<SqlTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SqlTemplate | null>(null);
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<SqlQueryResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await api.getSqlTemplates();
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]);
          setQueryText(data[0].sql);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (t: SqlTemplate) => {
    setSelectedTemplate(t);
    setQueryText(t.sql);
    setError(null);
  };

  const handleRunQuery = async () => {
    setExecuting(true);
    setError(null);
    try {
      const res = await api.executeSql(queryText, 100);
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'Execution error');
      setResults(null);
    } finally {
      setExecuting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(queryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    if (!results || results.rows.length === 0) return;
    const headers = results.columns.join(',');
    const rows = results.rows.map(r => results.columns.map(c => `"${r[c] ?? ''}"`).join(','));
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sql_analytics_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
            <span>SQL Intelligence & Analytical Views</span>
            <span className="text-xs font-mono font-normal text-cyan-accent px-2 py-0.5 rounded bg-cyan-accent/10 border border-cyan-accent/20">
              Read-Only Guardrails Active
            </span>
          </h1>
          <p className="text-xs text-universe-muted mt-1">
            Common Table Expressions (CTEs), window running totals, cohort aggregations, and exception joins.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-universe-surface border border-universe-border text-universe-dim font-mono">
            <Shield className="w-3.5 h-3.5 text-mint-accent" />
            <span>SELECT & WITH Only</span>
          </span>
        </div>
      </div>

      {/* Preset Query Templates Catalog */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-white">Curated Business Analytics Query Catalog</h3>
          <span className="text-xs font-mono text-cyan-accent">{templates.length} Templates Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((t) => {
            const isSelected = selectedTemplate?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-universe-card border-cyan-accent shadow-md shadow-cyan-accent/10'
                    : 'bg-universe-surface border-universe-border hover:border-universe-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-cyan-accent font-semibold px-1.5 py-0.5 rounded bg-universe-bg border border-universe-border">
                    {t.category}
                  </span>
                </div>
                <div className="font-semibold text-xs text-white mb-1">{t.title}</div>
                <p className="text-[11px] text-universe-muted leading-relaxed line-clamp-2">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* SQL Editor & Interactive Runner */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-accent" />
            <h3 className="font-display font-bold text-sm text-white">Interactive SQL Editor</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-universe-muted hover:text-white transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleRunQuery}
              disabled={executing}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-cyan-accent hover:bg-cyan-bright text-universe-bg font-semibold text-xs shadow-md shadow-cyan-accent/20 transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${executing ? 'animate-spin' : ''}`} />
              <span>{executing ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>
        </div>

        {/* Code Input */}
        <div className="relative rounded-xl overflow-hidden border border-universe-border bg-universe-bg">
          <textarea
            rows={8}
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="w-full p-4 bg-universe-bg font-mono text-xs text-cyan-accent focus:outline-none resize-y leading-relaxed"
            placeholder="SELECT * FROM business_transactions WHERE is_valid = 1 LIMIT 50;"
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-coral-accent/15 border border-coral-accent/30 text-coral-accent text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Query Results Table */}
      {results && (
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-universe-border">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-semibold text-white">Query Results</span>
              <span className="font-mono text-cyan-accent bg-universe-surface px-2 py-0.5 rounded border border-universe-border">
                {results.row_count} rows returned
              </span>
              <span className="font-mono text-universe-dim flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{results.execution_time_ms}ms</span>
              </span>
            </div>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-white transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-universe-border rounded-xl max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-universe-surface text-universe-dim uppercase text-[10px] sticky top-0">
                <tr>
                  {results.columns.map((col) => (
                    <th key={col} className="p-2.5 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-universe-border text-universe-text font-sans">
                {results.rows.map((row, r_idx) => (
                  <tr key={r_idx} className="hover:bg-universe-surface/40">
                    {results.columns.map((col) => (
                      <td key={col} className="p-2.5 whitespace-nowrap text-universe-muted max-w-xs truncate font-mono text-[11px]">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-coral-accent italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
