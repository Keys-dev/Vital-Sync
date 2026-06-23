// DEV TOOL — manually fire test alerts into Supabase to verify the
// full realtime pipeline: DB insert → Realtime push → banner → sound.
// Add <AlertTestPanel /> to your Settings page during development.
// Remove or hide it before your final submission/demo.

import { useState } from 'react';
import { FlaskConical, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createAlert } from '@/services/alerts';
import type { AlertSeverity, AlertType } from '@/types';

interface TestScenario {
  label:       string;
  severity:    AlertSeverity;
  type:        AlertType;
  message:     string;
  patientName: string;
  value:       string;
  threshold:   string;
}

const SCENARIOS: TestScenario[] = [
  {
    label:       '🔴 Critical — High Heart Rate',
    severity:    'critical',
    type:        'heart_rate',
    message:     'Heart rate critically elevated',
    patientName: 'Test Patient A',
    value:       '142 bpm',
    threshold:   '> 130 bpm',
  },
  {
    label:       '🔴 Critical — High Temperature',
    severity:    'critical',
    type:        'temperature',
    message:     'Temperature dangerously high',
    patientName: 'Test Patient B',
    value:       '39.9 °C',
    threshold:   '> 39.0 °C',
  },
  {
    label:       '🔴 Critical — Blood Pressure Spike',
    severity:    'critical',
    type:        'blood_pressure',
    message:     'Systolic BP critically high',
    patientName: 'Test Patient C',
    value:       '188 / 110 mmHg',
    threshold:   '> 180 mmHg',
  },
  {
    label:       '🟡 Warning — Elevated Heart Rate',
    severity:    'warning',
    type:        'heart_rate',
    message:     'Heart rate above normal range',
    patientName: 'Test Patient D',
    value:       '112 bpm',
    threshold:   '> 100 bpm',
  },
  {
    label:       '🟡 Warning — Low Temperature',
    severity:    'warning',
    type:        'temperature',
    message:     'Temperature below normal range',
    patientName: 'Test Patient E',
    value:       '35.8 °C',
    threshold:   '< 36.0 °C',
  },
  {
    label:       'ℹ️ Info — Device Reconnected',
    severity:    'info',
    type:        'device',
    message:     'IoT sensor node reconnected',
    patientName: 'Test Patient F',
    value:       'Signal restored',
    threshold:   '—',
  },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function AlertTestPanel() {
  const [statuses, setStatuses] = useState<Record<number, Status>>({});
  const [errors,   setErrors]   = useState<Record<number, string>>({});

  const fire = async (scenario: TestScenario, index: number) => {
    setStatuses((s) => ({ ...s, [index]: 'loading' }));
    setErrors((e) => { const n = { ...e }; delete n[index]; return n; });

    try {
      await createAlert({
        patientName: scenario.patientName,
        type:        scenario.type,
        severity:    scenario.severity,
        message:     scenario.message,
        value:       scenario.value,
        threshold:   scenario.threshold,
      });
      setStatuses((s) => ({ ...s, [index]: 'success' }));
      setTimeout(() => setStatuses((s) => ({ ...s, [index]: 'idle' })), 3000);
    } catch (err) {
      setErrors((e) => ({ ...e, [index]: (err as Error).message }));
      setStatuses((s) => ({ ...s, [index]: 'error' }));
      setTimeout(() => setStatuses((s) => ({ ...s, [index]: 'idle' })), 4000);
    }
  };

  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical size={15} className="text-accent-cyan" />
        <h3 className="text-sm font-semibold text-text-primary">Alert Test Panel</h3>
        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded border
          border-yellow-500/30 bg-yellow-500/10 text-yellow-400 uppercase tracking-wider">
          Dev Only
        </span>
      </div>
      <p className="text-xs text-text-muted mb-5 leading-relaxed">
        Fires a real INSERT into Supabase. Your Realtime subscription picks it up
        exactly as the Arduino IoT trigger would — banner, sound, and all.
      </p>

      <div className="space-y-2">
        {SCENARIOS.map((scenario, i) => {
          const status = statuses[i] ?? 'idle';
          const error  = errors[i];

          return (
            <div
              key={i}
              className="flex items-center gap-3 bg-bg-base/60 border border-border
                rounded-xl px-4 py-3"
            >
              <span className="flex-1 text-xs font-mono text-text-secondary">
                {scenario.label}
              </span>

              {error && (
                <span className="text-[10px] font-mono text-status-critical truncate max-w-[160px]">
                  {error}
                </span>
              )}

              <button
                onClick={() => fire(scenario, i)}
                disabled={status === 'loading'}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  text-xs font-mono border transition-all active:scale-95
                  ${status === 'success'
                    ? 'bg-teal-500/10 border-teal-500/20 text-status-stable'
                    : status === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-status-critical'
                    : 'bg-bg-elevated border-border text-text-muted hover:text-text-primary hover:border-border-bright'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {status === 'loading' && <Loader2 size={11} className="animate-spin" />}
                {status === 'success' && <CheckCircle2 size={11} />}
                {status === 'error'   && <XCircle size={11} />}
                {status === 'idle'    && <FlaskConical size={11} />}
                {status === 'loading' ? 'Firing…'
                  : status === 'success' ? 'Fired!'
                  : status === 'error'   ? 'Failed'
                  : 'Fire'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-mono text-text-muted mt-4 text-center">
        Remove this panel before final submission
      </p>
    </div>
  );
}