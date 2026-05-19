import { Bell, Search, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Patient Overview',
  '/patients': 'Patient Roster',
  '/trends': 'Health Trends',
  '/alerts': 'Alerts & Notifications',
  '/gps': 'GPS Tracker',
  '/settings': 'Settings',
};

interface TopBarProps {
  alertCount: number;
  isLive: boolean;
}

export default function TopBar({ alertCount, isLive }: TopBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? 'VitalSync';
  const now = new Date().toLocaleString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <header className="h-14 bg-bg-surface/80 glass border-b border-border flex items-center px-4 md:px-6 gap-4 sticky top-0 z-20">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h2 className="font-display font-700 text-base text-text-primary truncate">{title}</h2>
        <p className="text-[10px] font-mono text-text-muted hidden sm:block">{now}</p>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-bg-elevated border border-border rounded-lg px-3 py-1.5 w-48 focus-within:border-accent-cyan/50 transition-colors">
        <Search size={13} className="text-text-muted flex-shrink-0" />
        <input
          type="text"
          placeholder="Search patient..."
          className="bg-transparent text-xs text-text-primary placeholder-text-muted outline-none w-full font-mono"
        />
      </div>

      {/* Live dot */}
      <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-status-stable vital-pulse' : 'bg-status-inactive'}`} />
        <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
      </div>

      {/* Refresh */}
      <button
        onClick={() => window.location.reload()}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-border-bright transition-colors"
      >
        <RefreshCw size={14} />
      </button>

      {/* Alerts bell */}
      <button
        onClick={() => navigate('/alerts')}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-border-bright transition-colors"
      >
        <Bell size={14} />
        {alertCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-critical rounded-full text-[9px] font-bold text-white flex items-center justify-center vital-pulse">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </button>
    </header>
  );
}
