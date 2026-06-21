import { useCallback, useState } from 'react';
import { MapPin, Navigation, Wifi, WifiOff, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { usePatients } from '@/hooks/usePatients';
import { statusBg, timeAgo } from '@/services/vitals';
import type { Patient } from '@/types';

// Lagos hospital campus center
const MAP_CENTER: [number, number] = [6.5244, 3.3792];

// ─── Custom Marker (diamond pin, color-coded by status) ───────────────────

function buildPatientIcon(patient: Patient, isSelected: boolean) {
  const color =
    patient.status === 'critical' ? '#ff4757'
    : patient.status === 'warning' ? '#ffb800'
    : '#00e5a0';

  const size = isSelected ? 44 : 34;

  const html = `
    <div style="
      width:${size}px;height:${size}px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${color};
      border:${isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.4)'};
      box-shadow:${isSelected ? `0 0 0 4px ${color}40, 0 4px 16px ${color}80` : `0 2px 8px ${color}60`};
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="
        transform:rotate(45deg);
        font-size:${isSelected ? 14 : 11}px;font-weight:700;color:#fff;
        font-family:'JetBrains Mono',monospace;
        text-shadow:0 1px 2px rgba(0,0,0,0.4);
      ">${patient.id.replace('P', '')}</span>
    </div>`;

  return L.divIcon({
    className: '',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size], // tip of the diamond points at the location
  });
}

// ─── Map Component ──────────────────────────────────────────────────────────

