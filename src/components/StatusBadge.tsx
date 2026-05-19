import { statusBg } from '@/services/vitals';
import type { PatientStatus } from '@/types';

interface StatusBadgeProps {
  status: PatientStatus;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const STATUS_LABELS: Record<PatientStatus, string> = {
  critical: 'Critical',
  warning: 'Warning',
  stable: 'Stable',
  inactive: 'Inactive',
};

export default function StatusBadge({ status, pulse = false, size = 'md' }: StatusBadgeProps) {
  const colorClass = statusBg(status);
  const label = STATUS_LABELS[status];

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full font-mono font-bold uppercase tracking-wider ${colorClass} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}>
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full bg-current`}>
        {pulse && status === 'critical' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
        )}
      </span>
      {label}
    </span>
  );
}
