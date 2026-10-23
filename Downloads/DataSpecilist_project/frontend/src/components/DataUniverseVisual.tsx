import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, ArrowRight, ShieldAlert, CheckCircle,
  AlertTriangle, Play, ExternalLink
} from 'lucide-react';
import { PipelineStage } from '../types';

interface DataUniverseVisualProps {
  stages: PipelineStage[];
  onTriggerRun?: (stageId: string) => void;
}

export const DataUniverseVisual: React.FC<DataUniverseVisualProps> = ({ stages }) => {
  const navigate = useNavigate();
  const [hoveredStage, setHoveredStage] = useState<PipelineStage | null>(null);

  const getStageRoute = (id: string) => {
    switch (id) {
      case 'source': return '/sources';
      case 'ingestion': return '/sources';
      case 'validation': return '/quality';
      case 'reconciliation': return '/reconciliation';
      case 'reporting': return '/reports';
      case 'insights': return '/insights';
      default: return '/overview';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'HEALTHY':
      case 'SUCCESS':
        return {
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)] border-mint-accent/60',
          badge: 'bg-mint-accent/15 text-mint-accent border-mint-accent/30',
          icon: CheckCircle,
          iconColor: 'text-mint-accent',
          lineColor: '#10B981'
        };
      case 'WARNING':
        return {
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)] border-amber-accent/60',
          badge: 'bg-amber-accent/15 text-amber-accent border-amber-accent/30',
          icon: AlertTriangle,
          iconColor: 'text-amber-accent',
          lineColor: '#F59E0B'
        };
      case 'FAILED':
        return {
          glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)] border-coral-accent/60',
          badge: 'bg-coral-accent/15 text-coral-accent border-coral-accent/30',
          icon: ShieldAlert,
          iconColor: 'text-coral-accent',
          lineColor: '#F43F5E'
        };
      default:
        return {
          glow: 'shadow-none border-universe-border',
          badge: 'bg-universe-card text-universe-dim border-universe-border',
          icon: Play,
          iconColor: 'text-universe-dim',
          lineColor: '#1E293B'
        };
    }
  };

  return (
    <div className="relative glass-panel rounded-2xl p-6 overflow-hidden border border-universe-border bg-gradient-to-b from-universe-surface/90 to-universe-bg">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-32 bg-cyan-accent/10 blur-[100px] pointer-events-none rounded-full"></div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-32 bg-violet-accent/10 blur-[100px] pointer-events-none rounded-full"></div>

      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-universe-border/50 relative z-10 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-accent animate-ping"></span>
            <h3 className="font-display font-bold text-lg text-white tracking-wide">
              LUMINOUS DATA UNIVERSE PIPELINE
            </h3>
          </div>
          <p className="text-xs text-universe-muted mt-0.5">
            End-to-end verified lineage: Ingestion → Quality Profiling → Cross-System Reconciliation → BI Publishing
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-universe-dim">
            <span className="w-2.5 h-2.5 rounded-full bg-mint-accent"></span>
            <span>Verified</span>
          </div>
          <div className="flex items-center space-x-1.5 text-universe-dim">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-accent"></span>
            <span>Needs Review</span>
          </div>
          <div className="flex items-center space-x-1.5 text-universe-dim">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-accent"></span>
            <span>Live Flow</span>
          </div>
        </div>
      </div>

      {/* Pipeline Stage Nodes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
        {stages.map((stage, idx) => {
          const style = getStatusStyle(stage.status);
          const StatusIcon = style.icon;
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage.id} className="relative group">
              <button
                onClick={() => navigate(getStageRoute(stage.id))}
                onMouseEnter={() => setHoveredStage(stage)}
                onMouseLeave={() => setHoveredStage(null)}
                className={`w-full text-left p-4 rounded-xl bg-universe-card/90 border transition-all duration-300 relative ${style.glow} hover:scale-[1.02] hover:border-cyan-accent/80 cursor-pointer`}
              >
                {/* Station Order & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-universe-dim px-1.5 py-0.5 rounded bg-universe-bg border border-universe-border">
                    STAGE 0{stage.order}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${style.badge}`}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    <span>{stage.status}</span>
                  </span>
                </div>

                {/* Stage Title */}
                <div className="font-display font-bold text-sm text-white group-hover:text-cyan-accent transition-colors flex items-center justify-between">
                  <span>{stage.name}</span>
                  <ExternalLink className="w-3 h-3 text-universe-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Primary Metric */}
                <div className="mt-2 text-xs font-semibold text-cyan-accent font-mono truncate">
                  {stage.metric}
                </div>

                {/* Detail Description */}
                <div className="mt-1 text-[11px] text-universe-muted leading-relaxed line-clamp-2">
                  {stage.detail}
                </div>
              </button>

              {/* Connecting Flow Arrow for Desktop */}
              {!isLast && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="w-6 h-6 rounded-full bg-universe-card border border-universe-border flex items-center justify-center text-cyan-accent shadow-sm">
                    <ArrowRight className="w-3 h-3 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage Detail Drawer Footer on Hover */}
      {hoveredStage && (
        <div className="mt-4 pt-3 border-t border-universe-border/40 flex items-center justify-between text-xs text-universe-muted bg-universe-card/40 rounded-lg px-4 py-2 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-accent font-semibold">{hoveredStage.name}:</span>
            <span>{hoveredStage.detail}</span>
          </div>
          <div className="text-cyan-accent flex items-center space-x-1 font-mono">
            <span>Click node to open workspace</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );
};
