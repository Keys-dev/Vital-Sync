import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Activity, Thermometer, AlertTriangle, Users, Wifi, ChevronRight } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { useAlertsContext } from '@/contexts/AlertsContext';
import { statusBg, isVitalAbnormal, timeAgo } from '@/services/vitals';
import type { Patient } from '@/types';

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className={`bg-bg-surface border rounded-xl p-4 flex flex-col gap-1 ${color}`}>
      <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">{label}</span>
      <span className="text-3xl font-display font-700">{value}</span>
      {sub && <span className="text-xs text-text-muted">{sub}</span>}
    </div>
  );
}

function VitalChip({ label, value, state }: { label: string; value: string; state: 'critical' | 'warning' | 'normal' }) {
  const colors = {
    critical: 'text-status-critical bg-red-500/10 border-red-500/30',
    warning: 'text-status-warning bg-yellow-500/10 border-yellow-500/30',
    normal: 'text-status-stable bg-teal-500/10 border-teal-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono ${colors[state]}`}>
      {state !== 'normal' && <span className="w-1 h-1 rounded-full bg-current vital-pulse" />}
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function PatientRow({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const hrState = isVitalAbnormal('heartRate', patient.vitals.heartRate);
  const tempState = isVitalAbnormal('temperature', patient.vitals.temperature);
  const bpState = isVitalAbnormal('systolicBP', patient.vitals.systolicBP);

  return (
    <div
      onClick={onClick}
      className={`
        flex flex-wrap md:flex-nowrap items-center gap-3 p-4 rounded-xl border cursor-pointer
        bg-bg-surface hover:bg-bg-elevated transition-all duration-200 group
        ${patient.status === 'critical' ? 'critical-glow' : patient.status === 'warning' ? 'warning-glow' : 'border-border'}
      `}
    >
      {/* Status + name */}
      <div className="flex items-center gap-3 w-full md:w-48 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          patient.status === 'critical' ? 'bg-status-critical vital-pulse' :
          patient.status === 'warning' ? 'bg-status-warning vital-pulse' :
          'bg-status-stable'
        }`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{patient.name}</p>
          <p className="text-[10px] font-mono text-text-muted">{patient.bedNumber}</p>
        </div>
      </div>

      {/* Status badge */}
      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0 ${statusBg(patient.status)}`}>
        {patient.status}
      </span>

      {/* Vitals chips */}
      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
        <VitalChip label="HR" value={`${patient.vitals.heartRate}`} state={hrState} />
        <VitalChip label="Temp" value={`${patient.vitals.temperature}°C`} state={tempState} />
        <VitalChip label="BP" value={`${patient.vitals.systolicBP}/${patient.vitals.diastolicBP}`} state={bpState} />
      </div>

      {/* Doctor + arrow */}
      <div className="hidden lg:block text-right flex-shrink-0">
        <p className="text-xs text-text-muted truncate max-w-[120px]">{patient.doctorAssigned}</p>
        <p className="text-[10px] font-mono text-text-muted">{timeAgo(patient.vitals.timestamp)}</p>
      </div>
      <ChevronRight size={14} className="text-text-muted group-hover:text-accent-cyan transition-colors flex-shrink-0 hidden md:block" />
    </div>
  );
}

export default function Dashboard() {
  const { patients, stats, isLive } = usePatients();
  const { unacknowledged } = useAlertsContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'stable'>('all');

  const filtered = filter === 'all' ? patients : patients.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Patients" value={stats.totalPatients} color="border-border text-text-primary" />
        <StatCard label="Critical" value={stats.criticalPatients} color="border-red-500/30 text-status-critical" sub="Immediate attention" />
        <StatCard label="Warning" value={stats.warningPatients} color="border-yellow-500/30 text-status-warning" sub="Monitor closely" />
        <StatCard label="Stable" value={stats.stablePatients} color="border-teal-500/30 text-status-stable" sub="All clear" />
        <StatCard label="Active Alerts" value={unacknowledged.length} color="border-red-500/20 text-status-critical" sub="Unacknowledged" />
        <StatCard label="Devices Online" value={`${stats.devicesOnline}/${stats.totalPatients}`} color="border-border text-accent-cyan" sub={isLive ? 'MQTT connected' : 'Offline'} />
      </div>

      {/* Quick vital icons legend */}
      <div className="flex flex-wrap gap-4 text-xs text-text-muted font-mono bg-bg-surface border border-border rounded-xl px-4 py-3">
        {[
          { icon: Heart, label: 'Heart Rate', color: 'text-red-400' },
          { icon: Thermometer, label: 'Temperature', color: 'text-orange-400' },
          { icon: Activity, label: 'Blood Pressure', color: 'text-purple-400' },
          { icon: Wifi, label: isLive ? 'Live via MQTT' : 'Simulated', color: isLive ? 'text-status-stable' : 'text-status-inactive' },
        ].map(({ icon: Icon, label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <Icon size={12} className={color} />
            {label}
          </span>
        ))}
      </div>

      {/* Patient table */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Header + filters */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 flex-1">
            <Users size={16} className="text-accent-cyan" />
            <h3 className="font-display font-700 text-sm text-text-primary">Patient Monitor</h3>
            <span className="text-[10px] font-mono text-text-muted bg-bg-elevated border border-border px-2 py-0.5 rounded">
              {filtered.length} shown
            </span>
          </div>
          <div className="flex gap-1">
            {(['all', 'critical', 'warning', 'stable'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                    : 'text-text-muted hover:text-text-primary border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50 p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">No patients match this filter</div>
          ) : (
            filtered.map((p) => (
              <PatientRow key={p.id} patient={p} onClick={() => navigate('/patients')} />
            ))
          )}
        </div>

        {/* Unacknowledged alerts banner */}
        {unacknowledged.length > 0 && (
          <div
            className="flex items-center gap-3 px-5 py-3 bg-red-500/5 border-t border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors"
            onClick={() => navigate('/alerts')}
          >
            <AlertTriangle size={14} className="text-status-critical vital-pulse" />
            <span className="text-xs text-status-critical font-mono font-semibold">
              {unacknowledged.length} unacknowledged alert{unacknowledged.length !== 1 ? 's' : ''} — click to review
            </span>
            <ChevronRight size={12} className="text-status-critical ml-auto" />
          </div>
        )}
      </div>
    </div>
  );
}