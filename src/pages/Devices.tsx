import { useState } from 'react';
import {
  Cpu, Wifi, WifiOff, Clock, Battery, Plus, UserCheck,
  UserX, Trash2, Loader2, AlertTriangle, CheckCircle2, X,
} from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { useAssignedPatients } from '@/hooks/useDoctorData';
import { timeAgo } from '@/services/vitals';
import type { Device } from '@/types';

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Device['status'] }) {
  if (status === 'online') return (
    <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5
      rounded border bg-teal-500/10 border-teal-500/30 text-status-stable">
      <span className="w-1.5 h-1.5 rounded-full bg-status-stable vital-pulse" />
      Online
    </span>
  );
  if (status === 'offline') return (
    <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5
      rounded border bg-red-500/10 border-red-500/30 text-status-critical">
      <WifiOff size={9} /> Offline
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5
      rounded border bg-gray-500/10 border-gray-500/30 text-text-muted">
      <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
      Unassigned
    </span>
  );
}

// ─── Battery indicator ───────────────────────────────────────────────────────

function BatteryBar({ level }: { level: number | null }) {
  if (level === null) return <span className="text-text-muted font-mono text-xs">—</span>;
  const color = level > 50 ? 'bg-status-stable' : level > 20 ? 'bg-status-warning' : 'bg-status-critical';
  return (
    <div className="flex items-center gap-1.5">
      <Battery size={11} className="text-text-muted" />
      <div className="w-16 h-1.5 bg-bg-base rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${level}%` }} />
      </div>
      <span className="text-[10px] font-mono text-text-muted">{level}%</span>
    </div>
  );
}

// ─── Register Device Modal ───────────────────────────────────────────────────