function PatientMap({
  patients,
  selected,
  onSelect,
}: {
  patients: Patient[];
  selected: Patient | null;
  onSelect: (p: Patient) => void;
}) {
  const map = useMap();

  const handleSelect = useCallback(
    (p: Patient) => {
      onSelect(p);
      map.panTo([p.location.lat, p.location.lng]);
    },
    [map, onSelect]
  );

  return (
    <>
      {patients.map((p) => (
        <Marker
          key={p.id}
          position={[p.location.lat, p.location.lng]}
          icon={buildPatientIcon(p, selected?.id === p.id)}
          eventHandlers={{ click: () => handleSelect(p) }}
          zIndexOffset={selected?.id === p.id ? 1000 : 0}
        >
          <Popup>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', minWidth: 180 }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#0c1824' }}>{p.name}</p>
              <p style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{p.bedNumber}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                <div><span style={{ color: '#999' }}>HR</span><br /><strong style={{ color: '#e53e3e' }}>{p.vitals.heartRate} bpm</strong></div>
                <div><span style={{ color: '#999' }}>Temp</span><br /><strong style={{ color: '#dd6b20' }}>{p.vitals.temperature}°C</strong></div>
                <div><span style={{ color: '#999' }}>SBP</span><br /><strong style={{ color: '#6b46c1' }}>{p.vitals.systolicBP} mmHg</strong></div>
                <div><span style={{ color: '#999' }}>DBP</span><br /><strong style={{ color: '#6b46c1' }}>{p.vitals.diastolicBP} mmHg</strong></div>
              </div>
              <p style={{ fontSize: 10, color: '#aaa', marginTop: 6 }}>Updated {timeAgo(p.vitals.timestamp)}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function GPSTracker() {
  const { patients, isLive } = usePatients();
  const [selected, setSelected] = useState<Patient | null>(null);

  const filtered = patients;

  const handleSelect = useCallback((p: Patient) => {
    setSelected((prev) => (prev?.id === p.id ? null : p));
  }, []);

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tracked Patients', value: patients.length, icon: MapPin, color: 'text-accent-cyan' },
          { label: 'Devices Online', value: `${patients.length - 1}/${patients.length}`, icon: Wifi, color: 'text-status-stable' },
          { label: 'Device Offline', value: 1, icon: WifiOff, color: 'text-status-inactive' },
          { label: 'Critical Location', value: patients.filter((p) => p.status === 'critical').length, icon: Activity, color: 'text-status-critical' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={13} className={color} />
              <span className="text-[10px] font-mono text-text-muted">{label}</span>
            </div>
            <p className={`text-2xl font-display font-700 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map */}
        <div className="relative lg:col-span-2 rounded-xl overflow-hidden border border-border" style={{ minHeight: 460 }}>
          <MapContainer
            center={MAP_CENTER}
            zoom={15}
            scrollWheelZoom
            style={{ width: '100%', height: '100%', minHeight: 460 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PatientMap patients={filtered} selected={selected} onSelect={handleSelect} />
          </MapContainer>

          {/* Live badge overlay */}
          <div className="absolute top-3 left-3 pointer-events-none z-[1000]">
            <div className="flex items-center gap-1.5 bg-bg-elevated/90 border border-border rounded-lg px-2 py-1 text-[10px] font-mono text-status-stable backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-status-stable vital-pulse" />
              {isLive ? 'LIVE TRACKING' : 'SIMULATED'}
            </div>
          </div>
        </div>

        {/* Patient list panel */}
        <div
          className="bg-bg-surface border border-border rounded-xl overflow-hidden flex flex-col"
          style={{ maxHeight: 460 }}
        >
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Navigation size={13} className="text-accent-cyan" />
            <span className="text-xs font-mono font-semibold text-text-primary">Patient Locations</span>
            <span className="ml-auto text-[10px] font-mono text-text-muted">{filtered.length} tracked</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map((p) => {
              const isOnline = p.id !== 'P006';
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 cursor-pointer transition-all ${
                    selected?.id === p.id
                      ? 'bg-accent-cyan/5 border-l-2 border-l-accent-cyan'
                      : 'hover:bg-bg-elevated'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      p.status === 'critical'
                        ? 'bg-status-critical vital-pulse'
                        : p.status === 'warning'
                        ? 'bg-status-warning vital-pulse'
                        : 'bg-status-stable'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{p.name}</p>
                    <p className="text-[10px] font-mono text-text-muted">
                      {p.bedNumber}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusBg(p.status)}`}
                    >
                      {p.status}
                    </span>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      {isOnline ? (
                        <Wifi size={9} className="text-status-stable" />
                      ) : (
                        <WifiOff size={9} className="text-status-inactive" />
                      )}
                      <span className="text-[9px] font-mono text-text-muted">
                        {isOnline ? 'online' : 'offline'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected patient detail bar */}
      {selected && (
        <div
          className={`bg-bg-surface border rounded-xl p-5 transition-all ${
            selected.status === 'critical'
              ? 'critical-glow border-red-500/30'
              : selected.status === 'warning'
              ? 'warning-glow border-yellow-500/30'
              : 'border-border'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MapPin size={16} className="text-accent-cyan" />
                <h4 className="font-display font-700 text-sm text-text-primary">{selected.name}</h4>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${statusBg(selected.status)}`}
                >
                  {selected.status}
                </span>
              </div>
              <p className="text-xs text-text-muted font-mono">
                {selected.bedNumber} · {selected.diagnosis}
              </p>
              <p className="text-xs text-text-muted font-mono mt-1">
                Last update: {timeAgo(selected.vitals.timestamp)}
              </p>
              <p className="text-[10px] text-text-muted font-mono mt-0.5">
                📍 {selected.location.lat.toFixed(4)}, {selected.location.lng.toFixed(4)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-mono">
              <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2">
                <p className="text-text-muted text-[10px]">Heart Rate</p>
                <p className="text-status-critical font-bold">{selected.vitals.heartRate} bpm</p>
              </div>
              <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2">
                <p className="text-text-muted text-[10px]">Temperature</p>
                <p className="text-orange-400 font-bold">{selected.vitals.temperature}°C</p>
              </div>
              <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2">
                <p className="text-text-muted text-[10px]">Systolic BP</p>
                <p className="text-purple-400 font-bold">{selected.vitals.systolicBP} mmHg</p>
              </div>
              <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2">
                <p className="text-text-muted text-[10px]">Diastolic BP</p>
                <p className="text-purple-400 font-bold">{selected.vitals.diastolicBP} mmHg</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}