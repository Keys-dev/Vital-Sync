import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Stethoscope, Users, Lock, Mail, Eye, EyeOff, ChevronRight, ArrowLeft, Shield, BadgeCheck, Wifi } from 'lucide-react';

type View = 'landing' | 'doctor' | 'family';

// ─── Shared ECG background decoration ────────────────────────────────────────
function EcgBackground() {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full opacity-[0.04] pointer-events-none"
      viewBox="0 0 1200 160"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points="0,80 120,80 148,16 176,144 204,48 232,112 260,80
                460,80 488,16 516,144 544,48 572,112 600,80
                800,80 828,16 856,144 884,48 912,112 940,80 1200,80"
        fill="none"
        stroke="#0086a8"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Logo / brand mark ────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2.5 mb-8">
      <div className="w-9 h-9 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
        <Activity size={18} className="text-accent-cyan" />
      </div>
      <div>
        <h1 className="font-display text-sm font-700 text-text-primary tracking-wide leading-none">
          VitalSync
        </h1>
        <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest mt-0.5">
          Clinical Portal
        </p>
      </div>
    </div>
  );
}

// ─── Landing — role selector ──────────────────────────────────────────────────
function Landing({ setView }: { setView: (v: View) => void }) {
  return (
    <div className="animate-fade-up">
      <div className="text-center mb-10">
        <Logo />
        <h2 className="font-display text-3xl font-700 text-text-primary tracking-tight leading-tight mb-2">
          IoT Vital Signs
          <br />
          <span className="text-accent-cyan">Monitoring System</span>
        </h2>
        <p className="text-sm text-text-muted font-mono mt-3">
          Real-time patient vitals · Anywhere · Any device
        </p>
      </div>

      {/* Role cards */}
      <div className="flex gap-4 justify-center flex-wrap">
        {/* Doctor card */}
        <button
          onClick={() => setView('doctor')}
          className="
            group flex-1 min-w-[220px] max-w-[280px]
            bg-bg-surface border border-border rounded-2xl p-8
            hover:border-accent-cyan/50 hover:shadow-glow-cyan
            transition-all duration-200 text-center cursor-pointer
          "
        >
          <div className="w-14 h-14 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent-cyan/15 transition-colors">
            <Stethoscope size={24} className="text-accent-cyan" />
          </div>
          <p className="font-display text-base font-700 text-text-primary mb-1.5 tracking-wide">
            I'm a Doctor
          </p>
          <p className="text-xs text-text-muted leading-relaxed mb-5">
            Manage patients, monitor vitals, and configure alerts
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-semibold text-accent-cyan">
            Sign in as Doctor
            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Family card */}
        <button
          onClick={() => setView('family')}
          className="
            group flex-1 min-w-[220px] max-w-[280px]
            bg-bg-surface border border-border rounded-2xl p-8
            hover:border-accent-teal/50 hover:shadow-glow-teal
            transition-all duration-200 text-center cursor-pointer
          "
        >
          <div className="w-14 h-14 rounded-2xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent-teal/15 transition-colors">
            <Users size={24} className="text-accent-teal" />
          </div>
          <p className="font-display text-base font-700 text-text-primary mb-1.5 tracking-wide">
            I'm a Family Member
          </p>
          <p className="text-xs text-text-muted leading-relaxed mb-5">
            View your loved one's vitals and receive health updates
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-semibold text-accent-teal">
            Family Portal
            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      {/* Live status badge */}
      <div className="flex justify-center mt-8">
        <div className="inline-flex items-center gap-2 bg-bg-surface border border-border rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-status-stable vital-pulse" />
          <span className="text-[11px] font-mono text-text-muted">
            System Online · Live monitoring active
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Shared form field ────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  accentClass,
  children,
}: {
  label: string;
  hint?: string;
  accentClass: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className={`relative focus-within:ring-2 rounded-xl transition-all ${accentClass}`}>
        {children}
      </div>
      {hint && <p className="text-[11px] text-text-muted font-mono mt-1">{hint}</p>}
    </div>
  );
}

function InputIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
      {children}
    </span>
  );
}

