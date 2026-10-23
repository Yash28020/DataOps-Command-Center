import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  accentColor?: 'cyan' | 'violet' | 'mint' | 'amber' | 'coral';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral',
  accentColor = 'cyan',
  onClick,
}) => {
  const getAccentStyles = () => {
    switch (accentColor) {
      case 'violet':
        return {
          iconBg: 'bg-violet-accent/15 text-violet-accent border-violet-accent/30',
          hoverBorder: 'hover:border-violet-accent/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(155,124,255,0.15)]',
          valColor: 'text-white'
        };
      case 'mint':
        return {
          iconBg: 'bg-mint-accent/15 text-mint-accent border-mint-accent/30',
          hoverBorder: 'hover:border-mint-accent/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
          valColor: 'text-mint-accent'
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-accent/15 text-amber-accent border-amber-accent/30',
          hoverBorder: 'hover:border-amber-accent/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
          valColor: 'text-amber-accent'
        };
      case 'coral':
        return {
          iconBg: 'bg-coral-accent/15 text-coral-accent border-coral-accent/30',
          hoverBorder: 'hover:border-coral-accent/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
          valColor: 'text-coral-accent'
        };
      case 'cyan':
      default:
        return {
          iconBg: 'bg-cyan-accent/15 text-cyan-accent border-cyan-accent/30',
          hoverBorder: 'hover:border-cyan-accent/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(66,232,245,0.15)]',
          valColor: 'text-cyan-accent'
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 relative overflow-hidden group cursor-pointer transition-all duration-200 ${styles.hoverBorder} ${styles.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-universe-muted font-semibold">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${styles.iconBg} transition-transform group-hover:scale-110`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className={`text-2xl font-display font-bold tracking-tight ${styles.valColor}`}>
          {value}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-universe-dim flex items-center space-x-1.5 truncate">
            {trend && (
              <span className={`inline-flex items-center font-mono font-semibold ${
                trendType === 'positive' ? 'text-mint-accent' :
                trendType === 'negative' ? 'text-coral-accent' : 'text-universe-muted'
              }`}>
                {trendType === 'positive' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {trend}
              </span>
            )}
            <span className="truncate">{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
};