function RegisterModal({ onClose, onRegister }: {
  onClose:    () => void;
  onRegister: (code: string, label: string) => Promise<void>;
}) {
  const [code,    setCode]    = useState('');
  const [label,   setLabel]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async () => {
    if (!code.trim()) { setError('Device code is required'); return; }
    setLoading(true); setError('');
    try {
      await onRegister(code, label || `Device ${code.toUpperCase()}`);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary text-sm">Register New Device</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-wide block mb-1">
              Device Code <span className="text-status-critical">*</span>
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. VS-001"
              className="w-full bg-bg-base border border-border rounded-lg px-3 py-2
                text-sm font-mono text-text-primary placeholder:text-text-muted
                focus:outline-none focus:border-accent-cyan"
            />
            <p className="text-[10px] text-text-muted mt-1">The code printed/flashed on the hardware.</p>
          </div>

          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-wide block mb-1">
              Label
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Sensor Unit 03"
              className="w-full bg-bg-base border border-border rounded-lg px-3 py-2
                text-sm text-text-primary placeholder:text-text-muted
                focus:outline-none focus:border-accent-cyan"
            />
          </div>

          {error && (
            <p className="text-xs text-status-critical flex items-center gap-1.5">
              <AlertTriangle size={12} /> {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-xs font-mono
                text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30
                text-xs font-mono text-accent-cyan hover:bg-accent-cyan/20
                disabled:opacity-50 disabled:cursor-not-allowed transition-all
                flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              {loading ? 'Registering…' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Patient Modal ────────────────────────────────────────────────────

function AssignModal({ device, onClose, onAssign }: {
  device:   Device;
  onClose:  () => void;
  onAssign: (deviceId: string, patientId: string | null) => Promise<void>;
}) {
  const { patients } = useAssignedPatients();
  const [selected, setSelected] = useState<string>(device.patient_id ?? '');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await onAssign(device.id, selected || null);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-text-primary text-sm">Assign Device</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
        <p className="text-[11px] font-mono text-text-muted mb-4">{device.device_code} · {device.label}</p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-wide block mb-1">
              Patient
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full bg-bg-base border border-border rounded-lg px-3 py-2
                text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="">— Unassign device —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-status-critical flex items-center gap-1.5">
              <AlertTriangle size={12} /> {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-xs font-mono
                text-text-muted hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30
                text-xs font-mono text-accent-cyan hover:bg-accent-cyan/20
                disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
              {loading ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Devices() {
  const { devices, loading, assignDevice, registerDevice, deleteDevice } = useDevices();
  const [showRegister, setShowRegister] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Device | null>(null);

  const online     = devices.filter((d) => d.status === 'online').length;
  const offline    = devices.filter((d) => d.status === 'offline').length;
  const unassigned = devices.filter((d) => d.status === 'unassigned').length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-700 text-text-primary">Devices</h1>
          <p className="text-xs text-text-muted font-mono mt-0.5">
            Register and assign IoT sensor nodes to patients
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan/10
            border border-accent-cyan/30 text-accent-cyan text-xs font-mono font-semibold
            hover:bg-accent-cyan/20 transition-all active:scale-95"
        >
          <Plus size={13} /> Register Device
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Online',     value: online,     icon: Wifi,    color: 'text-status-stable' },
          { label: 'Offline',    value: offline,    icon: WifiOff, color: 'text-status-critical' },
          { label: 'Unassigned', value: unassigned, icon: Cpu,     color: 'text-text-muted' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={12} className={color} />
              <span className="text-[10px] font-mono text-text-muted">{label}</span>
            </div>
            <p className={`text-2xl font-display font-700 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Device table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3
          bg-bg-surface border border-border rounded-2xl">
          <Cpu size={32} className="text-text-muted opacity-30" />
          <p className="text-sm text-text-muted font-mono">No devices registered yet</p>
          <button
            onClick={() => setShowRegister(true)}
            className="text-xs text-accent-cyan font-mono hover:underline"
          >
            Register your first device →
          </button>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_120px_100px_80px_auto] gap-4 px-5 py-3
            border-b border-border text-[10px] font-mono text-text-muted uppercase tracking-wider
            hidden md:grid">
            <span>Device</span>
            <span>Patient</span>
            <span>Last Seen</span>
            <span>Battery</span>
            <span>Status</span>
            <span />
          </div>

          {devices.map((device, i) => (
            <div
              key={device.id}
              className={`flex flex-col md:grid md:grid-cols-[1fr_1fr_120px_100px_80px_auto]
                gap-3 md:gap-4 px-5 py-4 md:items-center
                ${i < devices.length - 1 ? 'border-b border-border/50' : ''}`}
            >
              {/* Device info */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border
                  flex items-center justify-center flex-shrink-0">
                  <Cpu size={14} className="text-accent-cyan" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary font-mono truncate">
                    {device.device_code}
                  </p>
                  <p className="text-[10px] text-text-muted truncate">{device.label}</p>
                </div>
              </div>

              {/* Patient */}
              <div>
                {device.patient_name ? (
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={11} className="text-status-stable flex-shrink-0" />
                    <span className="text-xs text-text-primary truncate">{device.patient_name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <UserX size={11} className="text-text-muted flex-shrink-0" />
                    <span className="text-xs text-text-muted italic">Unassigned</span>
                  </div>
                )}
              </div>

              {/* Last seen */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
                <Clock size={10} />
                {device.last_seen ? timeAgo(device.last_seen) : '—'}
              </div>

              {/* Battery */}
              <BatteryBar level={device.battery_level} />

              {/* Status */}
              <StatusBadge status={device.status} />

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAssignTarget(device)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-accent-cyan
                    hover:bg-accent-cyan/10 transition-all"
                  title="Assign to patient"
                >
                  <UserCheck size={14} />
                </button>
                <button
                  onClick={() => deleteDevice(device.id)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-status-critical
                    hover:bg-red-500/10 transition-all"
                  title="Remove device"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onRegister={registerDevice}
        />
      )}
      {assignTarget && (
        <AssignModal
          device={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssign={assignDevice}
        />
      )}
    </div>
  );
}