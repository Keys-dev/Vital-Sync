import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, MapPin, Settings } from 'lucide-react';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/gps', icon: MapPin, label: 'GPS' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface MobileNavProps { alertCount: number }

export default function MobileNav({ alertCount }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-surface/95 glass border-t border-border">
      <div className="flex">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative text-xs transition-colors
              ${isActive ? 'text-accent-cyan' : 'text-text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  {label === 'Alerts' && alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-status-critical text-white text-[8px] font-bold rounded-full flex items-center justify-center vital-pulse">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </div>
                <span className="font-medium" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>
                  {label.toUpperCase()}
                </span>
                {isActive && (
                  <span className="absolute top-0 inset-x-0 h-0.5 bg-accent-cyan rounded-b" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
