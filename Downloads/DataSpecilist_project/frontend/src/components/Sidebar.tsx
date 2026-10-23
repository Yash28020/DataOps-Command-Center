import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity, Database, ShieldCheck, GitCompare,
  Terminal, FileSpreadsheet, BarChart3, Cpu,
  Sparkles, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const NAV_ITEMS = [
  { path: '/overview', label: 'Command Center', icon: Activity, badge: 'Live' },
  { path: '/sources', label: 'Data Sources', icon: Database },
  { path: '/quality', label: 'Data Quality Studio', icon: ShieldCheck },
  { path: '/reconciliation', label: 'Reconciliation Lab', icon: GitCompare },
  { path: '/sql', label: 'SQL Intelligence', icon: Terminal },
  { path: '/reports', label: 'Excel Reporting', icon: FileSpreadsheet, badge: 'XLSX' },
  { path: '/bi-workspace', label: 'BI Workspace', icon: BarChart3, badge: 'PBI/TAB' },
  { path: '/operations', label: 'Audit & Operations', icon: Cpu },
  { path: '/insights', label: 'Business Insights', icon: Sparkles },
  { path: '/settings', label: 'Settings & Docs', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  return (
    <aside
      className={`h-[calc(100vh-4rem)] bg-universe-bg border-r border-universe-border flex flex-col justify-between transition-all duration-300 z-30 sticky top-16 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-universe-dim font-bold">
          {!collapsed ? 'Enterprise Modules' : 'Apps'}
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-accent/15 to-transparent text-cyan-accent border-l-2 border-cyan-accent shadow-sm shadow-cyan-accent/10'
                    : 'text-universe-muted hover:text-white hover:bg-universe-surface'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-universe-card border border-universe-border text-universe-dim">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Collapse Toggle */}
      <div className="p-3 border-t border-universe-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-universe-surface hover:bg-universe-hover text-universe-dim hover:text-white transition text-xs"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <div className="flex items-center space-x-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
