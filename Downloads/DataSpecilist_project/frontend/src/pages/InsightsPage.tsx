import React, { useState, useEffect } from 'react';
import {
  Sparkles, DollarSign, TrendingUp, AlertTriangle,
  CheckCircle2, ArrowRight, ShieldCheck, Compass, BarChart2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../api/client';
import { InsightsResponse } from '../types';

export const InsightsPage: React.FC = () => {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const res = await api.getBusinessInsights();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight flex items-center space-x-2">
            <span>Executive Business Findings & Recommendations</span>
            <span className="text-xs font-mono font-normal text-cyan-accent px-2 py-0.5 rounded bg-cyan-accent/10 border border-cyan-accent/20">
              Data-Driven Intelligence
            </span>
          </h1>
          <p className="text-xs text-universe-muted mt-1">
            Quantified financial exposure, department error concentrations, trend velocities, and prescriptive recommendations.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-universe-surface border border-universe-border text-universe-dim">
            Reporting Period: <strong className="text-white">{data?.reporting_period || 'Q4 2026'}</strong>
          </span>
        </div>
      </div>

      {/* Top Level Summary Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl glass-card bg-gradient-to-r from-cyan-accent/10 via-universe-card to-universe-surface border border-cyan-accent/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase text-universe-muted">Total Monitored Enterprise Revenue</div>
            <div className="text-3xl font-display font-bold text-white mt-1">
              ${data?.total_volume ? data.total_volume.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-universe-muted mt-1">Across 3 monthly operational batches (Oct - Dec 2026)</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-accent/15 border border-cyan-accent/30 text-cyan-accent">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card bg-gradient-to-r from-coral-accent/10 via-universe-card to-universe-surface border border-coral-accent/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase text-universe-muted">Financial Exposure from Defective Data</div>
            <div className="text-3xl font-display font-bold text-coral-accent mt-1">
              ${data?.net_leakage_detected ? data.net_leakage_detected.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-universe-muted mt-1">Transactions flagged with critical validation anomalies</p>
          </div>
          <div className="p-3 rounded-xl bg-coral-accent/15 border border-coral-accent/30 text-coral-accent">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Detailed Actionable Insights Feed */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-universe-border">
          <h3 className="font-display font-bold text-sm text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-accent" />
            <span>Prescriptive Business Findings</span>
          </h3>
          <span className="text-xs font-mono text-cyan-accent">{data?.insights.length || 0} Findings Identified</span>
        </div>

        <div className="space-y-4">
          {data?.insights.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-universe-surface border border-universe-border hover:border-cyan-accent/40 transition space-y-3"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    item.severity === 'CRITICAL' ? 'bg-coral-accent/15 text-coral-accent border border-coral-accent/30' :
                    item.severity === 'WARNING' ? 'bg-amber-accent/15 text-amber-accent border border-amber-accent/30' :
                    'bg-mint-accent/15 text-mint-accent border border-mint-accent/30'
                  }`}>
                    {item.category}
                  </span>
                  <h4 className="font-semibold text-sm text-white">{item.title}</h4>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-accent bg-universe-card px-2.5 py-1 rounded border border-universe-border">
                  Impact: {item.metric_value}
                </span>
              </div>

              {/* Observation Text */}
              <div className="text-xs text-universe-text leading-relaxed">
                <strong className="text-universe-muted">Empirical Observation: </strong>
                {item.observation}
              </div>

              {/* Action Recommendation */}
              <div className="p-3 rounded-lg bg-universe-card/80 border border-universe-border/60 flex items-start space-x-2 text-xs">
                <Compass className="w-4 h-4 text-cyan-accent flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-accent font-mono uppercase text-[10px]">Recommended Action: </strong>
                  <span className="text-white">{item.action_recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column: Department Error Rates & Monthly Trend Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-display font-bold text-sm text-white">Department Error Rate Concentration</h3>
          <p className="text-xs text-universe-muted">Error rates and defective record volumes across enterprise divisions</p>

          <div className="overflow-x-auto border border-universe-border rounded-xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-universe-surface text-universe-dim font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Department</th>
                  <th className="p-2.5">Transactions</th>
                  <th className="p-2.5">Revenue</th>
                  <th className="p-2.5">Defects</th>
                  <th className="p-2.5 text-right">Error Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-universe-border text-universe-text">
                {data?.department_breakdown.map((d) => (
                  <tr key={d.department} className="hover:bg-universe-surface/40">
                    <td className="p-2.5 font-semibold text-white">{d.department}</td>
                    <td className="p-2.5 font-mono text-universe-muted">{d.transaction_count}</td>
                    <td className="p-2.5 font-mono">${d.total_revenue.toLocaleString()}</td>
                    <td className="p-2.5 font-mono text-coral-accent">{d.defect_count}</td>
                    <td className="p-2.5 font-mono text-right font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        d.error_rate > 10 ? 'bg-coral-accent/15 text-coral-accent' :
                        d.error_rate > 5 ? 'bg-amber-accent/15 text-amber-accent' : 'text-mint-accent'
                      }`}>
                        {d.error_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trend Velocity Chart */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-white">Data Quality & Reconciliation Velocity</h3>
            <span className="text-xs font-mono text-cyan-accent">3-Month Trend</span>
          </div>
          <p className="text-xs text-universe-muted">Progression of pass rates and reconciliation rates over successive batches</p>

          <div className="h-56 w-full pt-2">
            {data?.trend_analysis && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend_analysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis domain={[90, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101728', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="dq_pass_rate" name="DQ Pass Rate %" stroke="#42E8F5" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="recon_rate" name="Reconciliation Rate %" stroke="#9B7CFF" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
