import { useState }      from 'react';
import { useNavigate }   from 'react-router-dom';
import { useUser }       from '@clerk/clerk-react';
import { useSupabase }   from '@/hooks/useSupabase';
import { useProfile }    from '@/hooks/useProfile';
import { Activity, Stethoscope, Users } from 'lucide-react';

type Role = 'doctor' | 'family';

export default function Onboarding() {
  const { user }           = useUser();
  const supabase           = useSupabase();
  const { refetchProfile } = useProfile();
  const navigate           = useNavigate();

  const [step,     setStep]     = useState<'role' | 'details'>('role');
  const [role,     setRole]     = useState<Role | null>(null);
  const [fullName, setFullName] = useState(
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
  );
  const [saving, setSaving]  = useState(false);
  const [error,  setError]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !role) return;
    setSaving(true); setError(null);

    const { error: sbError } = await supabase.from('profiles').insert({
      id:        user.id,
      email:     user.primaryEmailAddress?.emailAddress ?? '',
      role,
      full_name: fullName.trim(),
    });

    if (sbError) {
      if (sbError.code === '23505') {
        await refetchProfile();
        navigate(role === 'doctor' ? '/dashboard' : '/family', { replace: true });
        return;
      }
      setError(sbError.message);
      setSaving(false);
      return;
    }

    await refetchProfile();
    navigate(role === 'doctor' ? '/dashboard' : '/family', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-base grid-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
            <Activity size={18} className="text-accent-cyan" />
          </div>
          <div>
            <h1 className="font-display text-sm font-700 text-text-primary tracking-wide">VitalSync</h1>
            <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest mt-0.5">Clinical Portal</p>
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-2xl p-8">
          {step === 'role' && (
            <>
              <h2 className="font-display text-2xl font-700 text-text-primary tracking-tight mb-1">
                Who are you?
              </h2>
              <p className="text-sm text-text-muted mb-6">
                This determines what you can see and do in the system.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setRole('doctor'); setStep('details'); }}
                  className="group bg-bg-elevated border border-border rounded-xl p-5 text-center
                    hover:border-accent-cyan/50 hover:shadow-glow-cyan transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20
                    flex items-center justify-center mx-auto mb-3 group-hover:bg-accent-cyan/15 transition-colors">
                    <Stethoscope size={18} className="text-accent-cyan" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Doctor</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Manage patients & approve access
                  </p>
                </button>

                <button
                  onClick={() => { setRole('family'); setStep('details'); }}
                  className="group bg-bg-elevated border border-border rounded-xl p-5 text-center
                    hover:border-accent-teal/50 hover:shadow-glow-teal transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent-teal/10 border border-accent-teal/20
                    flex items-center justify-center mx-auto mb-3 group-hover:bg-accent-teal/15 transition-colors">
                    <Users size={18} className="text-accent-teal" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Family Member</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Monitor a loved one's vitals
                  </p>
                </button>
              </div>
            </>
          )}

          {step === 'details' && (
            <>
              <button
                onClick={() => setStep('role')}
                className="text-xs font-mono text-text-muted hover:text-text-secondary transition-colors mb-5 block"
              >
                ← Back
              </button>
              <h2 className="font-display text-2xl font-700 text-text-primary tracking-tight mb-1">
                Almost there
              </h2>
              <p className="text-sm text-text-muted mb-6">Confirm your name to finish setup.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-text-muted uppercase tracking-widest mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'doctor' ? 'Dr. Amaka Okonkwo' : 'Your full name'}
                    required
                    minLength={2}
                    className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5
                      text-sm text-text-primary font-mono placeholder:text-text-muted
                      outline-none focus:ring-2 focus:ring-accent-cyan/30 focus:border-accent-cyan/60 transition-all"
                  />
                </div>

                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono font-semibold
                  ${role === 'doctor'
                    ? 'bg-accent-cyan/10 border border-accent-cyan/25 text-accent-cyan'
                    : 'bg-accent-teal/10 border border-accent-teal/25 text-accent-teal'}`}
                >
                  Signing up as: <strong>{role}</strong>
                </div>

                {error && (
                  <p className="text-xs font-mono text-status-critical">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold font-mono
                    transition-all duration-150 active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${role === 'doctor'
                      ? 'bg-accent-cyan text-white hover:bg-accent-cyan-dim'
                      : 'bg-accent-teal text-white hover:bg-accent-teal-dim'}`}
                >
                  {saving ? 'Creating account…' : 'Complete Setup'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}