import { useState, useEffect } from 'react';
import { AlertTriangle, X, BellOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAlertsContext } from '@/contexts/AlertsContext';
import type { Alert, AlertSeverity } from '@/types';

const SEVERITY_CFG: Record<AlertSeverity, {
  wrapper:  string;
  bar:      string;
  badge:    string;
  text:     string;
  subtext:  string;
  ackBtn:   string;
  dimBtn:   string;
  label:    string;
}> = {
  critical: {
    wrapper: 'bg-red-950/90 border-red-500/60 shadow-[0_4px_32px_rgba(239,68,68,0.25)]',
    bar:     'bg-status-critical',
    badge:   'bg-red-500/25 border-red-500/40 text-status-critical',
    text:    'text-red-100',
    subtext: 'text-red-300/80',
    ackBtn:  'bg-red-500/20 border-red-500/40 text-red-200 hover:bg-red-500/30',
    dimBtn:  'text-red-400 hover:text-red-200 hover:bg-red-500/15',
    label:   'CRITICAL',
  },
  warning: {
    wrapper: 'bg-yellow-950/90 border-yellow-500/50 shadow-[0_4px_32px_rgba(234,179,8,0.2)]',
    bar:     'bg-status-warning',
    badge:   'bg-yellow-500/20 border-yellow-500/40 text-status-warning',
    text:    'text-yellow-100',
    subtext: 'text-yellow-300/80',
    ackBtn:  'bg-yellow-500/20 border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/30',
    dimBtn:  'text-yellow-400 hover:text-yellow-200 hover:bg-yellow-500/15',
    label:   'WARNING',
  },
  info: {
    wrapper: 'bg-cyan-950/80 border-accent-cyan/30 shadow-[0_4px_24px_rgba(34,211,238,0.12)]',
    bar:     'bg-accent-cyan',
    badge:   'bg-accent-cyan/15 border-accent-cyan/30 text-accent-cyan',
    text:    'text-cyan-100',
    subtext: 'text-cyan-300/80',
    ackBtn:  'bg-accent-cyan/15 border-accent-cyan/30 text-cyan-200 hover:bg-accent-cyan/25',
    dimBtn:  'text-cyan-400 hover:text-cyan-200 hover:bg-accent-cyan/15',
    label:   'INFO',
  },
};

export default function CriticalAlertBanner() {
  const { alerts, acknowledge } = useAlertsContext();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [index, setIndex]         = useState(0);

  // Show all unacknowledged alerts (critical first, then warning, then info)
  const visible = alerts
    .filter((a) => !a.acknowledged && !dismissed.has(a.id))
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, visible.length - 1)));
  }, [visible.length]);

  if (visible.length === 0) return null;

  const alert: Alert | undefined = visible[index];
  if (!alert) return null;
  const cfg = SEVERITY_CFG[alert.severity];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative border-b-2 px-4 py-3 backdrop-blur-sm z-50 ${cfg.wrapper}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l vital-pulse ${cfg.bar}`} />

      <div className="max-w-6xl mx-auto flex items-center gap-3 pl-3">

        <div className={`flex-shrink-0 vital-pulse ${cfg.badge.split(' ').find(c => c.startsWith('text-'))}`}>
          <AlertTriangle size={18} />
        </div>

        <span className={`flex-shrink-0 text-[10px] font-mono font-bold uppercase tracking-wider
          px-2 py-0.5 rounded border ${cfg.badge}`}>
          {cfg.label}
        </span>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${cfg.text}`}>{alert.message}</p>
          <p className={`text-[11px] font-mono truncate ${cfg.subtext}`}>
            {alert.patientName}
            {alert.value ? ` · ${alert.value}` : ''}
            {alert.threshold && alert.threshold !== '—' ? ` (threshold: ${alert.threshold})` : ''}
          </p>
        </div>

        {visible.length > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIndex((i) => (i - 1 + visible.length) % visible.length)}
              className={`p-1 rounded transition-colors ${cfg.dimBtn}`}
              aria-label="Previous alert"
            >
              <ChevronLeft size={14} />
            </button>
            <span className={`text-[10px] font-mono min-w-[36px] text-center tabular-nums ${cfg.subtext}`}>
              {index + 1}/{visible.length}
            </span>
            <button
              onClick={() => setIndex((i) => (i + 1) % visible.length)}
              className={`p-1 rounded transition-colors ${cfg.dimBtn}`}
              aria-label="Next alert"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        <button
          onClick={() => acknowledge(alert.id)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            border text-xs font-mono active:scale-95 transition-all ${cfg.ackBtn}`}
        >
          <BellOff size={12} />
          <span className="hidden sm:inline">Acknowledge</span>
        </button>

        <button
          onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${cfg.dimBtn}`}
          aria-label="Dismiss from banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}