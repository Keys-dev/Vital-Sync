import { isVitalAbnormal } from '@/services/vitals';
import type { VitalSigns } from '@/types';

interface VitalCardProps {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  vitalKey: keyof Omit<VitalSigns, 'timestamp'>;
  rawValue: number;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export default function VitalCard({
  label, value, unit, icon, vitalKey, rawValue, trend, className = '',
}: VitalCardProps) {
  const state = isVitalAbnormal(vitalKey, rawValue);
  const colorClass =
    state === 'critical' ? 'text-status-critical' :
    state === 'warning'  ? 'text-status-warning'  : 'text-status-stable';

  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up'
    ? 'text-status-warning'
    : trend === 'down'
    ? 'text-accent-cyan'
    : 'text-text-muted';

  return (
    <div className={`card flex flex-col gap-3 animate-fade-up ${className}`}>
      <div className="flex items-center justify-between">
        <span className="vital-label">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-bg-overlay flex items-center justify-center text-text-secondary">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className={`vital-value ${colorClass}`}>{value}</span>
        <span className="text-xs text-text-muted mb-1">{unit}</span>
        {trend && (
          <span className={`text-sm font-bold mb-1 ml-auto ${trendColor}`}>{trendArrow}</span>
        )}
      </div>
    </div>
  );
}
