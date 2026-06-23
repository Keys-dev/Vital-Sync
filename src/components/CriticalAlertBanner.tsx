// Persistent in-app banner for unacknowledged critical alerts.
// Sits above all content in Layout, demands attention without
// leaving the app like browser notifications do.

import { useState, useEffect } from 'react';
import { AlertTriangle, X, BellOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAlertsContext } from '@/contexts/AlertsContext';
import type { Alert } from '@/types';

export default function CriticalAlertBanner() {
  const { alerts, acknowledge } = useAlertsContext();
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set());
  const [index, setIndex]           = useState(0);

  // Only show unacknowledged critical alerts that haven't been locally dismissed
  const visible = alerts.filter(
    (a) => a.severity === 'critical' && !a.acknowledged && !dismissed.has(a.id),
  );

  // Reset carousel index when alerts change
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, visible.length - 1)));
  }, [visible.length]);

  if (visible.length === 0) return null;

  const alert: Alert = visible[index];

  const handleAcknowledge = async (id: string) => {
    await acknowledge(id);
  };

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative bg-red-950/90 border-b-2 border-red-500/60 px-4 py-3
        backdrop-blur-sm shadow-[0_4px_32px_rgba(239,68,68,0.25)] z-50"
    >
      {/* Animated left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-status-critical vital-pulse rounded-l" />

      <div className="max-w-6xl mx-auto flex items-center gap-3 pl-3">

        {/* Icon */}
        <div className="flex-shrink-0 text-status-critical vital-pulse">
          <AlertTriangle size={18} />
        </div>

        {/* Badge */}
        <span className="flex-shrink-0 text-[10px] font-mono font-bold uppercase tracking-wider
          px-2 py-0.5 bg-red-500/25 border border-red-500/40 text-status-critical rounded">
          CRITICAL
        </span>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-100 truncate">{alert.message}</p>
          <p className="text-[11px] font-mono text-red-300/80 truncate">
            {alert.patientName}
            {alert.value ? ` · ${alert.value}` : ''}
            {alert.threshold && alert.threshold !== '—' ? ` (threshold: ${alert.threshold})` : ''}
          </p>
        </div>

        {/* Carousel controls — only shown when multiple critical alerts */}
        {visible.length > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIndex((i) => (i - 1 + visible.length) % visible.length)}
              className="p-1 rounded text-red-300 hover:text-white hover:bg-red-500/20 transition-colors"
              aria-label="Previous alert"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-mono text-red-300 min-w-[36px] text-center tabular-nums">
              {index + 1}/{visible.length}
            </span>
            <button
              onClick={() => setIndex((i) => (i + 1) % visible.length)}
              className="p-1 rounded text-red-300 hover:text-white hover:bg-red-500/20 transition-colors"
              aria-label="Next alert"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Acknowledge button */}
        <button
          onClick={() => handleAcknowledge(alert.id)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-mono
            hover:bg-red-500/30 active:scale-95 transition-all"
          aria-label="Acknowledge alert"
        >
          <BellOff size={12} />
          <span className="hidden sm:inline">Acknowledge</span>
        </button>

        {/* Local dismiss (hides from banner only, does NOT write to DB) */}
        <button
          onClick={() => handleDismiss(alert.id)}
          className="flex-shrink-0 p-1.5 rounded-lg text-red-400 hover:text-red-200
            hover:bg-red-500/15 transition-colors"
          aria-label="Dismiss from banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}