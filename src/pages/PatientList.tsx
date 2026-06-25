import { useState } from 'react';
import {
  Search, User, Heart, Thermometer, Activity,
  ChevronDown, ChevronUp, X, Plus, Pencil, LogOut,
  AlertTriangle, Loader2,
} from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { useAssignedPatients } from '@/hooks/useDoctorData';
import { usePatientManagement, type PatientFormData } from '@/hooks/usePatientManagement';
import { statusBg, isVitalAbnormal, timeAgo } from '@/services/vitals';
import { getAlertsByPatient, getTimelineByPatient } from '@/data/alerts';
import type { Patient, PatientGender } from '@/types';

// ─── Shared field wrapper ──────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-text-muted uppercase tracking-wide block mb-1">
        {label} {required && <span className="text-status-critical">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-bg-base border border-border rounded-lg px-3 py-2 ' +
  'text-sm text-text-primary placeholder:text-text-muted ' +
  'focus:outline-none focus:border-accent-cyan transition-colors';

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

// ─── Add / Edit modal ──────────────────────────────────────────────────────────

function PatientFormModal({
  mode, initial, onClose, onSave,
}: {
  mode: 'add' | 'edit';
  initial?: Partial<PatientFormData>;
  onClose: () => void;
  onSave: (form: PatientFormData) => Promise<void>;
}) {
  const blank: PatientFormData = {
    full_name:         '',
    date_of_birth:     '',
    gender:            'Male',
    blood_type:        'O+',
    diagnosis:         '',
    bed_number:        '',
    emergency_contact: '',
  };

  const [form, setForm]     = useState<PatientFormData>({ ...blank, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (k: keyof PatientFormData, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.full_name.trim()) { setError('Full name is required'); return; }
    if (!form.date_of_birth)    { setError('Date of birth is required'); return; }
    if (!form.diagnosis.trim()) { setError('Diagnosis is required'); return; }
    setLoading(true); setError('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-surface border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
              {mode === 'add' ? <Plus size={14} className="text-accent-cyan" /> : <Pencil size={14} className="text-accent-cyan" />}
            </div>
            <h3 className="font-semibold text-text-primary text-sm">
              {mode === 'add' ? 'Add New Patient' : 'Edit Patient'}
            </h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          {/* Full name */}
          <Field label="Full Name" required>
            <input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="e.g. Amara Okonkwo" className={inputCls} />
          </Field>

          {/* DOB + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of Birth" required>
              <input type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(e) => set('gender', e.target.value as PatientGender)} className={inputCls}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
          </div>

          {/* Blood type + Location */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Blood Type">
              <select value={form.blood_type} onChange={(e) => set('blood_type', e.target.value)} className={inputCls}>
                {BLOOD_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <select value={form.bed_number} onChange={(e) => set('bed_number', e.target.value === 'Home' ? 'Home' : e.target.value)} className={inputCls}>
                <option value="">— unassigned —</option>
                <option value="Home">Home</option>
              </select>
              {/* Allow typing a custom bed number too */}
              <input
                value={form.bed_number === 'Home' ? '' : form.bed_number}
                onChange={(e) => set('bed_number', e.target.value)}
                placeholder="or type bed e.g. B-04"
                className={`${inputCls} mt-1.5`}
                disabled={form.bed_number === 'Home'}
              />
            </Field>
          </div>

          {/* Diagnosis */}
          <Field label="Diagnosis" required>
            <input value={form.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} placeholder="e.g. Hypertension, post-op monitoring" className={inputCls} />
          </Field>

          {/* Emergency contact */}
          <Field label="Emergency Contact">
            <input value={form.emergency_contact} onChange={(e) => set('emergency_contact', e.target.value)} placeholder="e.g. +234 801 234 5678" className={inputCls} />
          </Field>

          {error && (
            <p className="text-xs text-status-critical flex items-center gap-1.5">
              <AlertTriangle size={12} /> {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-border text-sm text-text-muted hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 py-2 rounded-xl bg-accent-cyan text-bg-base text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {mode === 'add' ? 'Add Patient' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discharge confirm modal ───────────────────────────────────────────────────

function DischargeModal({ patient, onClose, onConfirm }: { patient: Patient; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const confirm = async () => {
    setLoading(true); setError('');
    try { await onConfirm(); onClose(); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <LogOut size={14} className="text-status-critical" />
            </div>
            <h3 className="font-semibold text-text-primary text-sm">Discharge Patient</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X size={16} /></button>
        </div>

        <p className="text-sm text-text-secondary mb-1">
          You are about to discharge <span className="text-text-primary font-semibold">{patient.name}</span>.
        </p>
        <p className="text-xs text-text-muted mb-5">
          Their assigned device will be automatically unlinked. Vitals history is preserved. This action cannot be undone from this view.
        </p>

        {error && <p className="text-xs text-status-critical flex items-center gap-1.5 mb-3"><AlertTriangle size={12} /> {error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-border text-sm text-text-muted hover:text-text-primary transition-colors">Cancel</button>
          <button
            onClick={confirm}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-red-500/80 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Discharge
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vital row ─────────────────────────────────────────────────────────────────

function VitalRow({ label, value, unit, state }: { label: string; value: number; unit: string; state: 'critical' | 'warning' | 'normal' }) {
  const bar  = { critical: 'bg-status-critical', warning: 'bg-status-warning', normal: 'bg-status-stable' };
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

// ─── Patient detail modal ──────────────────────────────────────────────────────

function PatientModal({ patient, onClose, onEdit, onDischarge }: { patient: Patient; onClose: () => void; onEdit: () => void; onDischarge: () => void }) {
  const patientAlerts   = getAlertsByPatient(patient.id);
  const patientTimeline = getTimelineByPatient(patient.id);
  const vitals = [
    { label: 'Heart Rate',   key: 'heartRate'   as const, value: patient.vitals.heartRate,  unit: 'bpm'  },
    { label: 'Temperature',  key: 'temperature' as const, value: patient.vitals.temperature, unit: '°C'   },
    { label: 'Systolic BP',  key: 'systolicBP'  as const, value: patient.vitals.systolicBP,  unit: 'mmHg' },
    { label: 'Diastolic BP', key: 'diastolicBP' as const, value: patient.vitals.diastolicBP, unit: 'mmHg' },
  ];
  // const typeIcons: Record<string, string> = {
  //   admission: '🏥', discharge: '🚪', alert: '⚠️', medication: '💊', checkup: '🩺', procedure: '⚕️',
  // };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-16 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>

        <div className={`p-5 border-b border-border flex items-start justify-between ${patient.status === 'critical' ? 'bg-red-500/5' : patient.status === 'warning' ? 'bg-yellow-500/5' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
              <User size={22} className="text-accent-cyan" />
            </div>
            <div>
              <h3 className="font-display font-700 text-lg text-text-primary">{patient.name}</h3>
              <p className="text-xs text-text-muted font-mono">{patient.id} · {patient.age}y · {patient.gender} · {patient.bloodType}</p>
              <span className={`inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusBg(patient.status)}`}>{patient.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text-primary hover:border-border-bright transition-colors">
              <Pencil size={11} /> Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDischarge(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-status-critical hover:bg-red-500/10 transition-colors">
              <LogOut size={11} /> Discharge
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors"><X size={14} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {([
              ['Location',          patient.bedNumber],
              ['Diagnosis',         patient.diagnosis],
              ['Doctor',            patient.doctorAssigned],
              ['Admitted',          patient.admissionDate],
              ['Device',            patient.deviceId],
              ['Emergency Contact', patient.emergencyContact],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} className="bg-bg-elevated border border-border rounded-lg p-3">
                <p className="text-text-muted font-mono mb-0.5">{label}</p>
                <p className="text-text-primary font-medium">{val}</p>
              </div>
            ))}
          </div>

          <div className="bg-bg-elevated border border-border rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-3">Current Vitals · {timeAgo(patient.vitals.timestamp)}</h4>
            {vitals.map(({ label, key, value, unit }) => (
              <VitalRow key={key} label={label} value={value} unit={unit} state={isVitalAbnormal(key, value)} />
            ))}
          </div>

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

          {patientTimeline.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted">Timeline</h4>
              <div className="space-y-2">
                {patientTimeline.map((e) => (
                  <div key={e.id} className="flex gap-3 text-xs">
                    <span className="text-base leading-none mt-0.5">{{ admission: '🏥', discharge: '🚪', alert: '⚠️', medication: '💊', checkup: '🩺', procedure: '⚕️' }[e.type]}</span>
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

// ─── Patient card ──────────────────────────────────────────────────────────────

function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const icons  = [Heart, Thermometer, Activity];
  const vitals = [
    { key: 'heartRate'   as const, value: patient.vitals.heartRate,  label: 'bpm'  },
    { key: 'temperature' as const, value: patient.vitals.temperature, label: '°C'   },
    { key: 'systolicBP'  as const, value: patient.vitals.systolicBP,  label: 'mmHg' },
  ];

  return (
    <div
      onClick={onClick}
      className={`bg-bg-surface border rounded-xl p-4 cursor-pointer hover:bg-bg-elevated transition-all duration-200
        ${patient.status === 'critical' ? 'critical-glow border-red-500/30' : patient.status === 'warning' ? 'warning-glow border-yellow-500/30' : 'border-border'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-xs font-bold text-accent-cyan font-mono">
            {patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary leading-tight">{patient.name}</p>
            <p className="text-[10px] text-text-muted font-mono">{patient.age}y · {patient.gender}</p>
          </div>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${statusBg(patient.status)}`}>{patient.status}</span>
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
        <span>{patient.bedNumber || '—'}</span>
        <span>{timeAgo(patient.vitals.timestamp)}</span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'view';      patient: Patient }
  | { type: 'edit';      patient: Patient }
  | { type: 'discharge'; patient: Patient }
  | { type: 'add' }
  | null;

function formAge(dob: string) {
  return dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10) : 0;
}

export default function PatientList() {
  const { patients: dbPatients, loading } = usePatients();
  const { refetch }                       = useAssignedPatients();

  // Optimistic state — keyed by temp/real ID
  const [added,    setAdded]    = useState<Patient[]>([]);
  const [edited,   setEdited]   = useState<Record<string, Partial<Patient>>>({});
  const [removed,  setRemoved]  = useState<Set<string>>(new Set());

  const { addPatient, editPatient, dischargePatient } = usePatientManagement(() => {
    // Fire refetch in background — optimistic state stays visible until
    // the real DB row appears in dbPatients, then merge drops it automatically
    refetch();
  });

  // Merge real + optimistic: added patients prepended, edits overlaid, removed filtered
  const patients: Patient[] = [
    ...added.filter((p) => !dbPatients.some((d) => d.id === p.id)), // drop once real row exists
    ...dbPatients.map((p) => ({ ...p, ...edited[p.id] })),
  ].filter((p) => !removed.has(p.id));

  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState<'status' | 'name'>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [view, setView]       = useState<'grid' | 'list'>('grid');
  const [modal, setModal]     = useState<ModalState>(null);

  const statusOrder = { critical: 0, warning: 1, stable: 2, inactive: 3 };

  const filtered = patients
    .filter((p) => {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.diagnosis.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sort === 'status') cmp = statusOrder[a.status] - statusOrder[b.status];
      if (sort === 'name')   cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (key: typeof sort) => {
    if (sort === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setSortDir('asc'); }
  };

  const SortIcon = sortDir === 'asc' ? ChevronUp : ChevronDown;

  const patientToForm = (p: Patient): Partial<PatientFormData> => ({
    full_name:         p.name,
    gender:            p.gender,
    blood_type:        p.bloodType,
    diagnosis:         p.diagnosis,
    bed_number:        p.bedNumber === '—' ? '' : p.bedNumber,
    emergency_contact: p.emergencyContact === 'None' ? '' : p.emergencyContact,
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAdd = async (form: PatientFormData) => {
  const tempId = `temp-${Date.now()}`;
  const optimistic: Patient = {
    id:               tempId,
    name:             form.full_name,
    age:              formAge(form.date_of_birth),
    gender:           form.gender,
    bedNumber:        form.bed_number || '—',
    admissionDate:    new Date().toISOString(),
    diagnosis:        form.diagnosis,
    doctorAssigned:   'Dr. Default',
    status:           'inactive',
    location:         { lat: 6.5244, lng: 3.3792 },
    deviceId:         'DEV-000',
    bloodType:        form.blood_type,
    emergencyContact: form.emergency_contact || 'None',
    vitals: { heartRate: 0, temperature: 0, systolicBP: 120, diastolicBP: 80, timestamp: new Date().toISOString() },
    vitalHistory: [],
  };

  setAdded((prev) => [optimistic, ...prev]);

  try {
    const realId = await addPatient(form);
    // Swap temp ID → real ID. The merge filter drops it once dbPatients
    // contains the same realId (after refetch / realtime update).
    setAdded((prev) => prev.map((p) => (p.id === tempId ? { ...p, id: realId } : p)));
    refetch();
  } catch (e) {
    setAdded((prev) => prev.filter((p) => p.id !== tempId)); // rollback
    throw e;
  }
};

  const handleEdit = async (patientId: string, form: PatientFormData) => {
    // Overlay edits immediately
    setEdited((prev) => ({
      ...prev,
      [patientId]: {
        name:             form.full_name,
        age:              formAge(form.date_of_birth),
        gender:           form.gender as PatientGender,
        bloodType:        form.blood_type,
        diagnosis:        form.diagnosis,
        bedNumber:        form.bed_number || '—',
        emergencyContact: form.emergency_contact || 'None',
      },
    }));

    try {
      await editPatient(patientId, form);
    } catch (e) {
      setEdited((prev) => { const n = { ...prev }; delete n[patientId]; return n; }); // rollback
      throw e;
    }
  };

  const handleDischarge = async (patientId: string) => {
    setRemoved((prev) => new Set(prev).add(patientId)); // hide immediately

    try {
      await dischargePatient(patientId);
    } catch (e) {
      setRemoved((prev) => { const s = new Set(prev); s.delete(patientId); return s; }); // rollback
      throw e;
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
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

        <button
          onClick={() => setModal({ type: 'add' })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan text-bg-base text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={13} /> Add Patient
        </button>
      </div>

      {/* Count + view toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-text-muted">
          {loading && filtered.length === 0 ? 'Loading…' : `${filtered.length} patient${filtered.length !== 1 ? 's' : ''}`}
        </p>
        <div className="flex gap-1">
          {(['grid', 'list'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-2 py-1 rounded text-xs font-mono capitalize ${view === v ? 'text-accent-cyan' : 'text-text-muted'}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => <PatientCard key={p.id} patient={p} onClick={() => setModal({ type: 'view', patient: p })} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => setModal({ type: 'view', patient: p })}
              className={`flex items-center gap-4 p-4 bg-bg-surface border rounded-xl cursor-pointer hover:bg-bg-elevated transition-all ${p.status === 'critical' ? 'critical-glow border-red-500/30' : p.status === 'warning' ? 'warning-glow border-yellow-500/30' : 'border-border'}`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'critical' ? 'bg-status-critical vital-pulse' : p.status === 'warning' ? 'bg-status-warning vital-pulse' : 'bg-status-stable'}`} />
              <div className="w-36 flex-shrink-0">
                <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                <p className="text-[10px] font-mono text-text-muted">{p.id} · {p.age}y</p>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex-shrink-0 ${statusBg(p.status)}`}>{p.status}</span>
              <p className="text-xs text-text-muted flex-1 truncate">{p.diagnosis}</p>
              <p className="text-xs text-text-muted hidden md:block">{p.bedNumber || '—'}</p>
              <p className="text-xs font-mono text-text-muted hidden lg:block">{p.doctorAssigned}</p>
              <div className="flex gap-3 text-xs font-mono text-text-secondary">
                <span className={isVitalAbnormal('heartRate', p.vitals.heartRate) !== 'normal' ? 'text-status-critical' : ''}>{p.vitals.heartRate} bpm</span>
                <span>{p.vitals.temperature}°C</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 text-text-muted text-sm bg-bg-surface border border-border rounded-2xl">
          No patients found for this search/filter.
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'view' && (
        <PatientModal
          patient={modal.patient}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'edit', patient: modal.patient })}
          onDischarge={() => setModal({ type: 'discharge', patient: modal.patient })}
        />
      )}
      {modal?.type === 'add' && (
        <PatientFormModal mode="add" onClose={() => setModal(null)} onSave={handleAdd} />
      )}
      {modal?.type === 'edit' && (
        <PatientFormModal
          mode="edit"
          initial={patientToForm(modal.patient)}
          onClose={() => setModal(null)}
          onSave={(form) => handleEdit(modal.patient.id, form)}
        />
      )}
      {modal?.type === 'discharge' && (
        <DischargeModal
          patient={modal.patient}
          onClose={() => setModal(null)}
          onConfirm={() => handleDischarge(modal.patient.id)}
        />
      )}
    </div>
  );
}