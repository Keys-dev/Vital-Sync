import { useState }     from 'react';
import { useNavigate }  from 'react-router-dom';
import { supabase }     from '@/lib/supabase';
import {
  Activity, Stethoscope, Users, Lock, Mail, Eye, EyeOff,
  ChevronRight, ArrowLeft, Shield, BadgeCheck, User,
} from 'lucide-react';

type View = 'landing' | 'doctor' | 'family';
type Mode = 'signin' | 'signup';

function EcgBackground() {
  return (
    <svg className="absolute bottom-0 left-0 w-full opacity-[0.04] pointer-events-none"
      viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points="0,80 120,80 148,16 176,144 204,48 232,112 260,80
                460,80 488,16 516,144 544,48 572,112 600,80
                800,80 828,16 856,144 884,48 912,112 940,80 1200,80"
        fill="none" stroke="#0086a8" strokeWidth="2.5" strokeLinejoin="round"
      />
    </svg>
  );
}

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

      <div className="flex gap-4 justify-center flex-wrap">
        <button onClick={() => setView('doctor')}
          className="group flex-1 min-w-[220px] max-w-[280px] bg-bg-surface border border-border
            rounded-2xl p-8 hover:border-accent-cyan/50 hover:shadow-glow-cyan
            transition-all duration-200 text-center cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20
            flex items-center justify-center mx-auto mb-5 group-hover:bg-accent-cyan/15 transition-colors">
            <Stethoscope size={24} className="text-accent-cyan" />
          </div>
          <p className="font-display text-base font-700 text-text-primary mb-1.5 tracking-wide">
            I'm a Doctor
          </p>
          <p className="text-xs text-text-muted leading-relaxed mb-5">
            Manage patients, monitor vitals, and configure alerts
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-semibold text-accent-cyan">
            Doctor Portal
            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button onClick={() => setView('family')}
          className="group flex-1 min-w-[220px] max-w-[280px] bg-bg-surface border border-border
            rounded-2xl p-8 hover:border-accent-teal/50 hover:shadow-glow-teal
            transition-all duration-200 text-center cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-accent-teal/10 border border-accent-teal/20
            flex items-center justify-center mx-auto mb-5 group-hover:bg-accent-teal/15 transition-colors">
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

