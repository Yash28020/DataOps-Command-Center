import React, { useState, useEffect } from 'react';
import {
  UploadCloud, FileText, Database, Trash2, CheckCircle2,
  AlertCircle, RefreshCw, Eye, ArrowRight, ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';
import { DataSourceItem } from '../types';

export const SourcesPage: React.FC = () => {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<DataSourceItem | null>(null);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const data = await api.listSources();
      setSources(data);
      if (data.length > 0 && !selectedSource) {
        setSelectedSource(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await api.uploadFile(file);
      setUploadSuccess(`Successfully ingested '${file.name}' with ${res.row_count} records.`);
      await fetchSources();
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this data source?')) return;
    try {
      await api.deleteSource(id);
      await fetchSources();
      if (selectedSource?.id === id) {
        setSelectedSource(null);
      }
    } catch (err) {
      alert('Failed to delete source');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
            <span>Operational Data Ingestion & Profiling</span>
            <span className="text-xs font-mono font-normal text-cyan-accent px-2 py-0.5 rounded bg-cyan-accent/10 border border-cyan-accent/20">
              CSV / XLSX Engine
            </span>
          </h1>
          <p className="text-xs text-universe-muted mt-1">
            Schema inference, data type detection, null-value analysis, and batch staging.
          </p>
        </div>

        <button
          onClick={fetchSources}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-universe-surface hover:bg-universe-hover border border-universe-border text-xs text-universe-muted hover:text-white transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Sources</span>
        </button>
      </div>

      {/* Upload & Staging Zone */}
      <div className="glass-card p-6 border-dashed border-2 border-universe-border hover:border-cyan-accent/50 transition-colors rounded-2xl relative">
        <input
          type="file"
          id="file-upload"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="text-center py-4 space-y-3 pointer-events-none">
          <div className="w-12 h-12 mx-auto rounded-full bg-cyan-accent/10 border border-cyan-accent/30 flex items-center justify-center text-cyan-accent shadow-lg shadow-cyan-accent/10">
            <UploadCloud className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white">
              {uploading ? 'Parsing and Profiling Dataset...' : 'Drag & Drop Operational Datasets or Click to Browse'}
            </h3>
            <p className="text-xs text-universe-muted mt-1">
              Supports CSV and Excel workbooks (.xlsx, .xls) up to 50MB. Macros and formulas are safely decoupled.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 text-[11px] font-mono text-cyan-accent">
            <span>Auto Type Inference</span>
            <span>•</span>
            <span>Null Rate Profiler</span>
            <span>•</span>
            <span>Duplicate Key Detection</span>
          </div>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadSuccess && (
        <div className="p-3 rounded-lg bg-mint-accent/15 border border-mint-accent/30 text-mint-accent text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}
      {uploadError && (
        <div className="p-3 rounded-lg bg-coral-accent/15 border border-coral-accent/30 text-coral-accent text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Two Column Layout: Source List & Detailed Schema Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Catalog List */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-universe-border">
            <h3 className="font-display font-bold text-sm text-white">Registered Sources</h3>
            <span className="text-xs font-mono text-cyan-accent">{sources.length} Cataloged</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {sources.length === 0 ? (
              <div className="py-8 text-center text-xs text-universe-dim">
                No sources registered yet. Upload a file above or click 'Load Demo Batches' in the top bar.
              </div>
            ) : (
              sources.map((src) => {
                const isSelected = selectedSource?.id === src.id;
                return (
                  <div
                    key={src.id}
                    onClick={() => setSelectedSource(src)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-universe-card border-cyan-accent shadow-md shadow-cyan-accent/10'
                        : 'bg-universe-surface border-universe-border hover:border-universe-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-white truncate max-w-[180px]">
                        {src.name}
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-universe-bg text-universe-dim border border-universe-border">
                        {src.source_type}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-universe-muted font-mono">
                      <span>{src.row_count.toLocaleString()} rows</span>
                      <span>{(src.file_size_bytes / 1024).toFixed(1)} KB</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-universe-border/50 flex items-center justify-between">
                      <span className="text-[10px] text-universe-dim truncate">
                        {src.file_name || 'System Fixture'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(src.id);
                        }}
                        className="text-universe-dim hover:text-coral-accent p-1 transition"
                        title="Remove source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed Schema Profile & Sample Preview */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          {selectedSource ? (
            <>
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-universe-border gap-2">
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    {selectedSource.name}
                  </h3>
                  <p className="text-xs text-universe-muted">
                    {selectedSource.description || 'Enterprise operational dataset cataloged for processing.'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-universe-surface border border-universe-border text-cyan-accent">
                    {selectedSource.row_count.toLocaleString()} Records
                  </span>
                  <span className="px-2 py-1 rounded bg-universe-surface border border-universe-border text-violet-accent">
                    {selectedSource.column_count} Columns
                  </span>
                </div>
              </div>

              {/* Column Schema & Inferred Types Table */}
              <div>
                <h4 className="text-xs font-mono uppercase font-bold text-universe-dim tracking-wider mb-2">
                  Inferred Schema & Column Profiles
                </h4>
                <div className="overflow-x-auto max-h-56 overflow-y-auto border border-universe-border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-universe-surface text-universe-dim font-mono text-[10px] uppercase sticky top-0">
                      <tr>
                        <th className="p-2.5">Column Name</th>
                        <th className="p-2.5">Inferred Type</th>
                        <th className="p-2.5">Missing Count</th>
                        <th className="p-2.5">Null Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-universe-border text-universe-text font-mono">
                      {selectedSource.schema_info?.columns?.map((col: string) => {
                        const colType = selectedSource.schema_info?.column_types?.[col] || 'STRING';
                        const nullCount = selectedSource.schema_info?.null_counts?.[col] || 0;
                        const nullRate = selectedSource.row_count > 0 ? ((nullCount / selectedSource.row_count) * 100).toFixed(1) : '0';
                        return (
                          <tr key={col} className="hover:bg-universe-surface/40">
                            <td className="p-2.5 font-semibold text-white">{col}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-universe-card border border-universe-border text-[10px] text-cyan-accent font-bold">
                                {colType}
                              </span>
                            </td>
                            <td className="p-2.5 text-universe-muted">{nullCount}</td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                Number(nullRate) > 10 ? 'bg-amber-accent/20 text-amber-accent' : 'text-universe-dim'
                              }`}>
                                {nullRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validation Warnings */}
              {selectedSource.schema_info?.validation_warnings?.length > 0 && (
                <div className="p-3.5 rounded-lg bg-amber-accent/10 border border-amber-accent/30 space-y-1">
                  <div className="text-xs font-bold text-amber-accent flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Schema Profiler Warnings</span>
                  </div>
                  <ul className="text-xs text-universe-muted list-disc list-inside space-y-0.5">
                    {selectedSource.schema_info.validation_warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample Rows Preview */}
              {selectedSource.schema_info?.sample_rows?.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase font-bold text-universe-dim tracking-wider mb-2">
                    Staged Rows Preview (Top 15 Rows)
                  </h4>
                  <div className="overflow-x-auto border border-universe-border rounded-lg max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-universe-surface text-universe-dim uppercase text-[9px] sticky top-0">
                        <tr>
                          {selectedSource.schema_info.columns.slice(0, 8).map((col: string) => (
                            <th key={col} className="p-2 whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-universe-border/50 text-universe-text">
                        {selectedSource.schema_info.sample_rows.map((row: any, r_idx: number) => (
                          <tr key={r_idx} className="hover:bg-universe-surface/30">
                            {selectedSource.schema_info.columns.slice(0, 8).map((col: string) => (
                              <td key={col} className="p-2 whitespace-nowrap max-w-xs truncate text-universe-muted">
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
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-universe-dim">
              <Database className="w-8 h-8 text-universe-border" />
              <p className="text-xs">Select a data source from the left panel to inspect its schema and profiled rows.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
