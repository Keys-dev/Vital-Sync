import { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { DEFAULT_THRESHOLDS } from '@/services/vitals';

type Metric = 'heartRate' | 'temperature' | 'systolicBP';

const METRICS: { key: Metric; label: string; unit: string; color: string; domain: [number, number] }[] = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', color: '#ef4444', domain: [40, 160] },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#f97316', domain: [35, 41] },
  { key: 'systolicBP', label: 'Systolic BP', unit: 'mmHg', color: '#a855f7', domain: [70, 200] },
];

const THRESHOLDS: Record<Metric, { min?: number; max?: number }> = {
  heartRate: DEFAULT_THRESHOLDS.heartRate,
  temperature: DEFAULT_THRESHOLDS.temperature,
  systolicBP: DEFAULT_THRESHOLDS.systolicBP,
};

const COLORS = ['#00c8f0', '#ef4444', '#f97316', '#a855f7', '#3b82f6', '#00e5a0', '#ffb800', '#ec4899'];

function CustomTooltip({ active, payload, label, unit }: { active?: boolean; payload?: Array<{ value: number; name?: string; color?: string }>; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2 shadow-xl text-xs font-mono">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name ? `${p.name}: ` : ''}{p.value}{unit ?? ''}
        </p>
      ))}
    </div>
  );
}

function TrendBadge({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const delta = last - prev;
  if (Math.abs(delta) < 0.5) return <Minus size={12} className="text-text-muted" />;
  if (delta > 0) return <TrendingUp size={12} className="text-status-warning" />;
  return <TrendingDown size={12} className="text-status-stable" />;
}

export default function HealthTrends() {
  const { patients } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState(patients[0]?.id ?? '');
  const [selectedMetric, setSelectedMetric] = useState<Metric>('heartRate');
  const [compareMode, setCompareMode] = useState(false);
  const [comparePatients, setComparePatients] = useState<string[]>([patients[0]?.id ?? '']);

  const patient = patients.find((p) => p.id === selectedPatient);
  const metric = METRICS.find((m) => m.key === selectedMetric)!;

  const toggleCompare = (id: string) => {
    setComparePatients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  // Single patient trend data
  const singleData = patient?.vitalHistory.slice(-24) ?? [];

  // Multi patient comparison data (last 24h of selected metric)
  const compareData = singleData.map((point, i) => {
    const entry: Record<string, number | string> = { time: point.time };
    comparePatients.forEach((pid) => {
      const p = patients.find((x) => x.id === pid);
      if (p?.vitalHistory[i]) entry[pid] = p.vitalHistory[i][selectedMetric] as number;
    });
    return entry;
  });

  const latestValues = METRICS.map((m) => ({
    ...m,
    value: patient?.vitals[m.key] ?? 0,
    history: singleData.map((d) => d[m.key] as number),
  }));

  return (
    <div className="space-y-5">
      {/* Patient selector */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-display font-700 text-sm text-text-primary flex items-center gap-2">
            <TrendingUp size={16} className="text-accent-cyan" /> Health Trends Analysis
          </h3>
          <label className="flex items-center gap-2 ml-auto cursor-pointer text-xs font-mono text-text-muted">
            <div
              onClick={() => setCompareMode((v) => !v)}
              className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${compareMode ? 'bg-accent-cyan' : 'bg-bg-elevated border border-border'}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${compareMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            Compare patients
          </label>
        </div>

        {!compareMode ? (
          <div className="flex flex-wrap gap-2">
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${selectedPatient === p.id ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan' : 'border-border text-text-muted hover:text-text-primary'}`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${p.status === 'critical' ? 'bg-status-critical' : p.status === 'warning' ? 'bg-status-warning' : 'bg-status-stable'}`} />
                {p.name.split(' ')[0]} {p.name.split(' ')[1]?.[0]}.
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-text-muted">Select up to 4 patients to compare</p>
            <div className="flex flex-wrap gap-2">
              {patients.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => toggleCompare(p.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${comparePatients.includes(p.id) ? 'border-accent-cyan/30 text-accent-cyan' : 'border-border text-text-muted hover:text-text-primary'}`}
                  style={comparePatients.includes(p.id) ? { backgroundColor: COLORS[i % COLORS.length] + '18' } : {}}
                >
                  {comparePatients.includes(p.id) && <span style={{ color: COLORS[i % COLORS.length] }}>● </span>}
                  {p.name.split(' ')[0]} {p.name.split(' ')[1]?.[0]}.
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metric selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedMetric(m.key)}
            style={selectedMetric === m.key ? { borderColor: m.color + '60', backgroundColor: m.color + '14', color: m.color } : {}}
            className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-mono font-medium transition-all ${selectedMetric === m.key ? '' : 'border-border text-text-muted hover:text-text-primary'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main chart */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h4 className="font-display font-700 text-sm text-text-primary">{metric.label}</h4>
            <p className="text-xs text-text-muted font-mono">Last 24 hours · {metric.unit}</p>
          </div>
          {!compareMode && patient && (
            <div className="text-right">
              <p className="font-mono text-xl font-bold" style={{ color: metric.color }}>
                {patient.vitals[selectedMetric]}{metric.unit}
              </p>
              <div className="flex items-center gap-1 justify-end">
                <TrendBadge values={singleData.map((d) => d[selectedMetric] as number)} />
                <span className="text-[10px] text-text-muted font-mono">vs prev</span>
              </div>
            </div>
          )}
        </div>

        <ResponsiveContainer width="100%" height={280}>
          {!compareMode ? (
            <AreaChart data={singleData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metric.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a3050" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#3a6070', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis domain={metric.domain} tick={{ fontSize: 9, fill: '#3a6070', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip unit={metric.unit} />} />
              {THRESHOLDS[selectedMetric]?.max && (
                <ReferenceLine y={THRESHOLDS[selectedMetric].max} stroke="#ffb800" strokeDasharray="4 4" strokeWidth={1} />
              )}
              {THRESHOLDS[selectedMetric]?.min && (
                <ReferenceLine y={THRESHOLDS[selectedMetric].min} stroke="#ffb800" strokeDasharray="4 4" strokeWidth={1} />
              )}
              <Area type="monotone" dataKey={selectedMetric} stroke={metric.color} strokeWidth={2} fill="url(#metricGrad)" dot={false} activeDot={{ r: 4, fill: metric.color }} />
            </AreaChart>
          ) : (
            <LineChart data={compareData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#1a3050" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#3a6070', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis domain={metric.domain} tick={{ fontSize: 9, fill: '#3a6070', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip unit={metric.unit} />} />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }} />
              {comparePatients.map((pid, i) => {
                const p = patients.find((x) => x.id === pid);
                return (
                  <Line
                    key={pid}
                    type="monotone"
                    dataKey={pid}
                    name={p?.name.split(' ')[0] ?? pid}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* All-vitals snapshot cards */}
      {!compareMode && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {latestValues.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`bg-bg-surface border rounded-xl p-4 text-left transition-all hover:bg-bg-elevated ${selectedMetric === m.key ? 'border-accent-cyan/30' : 'border-border'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-text-muted">{m.label}</span>
                <TrendBadge values={m.history} />
              </div>
              <p className="font-mono font-bold text-xl" style={{ color: m.color }}>{m.value}</p>
              <p className="text-[9px] font-mono text-text-muted mt-0.5">{m.unit}</p>
              <div className="mt-2 h-0.5 bg-bg-elevated rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, ((m.value - m.domain[0]) / (m.domain[1] - m.domain[0])) * 100)}%`, backgroundColor: m.color }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
