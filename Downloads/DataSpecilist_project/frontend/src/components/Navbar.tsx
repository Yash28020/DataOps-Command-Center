import React from 'react';
import { Search, Database, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
  activePeriod: string;
  setActivePeriod: (period: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommandPalette,
  onSeedDemo,
  isSeeding,
  activePeriod,
  setActivePeriod,
}) => {
  return (
    <header className="h-16 border-b border-universe-border bg-universe-bg/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Workspace */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-accent to-violet-accent p-0.5 flex items-center justify-center shadow-lg shadow-cyan-accent/20">
            <div className="w-full h-full bg-universe-bg rounded-[7px] flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-accent" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-bold text-lg tracking-wider text-white">
                DATAOPS <span className="text-cyan-accent">COMMAND CENTER</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-accent/10 border border-cyan-accent/30 text-cyan-accent">
                v1.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-universe-dim font-mono hidden md:block">
              The Intelligence Layer for Trusted Business Data
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-universe-border text-xs text-universe-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-mint-accent animate-pulse"></span>
          <span>Engine: <strong className="text-universe-text">PostgreSQL/SQLite Dual-Mode</strong></span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Quick Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-universe-surface border border-universe-border hover:border-cyan-accent/40 text-universe-muted hover:text-universe-text transition text-xs"
        >
          <Search className="w-3.5 h-3.5 text-cyan-accent" />
          <span className="hidden sm:inline">Command Palette</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-universe-card border border-universe-border rounded text-universe-dim">
            ⌘K
          </kbd>
        </button>

        {/* Reporting Period Filter */}
        <div className="flex items-center space-x-1.5 bg-universe-surface border border-universe-border rounded-lg px-2.5 py-1 text-xs">
          <span className="text-universe-dim">Period:</span>
          <select
            value={activePeriod}
            onChange={(e) => setActivePeriod(e.target.value)}
            className="bg-transparent text-cyan-accent font-semibold focus:outline-none cursor-pointer"
          >
            <option value="Q4 2026" className="bg-universe-card text-white">Q4 2026 (Oct - Dec)</option>
            <option value="Batch-2026-10" className="bg-universe-card text-white">October 2026</option>
            <option value="Batch-2026-11" className="bg-universe-card text-white">November 2026</option>
            <option value="Batch-2026-12" className="bg-universe-card text-white">December 2026</option>
          </select>
        </div>

        {/* Seed Demo Data Button */}
        <button
          onClick={onSeedDemo}
          disabled={isSeeding}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-accent/20 to-violet-accent/20 hover:from-cyan-accent/30 hover:to-violet-accent/30 border border-cyan-accent/40 text-cyan-accent hover:text-white transition text-xs font-semibold shadow-sm"
          title="Generates multi-batch synthetic ERP & GL data with controlled defects"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Seeding...' : 'Load Demo Batches'}</span>
        </button>

        {/* User Specialist Profile */}
        <div className="flex items-center space-x-2 pl-2 border-l border-universe-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-accent to-cyan-accent p-0.5">
            <div className="w-full h-full bg-universe-surface rounded-full flex items-center justify-center text-xs font-bold text-white">
              DS
            </div>
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-white">Data Specialist</div>
            <div className="text-[10px] text-mint-accent flex items-center space-x-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Full Analytics Perms</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
