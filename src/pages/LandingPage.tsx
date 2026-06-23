import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  Activity, MapPin, Bell, TrendingUp,
  Shield, Cpu, ArrowRight, Heart,
} from 'lucide-react';

/* ─── ECG Stripe (ambient background) ──────────────────────────────── */
function EcgStripe() {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full opacity-[0.045] pointer-events-none select-none"
      viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden
    >
      <polyline
        points="0,60 140,60 170,12 200,108 230,32 260,88 290,60
                490,60 520,12 550,108 580,32 610,88 640,60
                840,60 870,12 900,108 930,32 960,88 990,60 1200,60"
        fill="none" stroke="#0086a8" strokeWidth="2.5" strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Animated live-vitals ticker ───────────────────────────────────── */
function VitalsTicker() {
  const [hr, setHr] = useState(72);
  const [temp, setTemp] = useState(36.6);
  const [sys, setSys] = useState(118);

  useEffect(() => {
    const t = setInterval(() => {
      setHr((v) => Math.max(60, Math.min(100, v + Math.round((Math.random() - 0.48) * 3))));
      setTemp((v) => parseFloat(Math.max(36.2, Math.min(37.4, v + (Math.random() - 0.5) * 0.1)).toFixed(1)));
      setSys((v) => Math.max(110, Math.min(130, v + Math.round((Math.random() - 0.5) * 4))));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {[
        { label: 'Heart Rate', value: `${hr}`, unit: 'bpm', color: 'text-status-critical', dot: 'bg-status-critical' },
        { label: 'Temperature', value: `${temp}`, unit: '°C', color: 'text-orange-500', dot: 'bg-orange-500' },
        { label: 'Systolic BP', value: `${sys}`, unit: 'mmHg', color: 'text-accent-cyan', dot: 'bg-accent-cyan' },
      ].map(({ label, value, unit, color, dot }) => (
        <div key={label}
          className="bg-bg-surface border border-border rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm">
          <span className={`w-2 h-2 rounded-full ${dot} vital-pulse`} />
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`font-mono text-xl font-bold ${color} tabular-nums`}>
              {value} <span className="text-xs text-text-muted font-normal">{unit}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Feature card ──────────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon, title, body, accent,
}: {
  icon: React.ElementType; title: string; body: string; accent: string;
}) {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4
      hover:border-accent-cyan/40 hover:shadow-glow-cyan transition-all duration-300 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} transition-colors`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <h3 className="font-display font-bold text-base text-text-primary mb-1.5">{title}</h3>
        <p className="text-sm text-text-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

/* ─── Role card ─────────────────────────────────────────────────────── */
function RoleCard({
  icon: Icon, role, description, onClick,
}: {
  icon: React.ElementType; role: string; description: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-bg-surface border border-border rounded-2xl p-6 text-left
        hover:border-accent-cyan/50 hover:shadow-glow-cyan active:scale-[0.98]
        transition-all duration-200 group flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20
        flex items-center justify-center flex-shrink-0 group-hover:bg-accent-cyan/20 transition-colors">
        <Icon size={22} className="text-accent-cyan" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-text-primary text-sm">{role}</p>
        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
      <ArrowRight size={16} className="text-text-muted group-hover:text-accent-cyan
        group-hover:translate-x-1 transition-all flex-shrink-0" />
    </button>
  );
}

/* ─── Stat badge ────────────────────────────────────────────────────── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display font-bold text-2xl text-accent-cyan">{value}</p>
      <p className="text-xs font-mono text-text-muted mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate  = useNavigate();
  const ctaRef    = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-accent-cyan" />
            <span className="font-display font-bold text-text-primary tracking-tight">VitalSync</span>
            <span className="text-[10px] font-mono text-text-muted border border-border
              rounded px-1.5 py-0.5 ml-1">CLINICAL</span>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="text-xs font-mono text-accent-cyan hover:text-accent-cyan-dim transition-colors"
          >
            Sign in →
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6">
        <EcgStripe />

        {/* grid dot background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #c2d4e4 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.35,
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center space-y-7">
          <div className="inline-flex items-center gap-2 bg-accent-cyan/8 border border-accent-cyan/20
            rounded-full px-4 py-1.5 text-[11px] font-mono text-accent-cyan">
            <span className="w-1.5 h-1.5 rounded-full bg-status-stable vital-pulse" />
            Real-time IoT patient monitoring
          </div>

          <h1 className="font-display font-bold text-4xl md:text-5xl text-text-primary
            leading-[1.1] tracking-tight text-balance">
            Every vital sign,<br />
            <span className="text-accent-cyan">watched continuously.</span>
          </h1>

          <p className="text-base text-text-muted max-w-xl mx-auto leading-relaxed text-balance">
            VitalSync connects bedside Arduino sensors directly to clinical staff and family,
            surfacing heart rate, temperature, blood pressure, and live GPS location
            — all in a single dashboard updated the moment data changes.
          </p>

          {/* live vitals ticker */}
          <VitalsTicker />

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 bg-accent-cyan text-white
                font-semibold text-sm px-7 py-3 rounded-xl hover:bg-accent-cyan-dim
                active:scale-95 transition-all shadow-glow-cyan"
            >
              Get started <ArrowRight size={15} />
            </button>
            <button
              onClick={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 bg-bg-surface border
                border-border text-text-secondary font-semibold text-sm px-7 py-3 rounded-xl
                hover:border-accent-cyan/40 transition-all"
            >
              Learn more
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-bg-surface border-y border-border py-8 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat value="Live"   label="Data streaming" />
          <Stat value="< 2s"   label="Sensor-to-screen latency" />
          <Stat value="2 roles" label="Doctor · Family" />
          <Stat value="IoT"    label="Arduino integration" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[11px] font-mono text-accent-cyan uppercase tracking-widest mb-3">
            Platform capabilities
          </p>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
            Built for clinical environments
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={Activity}
            title="Live Vital Monitoring"
            body="Heart rate, temperature, systolic and diastolic blood pressure streamed from hardware sensors to the dashboard in under two seconds."
            accent="bg-status-critical"
          />
          <FeatureCard
            icon={Bell}
            title="Intelligent Alerts"
            body="PostgreSQL-level triggers fire the moment a reading crosses a threshold — no polling, no missed events, even across multiple patients."
            accent="bg-status-warning"
          />
          <FeatureCard
            icon={MapPin}
            title="GPS Location Tracking"
            body="Live patient location with breadcrumb trail rendered on an interactive map. Recenter with one tap, no Google billing required."
            accent="bg-accent-cyan"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Health Trend Charts"
            body="Historical vitals plotted per patient so clinicians can spot gradual deterioration that a single reading would miss."
            accent="bg-status-stable"
          />
          <FeatureCard
            icon={Shield}
            title="Role-Based Access"
            body="Doctors, nurses, and family members see different views of the same patient data — scoped strictly by Supabase row-level security."
            accent="bg-accent-cyan-dim"
          />
          <FeatureCard
            icon={Cpu}
            title="Arduino IoT Bridge"
            body="Sensor readings are ingested via ThingSpeak and written into Supabase in real time, bridging the physical and digital care environment."
            accent="bg-text-secondary"
          />
        </div>
      </section>

      {/* ── CTA / Sign-in section ── */}
      <section ref={ctaRef}
        className="bg-bg-surface border-t border-border px-6 py-20">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-[11px] font-mono text-accent-cyan uppercase tracking-widest mb-3">
            Access the portal
          </p>
          <h2 className="font-display font-bold text-2xl md:text-3xl text-text-primary mb-3">
            Sign in to your dashboard
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Choose the portal that matches your role. All access is verified and
            scoped to the patients you are authorised to view.
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-3">
          <RoleCard
            icon={Activity}
            role="Clinical Staff Portal"
            description="Doctors and nurses — full vitals dashboard, alerts, GPS tracker, and patient management."
            onClick={() => navigate('/auth')}
          />
          <RoleCard
            icon={Heart}
            role="Family Portal"
            description="Authorised family members — view your patient's current readings and location in real time."
            onClick={() => navigate('/auth')}
          />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-accent-cyan" />
            <span className="text-xs font-mono text-text-muted">VitalSync Clinical Portal</span>
          </div>
          <p className="text-[11px] font-mono text-text-muted">
            IoT Patient Monitoring System
          </p>
        </div>
      </footer>
    </div>
  );
}