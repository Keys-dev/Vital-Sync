import { useState } from 'react';
import { Bell, BellOff, CheckCheck, AlertTriangle, Info, Filter } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { timeAgo } from '@/services/vitals';
import type { Alert, AlertSeverity } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  heart_rate: 'Heart Rate', temperature: 'Temperature',
  blood_pressure: 'Blood Pressure', device: 'Device', system: 'System',
};

function AlertCard({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: (id: string) => void }) {
  const severityStyles: Record<AlertSeverity, { border: string; bg: string; badge: string; icon: string }> = {
    critical: {
      border: 'border-red-500/40', bg: 'bg-red-500/5',
      badge: 'bg-red-500/20 text-status-critical border-red-500/30',
      icon: 'text-status-critical',
    },
    warning: {
      border: 'border-yellow-500/30', bg: 'bg-yellow-500/5',
      badge: 'bg-yellow-500/15 text-status-warning border-yellow-500/30',
      icon: 'text-status-warning',
    },
    info: {
      border: 'border-accent-cyan/20', bg: 'bg-accent-cyan/5',
      badge: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
      icon: 'text-accent-cyan',
    },
  };

  const s = severityStyles[alert.severity];
  const Icon = alert.severity === 'critical' ? AlertTriangle : alert.severity === 'warning' ? AlertTriangle : Info;

  return (
    <div className={`border rounded-xl p-4 transition-all ${s.border} ${s.bg} ${alert.acknowledged ? 'opacity-50' : ''} ${!alert.acknowledged && alert.severity === 'critical' ? 'critical-glow' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 flex-shrink-0 ${s.icon} ${!alert.acknowledged && alert.severity === 'critical' ? 'vital-pulse' : ''}`}>
          <Icon size={16} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${s.badge}`}>
              {alert.severity}
            </span>
            <span className="text-[10px] font-mono text-text-muted bg-bg-elevated border border-border px-2 py-0.5 rounded">
              {TYPE_LABELS[alert.type] ?? alert.type}
            </span>
            {alert.acknowledged && (
              <span className="text-[10px] font-mono text-status-stable bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                ✓ Acknowledged
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-text-primary">{alert.message}</p>
          <p className="text-xs text-text-muted mt-0.5">{alert.patientName}</p>

          <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono">
            <span className="text-text-muted">Measured: <span className="text-text-secondary">{alert.value}</span></span>
            {alert.threshold !== '—' && (
              <span className="text-text-muted">Threshold: <span className="text-text-secondary">{alert.threshold}</span></span>
            )}
            <span className="text-text-muted">{timeAgo(alert.timestamp)}</span>
          </div>
        </div>

        {/* Action */}
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated border border-border rounded-lg text-xs font-mono text-text-muted hover:text-text-primary hover:border-border-bright transition-all"
          >
            <BellOff size={12} />
            <span className="hidden sm:inline">Ack</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Alerts() {
  const { alerts, unacknowledged, critical, acknowledge, acknowledgeAll } = useAlerts();
  const [filter, setFilter] = useState<'all' | 'unread' | AlertSeverity>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const allTypes = Array.from(new Set(alerts.map((a) => a.type)));

  const filtered = alerts.filter((a) => {
    const matchesSev = filter === 'all' || (filter === 'unread' ? !a.acknowledged : a.severity === filter);
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    return matchesSev && matchesType;
  });

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: alerts.length, color: 'border-border text-text-primary' },
          { label: 'Unacknowledged', value: unacknowledged.length, color: 'border-red-500/30 text-status-critical' },
          { label: 'Critical', value: critical.length, color: 'border-red-500/30 text-status-critical' },
          { label: 'Resolved', value: alerts.filter((a) => a.acknowledged).length, color: 'border-teal-500/30 text-status-stable' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-bg-surface border rounded-xl p-4 ${color}`}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">{label}</p>
            <p className="text-3xl font-display font-700 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Severity filter */}
        <div className="flex gap-1 bg-bg-surface border border-border rounded-xl p-1">
          {(['all', 'unread', 'critical', 'warning', 'info'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition-all ${filter === f ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' : 'text-text-muted hover:text-text-primary'}`}
            >
              {f}
              {f === 'unread' && unacknowledged.length > 0 && (
                <span className="ml-1 text-status-critical font-bold">({unacknowledged.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1">
          <Filter size={12} className="text-text-muted" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text-primary outline-none"
          >
            <option value="all">All types</option>
            {allTypes.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
            ))}
          </select>
        </div>

        {/* Acknowledge all */}
        {unacknowledged.length > 0 && (
          <button
            onClick={acknowledgeAll}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg text-xs font-mono text-status-stable hover:bg-teal-500/15 transition-all"
          >
            <CheckCheck size={13} />
            Acknowledge all ({unacknowledged.length})
          </button>
        )}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm bg-bg-surface border border-border rounded-2xl flex flex-col items-center gap-3">
            <Bell size={32} className="text-text-muted opacity-30" />
            <p>No alerts match this filter</p>
          </div>
        ) : (
          filtered.map((a) => (
            <AlertCard key={a.id} alert={a} onAcknowledge={acknowledge} />
          ))
        )}
      </div>
    </div>
  );
}