// ─── Doctor login ─────────────────────────────────────────────────────────────
function DoctorLogin({ setView }: { setView: (v: View) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPass, setShowPass] = useState(false);
  const [loading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  navigate('/sign-in');
};

  const accentRing = 'focus-within:ring-accent-cyan/30 focus-within:border-accent-cyan/60';

  return (
    <div className="animate-fade-up max-w-[440px] mx-auto w-full">
      <button
        onClick={() => setView('landing')}
        className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-secondary transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        Back to role selection
      </button>

      <Logo />

      {/* Role badge */}
      <div className="inline-flex items-center gap-1.5 bg-accent-cyan/10 border border-accent-cyan/25 rounded-full px-3 py-1 mb-5">
        <BadgeCheck size={12} className="text-accent-cyan" />
        <span className="text-[11px] font-mono font-semibold text-accent-cyan">Doctor Portal</span>
      </div>

      <h2 className="font-display text-2xl font-700 text-text-primary tracking-tight mb-1">
        {mode === 'signin' ? 'Welcome back, Doctor' : 'Create Doctor Account'}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {mode === 'signin' ? 'Sign in to access your patient dashboard' : 'Register to manage your patients'}
      </p>

      {/* Form card */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Field label="Full Name" accentClass={accentRing}>
              <InputIcon><Users size={14} /></InputIcon>
              <input
                type="text"
                placeholder="e.g. Dr. Jane Doe"
                required
                className="
                  w-full bg-bg-elevated border border-border rounded-xl
                  pl-9 pr-4 py-2.5 text-sm text-text-primary font-mono
                  placeholder:text-text-muted outline-none
                  transition-colors
                "
              />
            </Field>
          )}

          <Field label="Hospital ID" accentClass={accentRing}>
            <InputIcon><Lock size={14} /></InputIcon>
            <input
              type="text"
              placeholder="e.g. DR-2024-0042"
              required
              className="
                w-full bg-bg-elevated border border-border rounded-xl
                pl-9 pr-4 py-2.5 text-sm text-text-primary font-mono
                placeholder:text-text-muted outline-none
                transition-colors
              "
            />
          </Field>

          <Field label="Email Address" accentClass={accentRing}>
            <InputIcon><Mail size={14} /></InputIcon>
            <input
              type="email"
              placeholder="doctor@hospital.com"
              required
              className="
                w-full bg-bg-elevated border border-border rounded-xl
                pl-9 pr-4 py-2.5 text-sm text-text-primary font-mono
                placeholder:text-text-muted outline-none
                transition-colors
              "
            />
          </Field>

          <Field label="Password" accentClass={accentRing}>
            <InputIcon><Lock size={14} /></InputIcon>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder={mode === 'signin' ? 'Enter your password' : 'Create a strong password'}
              required
              className="
                w-full bg-bg-elevated border border-border rounded-xl
                pl-9 pr-10 py-2.5 text-sm text-text-primary font-mono
                placeholder:text-text-muted outline-none
                transition-colors
              "
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </Field>

          {mode === 'signin' && (
            <div className="flex justify-end">
              <a href="#" className="text-[11px] font-mono text-text-muted hover:text-accent-cyan transition-colors">
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-2.5 rounded-xl text-sm font-semibold font-mono
              bg-accent-cyan text-white
              hover:bg-accent-cyan-dim active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Wifi size={14} className="animate-pulse" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
              </span>
            ) : (
              mode === 'signin' ? 'Sign in to Dashboard' : 'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] font-mono text-text-muted">
            {mode === 'signin' ? 'New to the portal?' : 'Already registered?'}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="block w-full text-center text-xs font-mono font-semibold text-accent-cyan hover:text-accent-cyan-dim transition-colors"
        >
          {mode === 'signin' ? 'Create a doctor account →' : '← Back to sign in'}
        </button>
      </div>

      <p className="text-center text-[11px] font-mono text-text-muted mt-4">
        Access restricted to registered medical personnel only
      </p>
    </div>
  );
}

// ─── Family login ─────────────────────────────────────────────────────────────
function FamilyLogin({ setView }: { setView: (v: View) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPass, setShowPass] = useState(false);
  const [loading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  navigate('/sign-in');
};

  const accentRing = 'focus-within:ring-accent-teal/30 focus-within:border-accent-teal/60';

  return (
    <div className="animate-fade-up max-w-[440px] mx-auto w-full">
      <button
        onClick={() => setView('landing')}
        className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-secondary transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        Back to role selection
      </button>

      <Logo />

      {/* Role badge */}
      <div className="inline-flex items-center gap-1.5 bg-accent-teal/10 border border-accent-teal/25 rounded-full px-3 py-1 mb-5">
        <Users size={12} className="text-accent-teal" />
        <span className="text-[11px] font-mono font-semibold text-accent-teal">Family Portal</span>
      </div>

      <h2 className="font-display text-2xl font-700 text-text-primary tracking-tight mb-1">
        {mode === 'signin' ? 'Stay connected' : 'Register for access'}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {mode === 'signin' ? "Monitor your loved one's health in real time" : 'Create an account to view patient vitals'}
      </p>

      {/* Form card */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Field label="Full Name" accentClass={accentRing}>
              <InputIcon><Users size={14} /></InputIcon>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                required
                className="
                  w-full bg-bg-elevated border border-border rounded-xl
                  pl-9 pr-4 py-2.5 text-sm text-text-primary font-mono
                  placeholder:text-text-muted outline-none
                  transition-colors
                "
              />
            </Field>
          )}

          <Field
            label="Patient Access Code"
            hint="Provided by the hospital at admission"
            accentClass={accentRing}
          >
            <InputIcon><BadgeCheck size={14} /></InputIcon>
            <input
              type="text"
              placeholder="e.g. PAT-2024-0088"
              required
              className="
                w-full bg-bg-elevated border border-border rounded-xl
                pl-9 pr-4 py-2.5 text-sm text-text-primary font-mono uppercase
                placeholder:text-text-muted placeholder:normal-case outline-none
                transition-colors
              "
            />
          </Field>

          <Field label="Your Email" accentClass={accentRing}>
            <InputIcon><Mail size={14} /></InputIcon>
            <input
              type="email"
              placeholder="yourname@email.com"
              required
              className="
                w-full bg-bg-elevated border border-border rounded-xl
                pl-9 pr-4 py-2.5 text-sm text-text-primary font-mono
                placeholder:text-text-muted outline-none
                transition-colors
              "
            />
          </Field>

          <Field label="Password" accentClass={accentRing}>
            <InputIcon><Lock size={14} /></InputIcon>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder={mode === 'signin' ? 'Enter your password' : 'Create a strong password'}
              required
              className="
                w-full bg-bg-elevated border border-border rounded-xl
                pl-9 pr-10 py-2.5 text-sm text-text-primary font-mono
                placeholder:text-text-muted outline-none
                transition-colors
              "
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </Field>

          {mode === 'signin' && (
            <div className="flex justify-end">
              <a href="#" className="text-[11px] font-mono text-text-muted hover:text-accent-teal transition-colors">
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-2.5 rounded-xl text-sm font-semibold font-mono
              bg-accent-teal text-white
              hover:bg-accent-teal-dim active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Wifi size={14} className="animate-pulse" /> {mode === 'signin' ? 'Signing in…' : 'Registering…'}
              </span>
            ) : (
              mode === 'signin' ? 'View Patient Vitals' : 'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] font-mono text-text-muted">
            {mode === 'signin' ? 'New to the portal?' : 'Already have an account?'}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="block w-full text-center text-xs font-mono font-semibold text-accent-teal hover:text-accent-teal-dim transition-colors"
        >
          {mode === 'signin' ? 'Request family access from your doctor →' : '← Back to sign in'}
        </button>
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        <Shield size={12} className="text-text-muted" />
        <span className="text-[11px] font-mono text-text-muted">
          HIPAA-compliant · End-to-end encrypted
        </span>
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const [view, setView] = useState<View>('landing');

  return (
    <div className="min-h-screen bg-bg-base grid-bg flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <EcgBackground />
      {/* Top-right glow */}
      <div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,134,168,0.07) 0%, transparent 65%)' }}
      />
      {/* Bottom-left glow */}
      <div
        className="absolute -bottom-40 -left-40 w-[460px] h-[460px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,145,107,0.06) 0%, transparent 65%)' }}
      />

      <div className="relative z-10 w-full max-w-[680px]">
        {view === 'landing' && <Landing setView={setView} />}
        {view === 'doctor'  && <DoctorLogin setView={setView} />}
        {view === 'family'  && <FamilyLogin setView={setView} />}
      </div>
    </div>
  );
}
