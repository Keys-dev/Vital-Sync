import { useState } from 'react';
import { Search, User, Heart, Thermometer, Activity, ChevronDown, ChevronUp, X } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { statusBg, isVitalAbnormal, timeAgo } from '@/services/vitals';
import { getAlertsByPatient, getTimelineByPatient } from '@/data/alerts';
import type { Patient } from '@/types';

function VitalRow({ label, value, unit, state }: { label: string; value: number; unit: string; state: 'critical' | 'warning' | 'normal' }) {
  const bar = { critical: 'bg-status-critical', warning: 'bg-status-warning', normal: 'bg-status-stable' };
  const text = { critical: 'text-status-critical', warning: 'text-status-warning', normal: 'text-status-stable' };
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-bg-base rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bar[state]}`} style={{ width: `${Math.min(100, (value / 200) * 100)}%` }} />
      </div>
      <span className={`text-xs font-mono font-semibold w-20 text-right ${text[state]}`}>{value} {unit}</span>
    </div>
  );
}

function PatientModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const patientAlerts = getAlertsByPatient(patient.id);
  const patientTimeline = getTimelineByPatient(patient.id);

  const vitals = [
    { label: 'Heart Rate', key: 'heartRate' as const, value: patient.vitals.heartRate, unit: 'bpm' },
    { label: 'Temperature', key: 'temperature' as const, value: patient.vitals.temperature, unit: '°C' },
    { label: 'Systolic BP', key: 'systolicBP' as const, value: patient.vitals.systolicBP, unit: 'mmHg' },
    { label: 'Diastolic BP', key: 'diastolicBP' as const, value: patient.vitals.diastolicBP, unit: 'mmHg' },
  ];

  const typeIcons: Record<string, string> = {
    admission: '🏥', discharge: '🚪', alert: '⚠️', medication: '💊', checkup: '🩺', procedure: '⚕️',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-16 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b border-border flex items-start justify-between ${patient.status === 'critical' ? 'bg-red-500/5' : patient.status === 'warning' ? 'bg-yellow-500/5' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
              <User size={22} className="text-accent-cyan" />
            </div>
            <div>
              <h3 className="font-display font-700 text-lg text-text-primary">{patient.name}</h3>
              <p className="text-xs text-text-muted font-mono">{patient.id} · {patient.age}y · {patient.gender} · {patient.bloodType}</p>
              <span className={`inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusBg(patient.status)}`}>
                {patient.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Bed', patient.bedNumber],
              ['Diagnosis', patient.diagnosis], ['Doctor', patient.doctorAssigned],
              ['Admitted', patient.admissionDate], ['Device', patient.deviceId],
              ['Emergency Contact', patient.emergencyContact],
            ].map(([label, val]) => (
              <div key={label} className="bg-bg-elevated border border-border rounded-lg p-3">
                <p className="text-text-muted font-mono mb-0.5">{label}</p>
                <p className="text-text-primary font-medium">{val}</p>
              </div>
            ))}
          </div>

          {/* Vitals */}
          <div className="bg-bg-elevated border border-border rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-3">Current Vitals · {timeAgo(patient.vitals.timestamp)}</h4>
            {vitals.map(({ label, key, value, unit }) => (
              <VitalRow key={key} label={label} value={value} unit={unit} state={isVitalAbnormal(key, value)} />
            ))}
          </div>

          {/* Alerts */}
          {patientAlerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted">Alerts ({patientAlerts.length})</h4>
              {patientAlerts.slice(0, 3).map((a) => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border text-xs ${a.severity === 'critical' ? 'bg-red-500/5 border-red-500/20 text-status-critical' : 'bg-yellow-500/5 border-yellow-500/20 text-status-warning'}`}>
                  <span className="font-mono font-bold uppercase">{a.severity}</span>
                  <span className="text-text-secondary flex-1">{a.message}</span>
                  <span className="font-mono text-text-muted">{a.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          {patientTimeline.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted">Timeline</h4>
              <div className="space-y-2">
                {patientTimeline.map((e) => (
                  <div key={e.id} className="flex gap-3 text-xs">
                    <span className="text-base leading-none mt-0.5">{typeIcons[e.type]}</span>
                    <div className="flex-1 border-l border-border pl-3 pb-3">
                      <p className="text-text-primary">{e.description}</p>
                      <p className="text-text-muted font-mono mt-0.5">{timeAgo(e.timestamp)} {e.performedBy ? `· ${e.performedBy}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const icons = [Heart, Thermometer, Activity];
  const vitals = [
    { key: 'heartRate' as const, value: patient.vitals.heartRate, label: 'bpm' },
    { key: 'temperature' as const, value: patient.vitals.temperature, label: '°C' },
    { key: 'systolicBP' as const, value: patient.vitals.systolicBP, label: 'mmHg' },
  ];

  return (
    <div
      onClick={onClick}
      className={`
        bg-bg-surface border rounded-xl p-4 cursor-pointer hover:bg-bg-elevated transition-all duration-200
        ${patient.status === 'critical' ? 'critical-glow border-red-500/30' : patient.status === 'warning' ? 'warning-glow border-yellow-500/30' : 'border-border'}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-xs font-bold text-accent-cyan font-mono">
            {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary leading-tight">{patient.name}</p>
            <p className="text-[10px] text-text-muted font-mono">{patient.age}y · {patient.gender}</p>
          </div>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${statusBg(patient.status)}`}>
          {patient.status}
        </span>
      </div>

      <p className="text-xs text-text-muted mb-3 truncate">{patient.diagnosis}</p>

      <div className="grid grid-cols-5 gap-1">
        {vitals.map(({ key, value, label }, i) => {
          const Icon = icons[i];
          const state = isVitalAbnormal(key, value);
          const textColor = state === 'critical' ? 'text-status-critical' : state === 'warning' ? 'text-status-warning' : 'text-status-stable';
          return (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <Icon size={11} className={textColor} />
              <span className={`text-[10px] font-mono font-semibold ${textColor}`}>{value}</span>
              <span className="text-[8px] text-text-muted">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex justify-between text-[10px] font-mono text-text-muted">
        <span>{patient.bedNumber}</span>
        <span>{timeAgo(patient.vitals.timestamp)}</span>
      </div>
    </div>
  );
}

export default function PatientList() {
  const { patients } = usePatients();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'status' | 'name'>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const statusOrder = { critical: 0, warning: 1, stable: 2, inactive: 3 };

  const filtered = patients
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.diagnosis.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sort === 'status') cmp = statusOrder[a.status] - statusOrder[b.status];
      if (sort === 'name') cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (key: typeof sort) => {
    if (sort === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setSortDir('asc'); }
  };

  const SortIcon = sortDir === 'asc' ? ChevronUp : ChevronDown;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-bg-surface border border-border rounded-xl px-3 py-2.5 flex-1 min-w-48 focus-within:border-accent-cyan/50 transition-colors">
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, ID, diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-text-primary placeholder-text-muted outline-none w-full"
          />
        </div>

        {/* Sort */}
        <div className="flex gap-1">
          {(['status', 'name'] as const).map((s) => (
            <button
              key={s}
              onClick={() => toggleSort(s)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-mono capitalize transition-all ${sort === s ? 'bg-bg-elevated border-border-bright text-text-primary' : 'border-border text-text-muted hover:text-text-primary'}`}
            >
              {s}
              {sort === s && <SortIcon size={10} />}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-text-muted">{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-1">
          {(['grid', 'list'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-2 py-1 rounded text-xs font-mono capitalize ${view === v ? 'text-accent-cyan' : 'text-text-muted'}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Grid / List */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => <PatientCard key={p.id} patient={p} onClick={() => setSelected(p)} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              className={`flex items-center gap-4 p-4 bg-bg-surface border rounded-xl cursor-pointer hover:bg-bg-elevated transition-all ${p.status === 'critical' ? 'critical-glow border-red-500/30' : p.status === 'warning' ? 'warning-glow border-yellow-500/30' : 'border-border'}`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'critical' ? 'bg-status-critical vital-pulse' : p.status === 'warning' ? 'bg-status-warning vital-pulse' : 'bg-status-stable'}`} />
              <div className="w-36 flex-shrink-0">
                <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                <p className="text-[10px] font-mono text-text-muted">{p.id} · {p.age}y</p>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex-shrink-0 ${statusBg(p.status)}`}>{p.status}</span>
              <p className="text-xs text-text-muted flex-1 truncate">{p.diagnosis}</p>
              <p className="text-xs text-text-muted hidden md:block">{p.bedNumber}</p>
              <p className="text-xs font-mono text-text-muted hidden lg:block">{p.doctorAssigned}</p>
              <div className="flex gap-3 text-xs font-mono text-text-secondary">
                <span className={isVitalAbnormal('heartRate', p.vitals.heartRate) !== 'normal' ? 'text-status-critical' : ''}>{p.vitals.heartRate} bpm</span>
                
                <span>{p.vitals.temperature}°C</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-text-muted text-sm bg-bg-surface border border-border rounded-2xl">
          No patients found for this search/filter.
        </div>
      )}

      {selected && <PatientModal patient={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}