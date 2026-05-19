import VitalsChart         from './VitalsChart';
import LiveMap             from './LiveMap';
import { usePatientVitals } from '@/hooks/usePatientVital';
import { Activity, AlertTriangle } from 'lucide-react';

interface Props {
  patientId:   string;
  patientName: string;
  onBack?:     () => void;
  backLabel?:  string;
}

const STATUS_META = {
  connecting: { cls: 'bg-status-inactive/10 border-status-inactive/30 text-status-inactive', label: 'Connecting…' },
  live:       { cls: 'bg-status-stable/10   border-status-stable/30   text-status-stable',   label: 'Live'        },
  error:      { cls: 'bg-status-critical/10 border-status-critical/25 text-status-critical', label: 'Error'       },
  closed:     { cls: 'bg-border/50 border-border text-text-muted',                           label: 'Disconnected' },
};

export default function PatientVitalsView({
  patientId, patientName, onBack, backLabel = '← Back',
}: Props) {
  const { vitals, latest, loading, error, status } = usePatientVitals(patientId);
  const meta = STATUS_META[status];

  const hasAlerts = latest != null && (
    (latest.heart_rate  != null && (latest.heart_rate  > 100 || latest.heart_rate  < 50)) ||
    (latest.spo2        != null &&  latest.spo2        < 94)                               ||
    (latest.temperature != null && (latest.temperature > 38.5 || latest.temperature < 35))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {onBack && (
            <button onClick={onBack}
              className="text-xs font-mono text-text-muted hover:text-text-secondary
                transition-colors mb-2 block">
              {backLabel}
            </button>
          )}
          <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">
            {patientName}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Real-time vital signs monitoring</p>
        </div>
        <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-1.5
          text-xs font-mono font-semibold ${meta.cls}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current vital-pulse" />
          {meta.label}
        </div>
      </div>

      {/* Alert banner */}
      {hasAlerts && (
        <div className="flex items-center gap-2.5 bg-status-warning/10 border border-status-warning/30
          rounded-xl px-4 py-3 text-sm font-semibold text-status-warning warning-glow">
          <AlertTriangle size={15} />
          One or more vitals are outside the normal range
        </div>
      )}

      {loading && (
        <div className="bg-bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-sm font-mono text-text-muted">Loading patient history…</p>
        </div>
      )}

      {error && (
        <div className="bg-status-critical/5 border border-status-critical/20 rounded-xl p-4">
          <p className="text-sm font-mono text-status-critical">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Heart Rate',   val: latest?.heart_rate,  unit: 'bpm', warn: (v: number) => v > 100 || v < 50, color: 'text-status-critical' },
              { label: 'SpO₂',        val: latest?.spo2,         unit: '%',   warn: (v: number) => v < 94,             color: 'text-accent-cyan'     },
              { label: 'Temperature', val: latest?.temperature,  unit: '°C',  warn: (v: number) => v > 38.5 || v < 35, color: 'text-status-warning'  },
            ].map(({ label, val, unit, warn, color }) => {
              const isWarn = val != null && warn(val);
              return (
                <div key={label}
                  className={`bg-bg-surface border rounded-xl p-3 transition-all duration-300
                    ${isWarn ? 'border-status-warning/40 warning-glow' : 'border-border'}`}>
                  <p className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest">
                    {label}
                  </p>
                  <p className={`font-display text-xl font-700 mt-0.5 ${isWarn ? 'text-status-warning' : color}`}>
                    {val != null ? `${Math.round(val * 10) / 10}` : '—'}
                  </p>
                  <p className="text-[10px] font-mono text-text-muted">{unit}</p>
                </div>
              );
            })}

            <div className="bg-bg-surface border border-border rounded-xl p-3">
              <p className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest">Last Reading</p>
              <p className="font-display text-base font-700 text-text-primary mt-0.5">
                {latest
                  ? new Date(latest.recorded_at).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })
                  : '—'}
              </p>
            </div>

            <div className="bg-bg-surface border border-border rounded-xl p-3">
              <p className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest">Total Readings</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Activity size={12} className="text-accent-cyan" />
                <p className="font-display text-xl font-700 text-text-primary">{vitals.length}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div>
            <h2 className="text-sm font-semibold text-text-secondary mb-3">Vital Signs History</h2>
            <VitalsChart vitals={vitals} />
          </div>

          {/* Map */}
          <div>
            <h2 className="text-sm font-semibold text-text-secondary mb-3">Patient Location</h2>
            <LiveMap
              latitude={latest?.latitude ?? null}
              longitude={latest?.longitude ?? null}
              patientName={patientName}
            />
          </div>
        </>
      )}
    </div>
  );
}