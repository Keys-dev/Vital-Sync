import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import type { VitalsRow } from '@/types';

interface ChartConfig {
  key:       keyof Pick<VitalsRow, 'heart_rate' | 'temperature' | 'systolic_bp' | 'diastolic_bp'>;
  label:     string;
  unit:      string;
  stroke:    string;
  domain:    [number, number];
  warnLow?:  number;
  warnHigh?: number;
}

const CHARTS: ChartConfig[] = [
  { key: 'heart_rate',   label: 'Heart Rate',   unit: 'bpm',  stroke: '#d9293d', domain: [30, 150],  warnLow: 50,  warnHigh: 100  },
  { key: 'temperature',  label: 'Temperature',  unit: '°C',   stroke: '#b87800', domain: [33, 42],   warnLow: 35,  warnHigh: 38.5 },
  { key: 'systolic_bp',  label: 'Systolic BP',  unit: 'mmHg', stroke: '#7c3aed', domain: [60, 200],  warnLow: 90,  warnHigh: 140  },
  { key: 'diastolic_bp', label: 'Diastolic BP', unit: 'mmHg', stroke: '#a78bfa', domain: [40, 130],  warnLow: 60,  warnHigh: 90   },
];

function toChartData(vitals: VitalsRow[]) {
  return [...vitals].reverse().map((v) => ({
    heart_rate:   v.heart_rate   != null ? Math.round(v.heart_rate   * 10) / 10 : null,
    temperature:  v.temperature  != null ? Math.round(v.temperature  * 10) / 10 : null,
    systolic_bp:  v.systolic_bp  != null ? Math.round(v.systolic_bp)            : null,
    diastolic_bp: v.diastolic_bp != null ? Math.round(v.diastolic_bp)           : null,
    time: new Date(v.recorded_at).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
  }));
}

export default function VitalsChart({ vitals }: { vitals: VitalsRow[] }) {
  const data = toChartData(vitals);

  if (data.length === 0) {
    return (
      <div className="bg-bg-surface border border-dashed border-border rounded-xl p-10 text-center">
        <p className="text-sm font-mono text-text-muted">Waiting for first reading…</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {CHARTS.map((cfg) => {
        const latest    = data[data.length - 1]?.[cfg.key];
        const isWarning = latest != null && (
          (cfg.warnLow  != null && latest < cfg.warnLow)  ||
          (cfg.warnHigh != null && latest > cfg.warnHigh)
        );

        return (
          <div key={cfg.key}
            className={`bg-bg-surface border rounded-xl p-4 transition-all duration-300
              ${isWarning ? 'border-status-warning/40 warning-glow' : 'border-border'}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest">
                  {cfg.label}
                </p>
                <p className="font-display text-2xl font-700 mt-0.5"
                  style={{ color: isWarning ? '#b87800' : cfg.stroke }}>
                  {latest != null ? `${latest} ${cfg.unit}` : '—'}
                </p>
              </div>
              {isWarning && (
                <span className="text-[10px] font-mono font-semibold bg-status-warning/10
                  border border-status-warning/30 text-status-warning rounded-full px-2 py-0.5">
                  ⚠ Out of range
                </span>
              )}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#6a8fa8', fontSize: 9 }}
                  tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis domain={cfg.domain} tick={{ fill: '#6a8fa8', fontSize: 9 }}
                  tickLine={false} axisLine={false} width={38} />
                <Tooltip
                  contentStyle={{
                    background: '#fff', border: '1px solid #c2d4e4',
                    borderRadius: 8, fontSize: 12, color: '#0d1f2d',
                  }}
                  formatter={(v: number) => [`${v} ${cfg.unit}`, cfg.label]}
                />
                {cfg.warnHigh != null && (
                  <ReferenceLine y={cfg.warnHigh} stroke="#b87800" strokeDasharray="4 4" strokeOpacity={0.5} />
                )}
                {cfg.warnLow != null && (
                  <ReferenceLine y={cfg.warnLow} stroke="#b87800" strokeDasharray="4 4" strokeOpacity={0.5} />
                )}
                <Line type="monotone" dataKey={cfg.key} stroke={cfg.stroke}
                  strokeWidth={2} dot={false}
                  activeDot={{ r: 3, strokeWidth: 0, fill: cfg.stroke }}
                  connectNulls={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}