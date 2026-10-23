import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, Clock, User, MessageSquare, Save } from 'lucide-react';
import { DataQualityIssue } from '../types';

interface IssueDrawerProps {
  issue: DataQualityIssue | null;
  onClose: () => void;
  onUpdateStatus: (id: number, status: string, notes: string, assignedTo: string) => Promise<void>;
}

export const IssueDrawer: React.FC<IssueDrawerProps> = ({ issue, onClose, onUpdateStatus }) => {
  if (!issue) return null;

  const [status, setStatus] = useState(issue.status);
  const [assignedTo, setAssignedTo] = useState(issue.assigned_to || 'Data Ops Lead');
  const [notes, setNotes] = useState(issue.resolution_notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateStatus(issue.id, status, notes, assignedTo);
      onClose();
    } catch (err) {
      alert('Failed to save issue status');
    } finally {
      setSaving(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-coral-accent/15 text-coral-accent border-coral-accent/30';
      case 'WARNING':
        return 'bg-amber-accent/15 text-amber-accent border-amber-accent/30';
      default:
        return 'bg-cyan-accent/15 text-cyan-accent border-cyan-accent/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-lg bg-universe-bg border-l border-universe-border h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-universe-border bg-universe-surface flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-universe-card border border-universe-border text-cyan-accent">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Exception Investigation</h3>
              <p className="text-xs font-mono text-universe-dim">{issue.issue_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-universe-hover text-universe-dim hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-universe-surface border border-universe-border">
              <div className="text-[10px] uppercase font-mono text-universe-dim">Severity</div>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityBadge(issue.severity)}`}>
                {issue.severity}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-universe-surface border border-universe-border">
              <div className="text-[10px] uppercase font-mono text-universe-dim">Dimension</div>
              <div className="mt-1 text-xs font-semibold text-white">{issue.dimension}</div>
            </div>
          </div>

          {/* Rule Information */}
          <div className="p-4 rounded-xl bg-universe-surface border border-universe-border space-y-2">
            <div className="text-[11px] uppercase font-mono text-universe-dim">Violated Rule</div>
            <div className="text-sm font-semibold text-white">{issue.rule_name}</div>
            <div className="text-xs font-mono text-cyan-accent">Code: {issue.rule_code}</div>
          </div>

          {/* Record & Failure Breakdown */}
          <div className="p-4 rounded-xl bg-universe-surface border border-universe-border space-y-3">
            <div className="text-[11px] uppercase font-mono text-universe-dim">Affected Record</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-universe-muted">Identifier:</span>
              <span className="font-mono font-semibold text-white">{issue.record_identifier}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-universe-muted">Target Field:</span>
              <span className="font-mono text-cyan-accent">{issue.field_name}</span>
            </div>
            <div className="pt-2 border-t border-universe-border">
              <div className="text-[11px] text-universe-dim mb-1">Captured Value:</div>
              <div className="p-2.5 rounded bg-universe-card border border-universe-border font-mono text-xs text-coral-accent break-all">
                {issue.original_value || 'NULL / EMPTY'}
              </div>
            </div>
            <div className="pt-2 border-t border-universe-border">
              <div className="text-[11px] text-universe-dim mb-1">Failure Reason:</div>
              <div className="text-xs text-universe-text leading-relaxed">
                {issue.failure_reason}
              </div>
            </div>
          </div>

          {/* Remediation & Audit Form */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase font-bold text-universe-dim tracking-wider">
              Remediation Action & Stewardship
            </h4>

            {/* Status Select */}
            <div>
              <label className="block text-xs text-universe-muted mb-1.5">Lifecycle Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-universe-surface border border-universe-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-accent"
              >
                <option value="OPEN">OPEN (Requires Investigation)</option>
                <option value="UNDER_REVIEW">UNDER REVIEW (In Progress)</option>
                <option value="RESOLVED">RESOLVED (Corrected / Verified)</option>
                <option value="SUPPRESSED">SUPPRESSED (Approved Business Exception)</option>
              </select>
            </div>

            {/* Assigned Specialist */}
            <div>
              <label className="block text-xs text-universe-muted mb-1.5 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-universe-dim" />
                <span>Assigned Owner</span>
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Finance Specialist, Data Ops Lead"
                className="w-full bg-universe-surface border border-universe-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-accent"
              />
            </div>

            {/* Resolution Notes */}
            <div>
              <label className="block text-xs text-universe-muted mb-1.5 flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-universe-dim" />
                <span>Audit Trail Notes</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document root cause, remediation steps, or reasons for exception suppression..."
                className="w-full bg-universe-surface border border-universe-border rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-accent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-universe-border bg-universe-surface flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-universe-card hover:bg-universe-hover border border-universe-border text-xs text-universe-muted hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-cyan-accent hover:bg-cyan-bright text-universe-bg font-semibold text-xs shadow-md shadow-cyan-accent/20 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Updating...' : 'Save Resolution'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
