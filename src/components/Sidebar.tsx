import { useProfile } from '@/hooks/useProfile';
import { useDevices } from '@/hooks/useDevices';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, Bell, MapPin, Settings, Activity, Wifi, WifiOff, UserCheck, Cpu } from 'lucide-react';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients',  icon: Users,           label: 'Patients' },
  { to: '/trends',    icon: TrendingUp,      label: 'Health Trends' },
  { to: '/alerts',    icon: Bell,            label: 'Alerts' },
  { to: '/gps',       icon: MapPin,          label: 'GPS Tracker' },
  { to: '/devices',   icon: Cpu,             label: 'Devices' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
  { to: '/requests',  icon: UserCheck,       label: 'Access Requests' },
];

interface SidebarProps {
  alertCount: number;
  isLive: boolean; // kept for API compatibility with Layout.tsx
}

export default function Sidebar({ alertCount }: SidebarProps) {
  const { profile }  = useProfile();
  const { devices }  = useDevices();
  const location     = useLocation();

  const onlineCount  = devices.filter((d) => d.status === 'online').length;
  const isConnected  = onlineCount > 0;

  const initials = profile?.full_name
    ?.trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') ?? '?';

  return (
    <aside className="hidden md:flex flex-col w-60 bg-bg-surface border-r border-border h-screen sticky top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
            <Activity size={16} className="text-accent-cyan" />
          </div>
          <div>
            <h1 className="font-display text-sm font-700 text-text-primary tracking-wide">VitalSync</h1>
            <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Clinical Portal</p>
          </div>
        </div>
      </div>

      {/* Device connection status */}
      <div className="px-5 py-3 border-b border-border">
        <div className={`flex items-center gap-2 text-xs font-mono ${isConnected ? 'text-status-stable' : 'text-status-inactive'}`}>
          {isConnected
            ? <><Wifi size={12} /><span>DEVICE ONLINE · {onlineCount}</span><span className="w-1.5 h-1.5 rounded-full bg-status-stable vital-pulse ml-auto" /></>
            : <><WifiOff size={12} /><span>{devices.length === 0 ? 'NO DEVICES' : 'DEVICE OFFLINE'}</span></>
          }
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group
                ${isActive
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-transparent'}
              `}
            >
              <Icon size={16} className={isActive ? 'text-accent-cyan' : 'text-text-muted group-hover:text-text-secondary'} />
              <span>{label}</span>
              {label === 'Alerts' && alertCount > 0 && (
                <span className="ml-auto bg-status-critical text-white text-[10px] font-bold font-mono rounded-full w-4 h-4 flex items-center justify-center vital-pulse">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent-cyan rounded-r-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer — real doctor name */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-xs font-bold text-accent-cyan font-mono">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">
              {profile?.full_name ?? '…'}
            </p>
            <p className="text-[10px] text-text-muted truncate capitalize">
              {profile?.role ?? ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}