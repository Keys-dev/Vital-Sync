import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Activity, Activity as MonitorIcon, LogOut } from 'lucide-react';
import CriticalAlertBanner from '@/components/CriticalAlertBanner';

export default function FamilyLayout() {
  const { signOut }  = useAuthContext();
  const { profile }  = useProfile();
  const navigate     = useNavigate();

  const initials = profile?.full_name
    ?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? 'FM';

  return (
    <div className="flex h-full min-h-screen bg-bg-base grid-bg">

      {/* ── Desktop Sidebar (md+) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 bg-bg-surface border-r border-border h-screen sticky top-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-teal/10 border border-accent-teal/30
              flex items-center justify-center">
              <Activity size={16} className="text-accent-teal" />
            </div>
            <div>
              <h1 className="font-display text-sm font-700 text-text-primary tracking-wide">VitalSync</h1>
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Family Portal</p>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 border-b border-border">
          <div className="inline-flex items-center gap-1.5 bg-accent-teal/10 border border-accent-teal/20
            rounded-full px-3 py-1 text-[11px] font-mono font-semibold text-accent-teal">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-teal vital-pulse" />
            Family Member
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <NavLink to="/family" end className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
            ${isActive
              ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-transparent'}`
          }>
            <MonitorIcon size={16} />
            My Patient
          </NavLink>
        </nav>

        {/* User footer */}
        <div className="px-5 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-teal/10 border border-accent-teal/20
              flex items-center justify-center text-xs font-bold text-accent-teal font-mono flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-primary truncate">{profile?.full_name}</p>
              <p className="text-[10px] text-text-muted truncate">{profile?.email}</p>
            </div>
            <button
              onClick={async () => { await signOut(); navigate('/auth', { replace: true }); }}
              className="text-text-muted hover:text-status-critical transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-bg-surface border-b border-border sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-center">
              <Activity size={14} className="text-accent-teal" />
            </div>
            <div>
              <h1 className="font-display text-xs font-700 text-text-primary tracking-wide leading-none">VitalSync</h1>
              <p className="text-[9px] text-text-muted font-mono uppercase tracking-widest">Family Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-accent-teal/10 border border-accent-teal/20
              flex items-center justify-center text-[10px] font-bold text-accent-teal font-mono">
              {initials}
            </div>
            <button
              onClick={async () => { await signOut(); navigate('/auth', { replace: true }); }}
              className="text-text-muted hover:text-status-critical transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Alert banner — appears on all family pages when alerts fire */}
        <CriticalAlertBanner />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-up pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* ── Mobile bottom nav ──────────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-surface border-t border-border">
          {/* Role badge */}
          <div className="flex items-center justify-center pt-2 pb-0.5">
            <div className="inline-flex items-center gap-1 bg-accent-teal/10 border border-accent-teal/20
              rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold text-accent-teal">
              <span className="w-1 h-1 rounded-full bg-accent-teal vital-pulse" />
              Family Member
            </div>
          </div>

          <div className="flex items-center justify-center px-4 py-2">
            <NavLink
              to="/family"
              end
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-8 py-2 rounded-xl transition-all text-xs font-mono font-medium
                ${isActive
                  ? 'text-accent-teal bg-accent-teal/10'
                  : 'text-text-muted hover:text-text-secondary'}`
              }
            >
              <MonitorIcon size={20} />
              My Patient
            </NavLink>
          </div>

          {/* User info strip */}
          <div className="flex items-center justify-center gap-2 px-4 pb-3 pt-1 border-t border-border/50">
            <p className="text-[10px] font-mono text-text-muted truncate max-w-[200px]">
              {profile?.full_name ?? profile?.email ?? 'Family Member'}
            </p>
          </div>
        </nav>
      </div>
    </div>
  );
}