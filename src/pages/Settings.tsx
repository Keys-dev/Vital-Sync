import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Wifi, WifiOff, Bell, Thermometer, RefreshCw, Shield, Save, ChevronRight, Pencil, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useProfile } from '@/hooks/useProfile';
import { useDevices } from '@/hooks/useDevices';
import AlertTestPanel from '@/components/AlertTestPanel';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
        checked ? 'bg-accent-cyan' : 'bg-bg-elevated border border-border'
      }`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`} />
    </div>
  );
}

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-bg-elevated/30">
        <Icon size={15} className="text-accent-cyan" />
        <h3 className="font-display font-700 text-sm text-text-primary">{title}</h3>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

function Row({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────

function EditProfileModal({ current, onClose, onSave }: {
  current: { name: string; email: string };
  onClose: () => void;
  onSave:  (data: { full_name: string; email: string }) => Promise<void>;
}) {
  const [name,    setName]    = useState(current.name);
  const [email,   setEmail]   = useState(current.email);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [done,    setDone]    = useState(false);

  const submit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    setLoading(true); setError('');
    try {
      await onSave({ full_name: name, email });
      setDone(true);
      setTimeout(onClose, 800);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-text-primary text-sm">Edit Profile</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-wide block mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-wide block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            />
            {email !== current.email && (
              <p className="text-[10px] text-text-muted mt-1">A confirmation link will be sent to your new email.</p>
            )}
          </div>

          {error && <p className="text-xs text-status-critical">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-border text-xs font-mono text-text-muted hover:text-text-primary">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading || done}
              className="flex-1 py-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-xs font-mono text-accent-cyan hover:bg-accent-cyan/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading && <Loader2 size={11} className="animate-spin" />}
              {done    && <CheckCircle2 size={11} />}
              {!loading && !done && <Pencil size={11} />}
              {loading ? 'Saving…' : done ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { settings, displayProfile, updateSetting } = useSettings();
  const { updateProfile } = useProfile();
  const { devices } = useDevices();
  const { signOut } = useAuthContext();
  const navigate = useNavigate();
  const [saved, setSaved]           = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Device connection status — any device online counts as connected
  const onlineDevices  = devices.filter((d) => d.status === 'online');
  const isConnected    = onlineDevices.length > 0;
  const offlineDevices = devices.filter((d) => d.status === 'offline');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-lg font-bold text-accent-cyan font-mono">
            {displayProfile.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-700 text-base text-text-primary truncate">
              {displayProfile.name}
            </h2>
            <p className="text-xs text-text-muted font-mono capitalize">{displayProfile.role}</p>
            <p className="text-xs text-text-muted font-mono truncate">{displayProfile.email}</p>
          </div>
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center gap-2 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-xs font-mono text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            <Pencil size={12} /> Edit Profile
          </button>
        </div>
      </div>

      {/* ── Alert & Notifications ─────────────────────────────────────────── */}
      <Section title="Alert & Notifications" icon={Bell}>
        <Row label="Alerts Enabled" description="Master switch — turn all patient alerts on or off">
          <Toggle checked={settings.alertsEnabled} onChange={(v) => updateSetting('alertsEnabled', v)} />
        </Row>
        <Row label="Alert Sound" description="Play audio on critical alerts">
          <Toggle checked={settings.alertSound && settings.alertsEnabled} onChange={(v) => updateSetting('alertSound', v)} />
        </Row>
        <Row label="Auto Refresh" description="Automatically refresh vitals data">
          <Toggle checked={settings.autoRefresh} onChange={(v) => updateSetting('autoRefresh', v)} />
        </Row>
        <Row label="Refresh Interval" description="How often to poll new data">
          <select
            value={settings.refreshInterval}
            onChange={(e) => updateSetting('refreshInterval', Number(e.target.value))}
            className="bg-bg-elevated border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text-primary outline-none"
          >
            {[3, 5, 10, 15, 30].map((s) => <option key={s} value={s}>{s}s</option>)}
          </select>
        </Row>
      </Section>

      {/* ── Display & Units ───────────────────────────────────────────────── */}
      <Section title="Display & Units" icon={Thermometer}>
        <Row label="Temperature Unit" description="Unit used across all vital displays">
          <div className="flex gap-1 bg-bg-elevated border border-border rounded-lg p-0.5">
            {(['C', 'F'] as const).map((u) => (
              <button
                key={u}
                onClick={() => updateSetting('temperatureUnit', u)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  settings.temperatureUnit === u ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-text-muted'
                }`}
              >
                °{u}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      {/* ── IoT Connectivity ──────────────────────────────────────────────── */}
      <Section title="IoT Connectivity" icon={isConnected ? Wifi : WifiOff}>
        <Row label="Connection Status" description="Live device connection from Supabase">
          {isConnected ? (
            <div className="flex items-center gap-2 text-xs font-mono text-status-stable">
              <span className="w-2 h-2 rounded-full bg-status-stable vital-pulse" />
              {onlineDevices.length} device{onlineDevices.length !== 1 ? 's' : ''} online
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-status-inactive">
              <span className="w-2 h-2 rounded-full bg-status-inactive" />
              No devices online
            </div>
          )}
        </Row>
        {offlineDevices.length > 0 && (
          <Row label="Offline Devices" description="Devices that have stopped sending data">
            <div className="flex items-center gap-2 text-xs font-mono text-status-critical">
              <WifiOff size={11} />
              {offlineDevices.length} offline
            </div>
          </Row>
        )}
        {devices.length === 0 && (
          <Row label="No devices registered" description="Go to the Devices page to register your IoT hardware">
            <span className="text-xs font-mono text-text-muted">—</span>
          </Row>
        )}
      </Section>

      {/* ── System ────────────────────────────────────────────────────────── */}
      <Section title="System" icon={Shield}>
        <Row label="App Version" description="VitalSync Clinical Portal">
          <span className="text-xs font-mono text-text-muted">v1.0.0</span>
        </Row>
        <Row label="Data Source" description="Current data pipeline">
          <span className="text-xs font-mono text-text-muted">Supabase Realtime</span>
        </Row>
        <div
          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-bg-elevated/50 transition-colors"
          onClick={() => window.location.reload()}
        >
          <div>
            <p className="text-sm font-medium text-text-primary">Reload App</p>
            <p className="text-xs text-text-muted">Clear cache and restart</p>
          </div>
          <RefreshCw size={14} className="text-text-muted" />
        </div>
        <div
          onClick={() => { signOut(); navigate('/auth', { replace: true }); }}
          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-bg-elevated/50 transition-colors text-status-critical"
        >
          <div>
            <p className="text-sm font-medium">Sign Out</p>
            <p className="text-xs opacity-70">End current session</p>
          </div>
          <ChevronRight size={14} />
        </div>
      </Section>

      {/* ── Alert Test Panel (dev only) ───────────────────────────────── */}
      <AlertTestPanel />

      {/* ── Save button ───────────────────────────────────────────────────── */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-mono font-semibold transition-all ${
            saved
              ? 'bg-teal-500/20 border border-teal-500/30 text-status-stable'
              : 'bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20'
          }`}
        >
          <Save size={14} />
          {saved ? 'Saved ✓' : 'Save Settings'}
        </button>
      </div>

      {/* Edit profile modal */}
      {showEditProfile && (
        <EditProfileModal
          current={{ name: displayProfile.name, email: displayProfile.email }}
          onClose={() => setShowEditProfile(false)}
          onSave={updateProfile}
        />
      )}
    </div>
  );
}