// ─── Shared auth form (Doctor + Family) ──────────────────────────────────────
function AuthForm({
  role,
  setView,
}: {
  role: 'doctor' | 'family';
  setView: (v: View) => void;
}) {
  const navigate           = useNavigate();
  const isDoctor           = role === 'doctor';
  const accentRing         = isDoctor
    ? 'focus-within:ring-accent-cyan/30 focus-within:border-accent-cyan/60'
    : 'focus-within:ring-accent-teal/30 focus-within:border-accent-teal/60';

  const [mode,     setMode]     = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'signup') {
      // 1. Create the Supabase auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError('Sign-up succeeded but no user ID was returned. Please try signing in.');
        setLoading(false);
        return;
      }

      // 2. Insert the profile row with role + name
      const { error: profileError } = await supabase.from('profiles').insert({
        id:        userId,
        email:     email.toLowerCase().trim(),
        role,
        full_name: fullName.trim(),
      });

      if (profileError) {
        // Profile already exists — just sign in instead
        if (profileError.code !== '23505') {
          setError(profileError.message);
          setLoading(false);
          return;
        }
      }

      // 3. Redirect
      navigate(isDoctor ? '/dashboard' : '/family', { replace: true });

    } else {
      // Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Fetch profile to determine role and redirect correctly
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Could not retrieve user after sign-in.'); setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        // Signed in but no profile — shouldn't normally happen
        setError('No account found for this email in the ' + role + ' portal.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      navigate(profile.role === 'doctor' ? '/dashboard' : '/family', { replace: true });
    }
  };

  return (
    <div className="animate-fade-up max-w-[440px] mx-auto w-full">
      <button onClick={() => setView('landing')}
        className="flex items-center gap-1.5 text-xs font-mono text-text-muted
          hover:text-text-secondary transition-colors mb-6">
        <ArrowLeft size={13} />
        Back to role selection
      </button>

      <Logo />

      {/* Role badge */}
      <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5
        ${isDoctor
          ? 'bg-accent-cyan/10 border border-accent-cyan/25'
          : 'bg-accent-teal/10 border border-accent-teal/25'}`}>
        {isDoctor
          ? <BadgeCheck size={12} className="text-accent-cyan" />
          : <Users      size={12} className="text-accent-teal" />}
        <span className={`text-[11px] font-mono font-semibold
          ${isDoctor ? 'text-accent-cyan' : 'text-accent-teal'}`}>
          {isDoctor ? 'Doctor Portal' : 'Family Portal'}
        </span>
      </div>

      <h2 className="font-display text-2xl font-700 text-text-primary tracking-tight mb-1">
        {mode === 'signin'
          ? (isDoctor ? 'Welcome back, Doctor' : 'Stay connected')
          : 'Create your account'}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {mode === 'signin'
          ? (isDoctor ? 'Sign in to access your patient dashboard' : "Monitor your loved one's health in real time")
          : 'Fill in your details to get started'}
      </p>

      <div className="bg-bg-surface border border-border rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full name — sign-up only */}
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest mb-1.5">
                Full Name
              </label>
              <div className={`relative focus-within:ring-2 rounded-xl transition-all ${accentRing}`}>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                  <User size={14} />
                </span>
                <input type="text" required minLength={2}
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder={isDoctor ? 'Dr. Amaka Okonkwo' : 'Your full name'}
                  className="w-full bg-bg-elevated border border-border rounded-xl
                    pl-9 pr-4 py-2.5 text-sm text-text-primary font-mono
                    placeholder:text-text-muted outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <div className={`relative focus-within:ring-2 rounded-xl transition-all ${accentRing}`}>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                <Mail size={14} />
              </span>
              <input type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={isDoctor ? 'doctor@hospital.com' : 'yourname@email.com'}
                className="w-full bg-bg-elevated border border-border rounded-xl
                  pl-9 pr-4 py-2.5 text-sm text-text-primary font-mono
                  placeholder:text-text-muted outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest">
                Password
              </label>
              {mode === 'signin' && (
                <a href="#" className={`text-[11px] font-mono
                  ${isDoctor ? 'text-text-muted hover:text-accent-cyan' : 'text-text-muted hover:text-accent-teal'}
                  transition-colors`}>
                  Forgot password?
                </a>
              )}
            </div>
            <div className={`relative focus-within:ring-2 rounded-xl transition-all ${accentRing}`}>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                <Lock size={14} />
              </span>
              <input type={showPass ? 'text' : 'password'} required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-bg-elevated border border-border rounded-xl
                  pl-9 pr-10 py-2.5 text-sm text-text-primary font-mono
                  placeholder:text-text-muted outline-none transition-colors"
              />
              <button type="button" onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted
                  hover:text-text-secondary transition-colors">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-[10px] font-mono text-text-muted mt-1">Minimum 6 characters</p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2">
              <p className="text-xs font-mono text-status-critical">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold font-mono
              active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
              ${isDoctor
                ? `bg-accent-cyan text-white hover:bg-accent-cyan-dim`
                : `bg-accent-teal text-white hover:bg-accent-teal-dim`}`}>
            {loading
              ? 'Please wait…'
              : mode === 'signin'
                ? (isDoctor ? 'Sign in to Dashboard' : 'View Patient Vitals')
                : 'Create Account'}
          </button>
        </form>

        {/* Toggle sign-in / sign-up */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] font-mono text-text-muted">
            {mode === 'signin' ? 'New here?' : 'Already have an account?'}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button type="button"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
          className={`block w-full text-center text-xs font-mono font-semibold transition-colors
            ${isDoctor ? 'text-accent-cyan hover:text-accent-cyan-dim' : 'text-accent-teal hover:text-accent-teal-dim'}`}>
          {mode === 'signin' ? 'Create a new account →' : '← Sign in instead'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <Shield size={12} className="text-text-muted" />
        <span className="text-[11px] font-mono text-text-muted">
          HIPAA-compliant · End-to-end encrypted
        </span>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [view, setView] = useState<View>('landing');

  return (
    <div className="min-h-screen bg-bg-base grid-bg flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <EcgBackground />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,134,168,0.07) 0%, transparent 65%)' }} />
      <div className="absolute -bottom-40 -left-40 w-[460px] h-[460px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,145,107,0.06) 0%, transparent 65%)' }} />

      <div className="relative z-10 w-full max-w-[680px]">
        {view === 'landing' && <Landing setView={setView} />}
        {view === 'doctor'  && <AuthForm role="doctor" setView={setView} />}
        {view === 'family'  && <AuthForm role="family" setView={setView} />}
      </div>
    </div>
  );
}