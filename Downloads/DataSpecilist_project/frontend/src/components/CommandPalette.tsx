import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Activity, Database, ShieldCheck,
  GitCompare, Terminal, FileSpreadsheet, BarChart3,
  Cpu, Sparkles, RefreshCw, FileDown
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSeedDemo: () => void;
  onRunValidation: () => void;
  onRunRecon: () => void;
  onGenerateReport: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSeedDemo,
  onRunValidation,
  onRunRecon,
  onGenerateReport,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'seed-demo',
      label: 'Seed Multi-Batch Demonstration Datasets',
      category: 'Data Operations',
      icon: RefreshCw,
      handler: () => { onSeedDemo(); onClose(); }
    },
    {
      id: 'run-val',
      label: 'Execute Data Quality Rule Evaluation',
      category: 'Data Quality Studio',
      icon: ShieldCheck,
      handler: () => { onRunValidation(); onClose(); navigate('/quality'); }
    },
    {
      id: 'run-recon',
      label: 'Run Dual-System Reconciliation Engine',
      category: 'Reconciliation Lab',
      icon: GitCompare,
      handler: () => { onRunRecon(); onClose(); navigate('/reconciliation'); }
    },
    {
      id: 'gen-report',
      label: 'Generate Multi-Sheet Excel Executive Workbook',
      category: 'Reporting Studio',
      icon: FileSpreadsheet,
      handler: () => { onGenerateReport(); onClose(); navigate('/reports'); }
    },
    {
      id: 'nav-overview',
      label: 'Navigate to Command Center Dashboard',
      category: 'Navigation',
      icon: Activity,
      handler: () => { navigate('/overview'); onClose(); }
    },
    {
      id: 'nav-sources',
      label: 'Navigate to Data Sources & Ingestion',
      category: 'Navigation',
      icon: Database,
      handler: () => { navigate('/sources'); onClose(); }
    },
    {
      id: 'nav-sql',
      label: 'Open SQL Intelligence Terminal & Analytics',
      category: 'Analytics',
      icon: Terminal,
      handler: () => { navigate('/sql'); onClose(); }
    },
    {
      id: 'nav-bi',
      label: 'Open Power BI & Tableau Star-Schema Workspace',
      category: 'BI Integration',
      icon: BarChart3,
      handler: () => { navigate('/bi-workspace'); onClose(); }
    },
    {
      id: 'nav-insights',
      label: 'View Strategic Business Findings & Recommendations',
      category: 'Insights',
      icon: Sparkles,
      handler: () => { navigate('/insights'); onClose(); }
    },
    {
      id: 'nav-ops',
      label: 'View System Audit Trail & Lineage Graph',
      category: 'Governance',
      icon: Cpu,
      handler: () => { navigate('/operations'); onClose(); }
    }
  ];

  const filteredActions = actions.filter(a =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-fadeIn">
      <div className="w-full max-w-xl glass-panel rounded-xl shadow-2xl border border-cyan-accent/30 overflow-hidden bg-universe-bg">
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-3 border-b border-universe-border bg-universe-surface">
          <Search className="w-5 h-5 text-cyan-accent mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search modules (e.g., 'Reconcile', 'Excel', 'SQL')..."
            className="flex-1 bg-transparent text-white placeholder-universe-dim focus:outline-none text-sm"
          />
          <button onClick={onClose} className="p-1 hover:bg-universe-hover rounded text-universe-dim hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Items List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="p-6 text-center text-xs text-universe-dim">
              No matching actions found for "{query}".
            </div>
          ) : (
            filteredActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.handler}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm hover:bg-universe-surface hover:text-cyan-accent transition group cursor-pointer text-universe-text"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded bg-universe-card border border-universe-border text-cyan-accent group-hover:border-cyan-accent/40">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-universe-card text-universe-dim border border-universe-border">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2 border-t border-universe-border bg-universe-surface/50 flex items-center justify-between text-[11px] text-universe-dim font-mono">
          <span>Use Enter to select • Esc to dismiss</span>
          <span className="text-cyan-accent">DataOps Command Palette</span>
        </div>
      </div>
    </div>
  );
};
