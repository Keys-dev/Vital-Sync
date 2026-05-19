import { useState, useCallback } from 'react';
import { MapPin, Navigation, Wifi, WifiOff, Activity, Settings2 } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap, InfoWindow } from '@vis.gl/react-google-maps';
import { usePatients } from '@/hooks/usePatients';
import { useSettings } from '@/hooks/useSettings';
import { statusBg, timeAgo } from '@/services/vitals';
import type { Patient } from '@/types';

// Lagos hospital campus center
const MAP_CENTER = { lat: 6.5244, lng: 3.3792 };

// ─── Custom Marker ──────────────────────────────────────────────────────────

function PatientMarker({
  patient,
  isSelected,
  onSelect,
}: {
  patient: Patient;
  isSelected: boolean;
  onSelect: (p: Patient) => void;
}) {
  const color =
    patient.status === 'critical'
      ? '#ff4757'
      : patient.status === 'warning'
      ? '#ffb800'
      : '#00e5a0';

  const size = isSelected ? 44 : 34;

  return (
    <AdvancedMarker
      position={{ lat: patient.location.lat, lng: patient.location.lng }}
      onClick={() => onSelect(patient)}
      zIndex={isSelected ? 100 : 1}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          background: color,
          border: isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.4)',
          boxShadow: isSelected
            ? `0 0 0 4px ${color}40, 0 4px 16px ${color}80`
            : `0 2px 8px ${color}60`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            transform: 'rotate(45deg)',
            fontSize: isSelected ? 14 : 11,
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'JetBrains Mono, monospace',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          {patient.id.replace('P', '')}
        </span>
      </div>
    </AdvancedMarker>
  );
}

// ─── Info Panel on Map ──────────────────────────────────────────────────────

function PatientInfoWindow({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) {
  return (
    <InfoWindow
      position={{ lat: patient.location.lat, lng: patient.location.lng }}
      onCloseClick={onClose}
      pixelOffset={[0, -40]}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', minWidth: 200, padding: '4px 2px' }}>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#0c1824' }}>
          {patient.name}
        </p>
        <p style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
          {patient.ward} · {patient.bedNumber}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            fontSize: 11,
          }}
        >
          <div>
            <span style={{ color: '#999' }}>HR</span>
            <br />
            <strong style={{ color: '#e53e3e' }}>{patient.vitals.heartRate} bpm</strong>
          </div>
          <div>
            <span style={{ color: '#999' }}>Temp</span>
            <br />
            <strong style={{ color: '#dd6b20' }}>{patient.vitals.temperature}°C</strong>
          </div>
          <div>
            <span style={{ color: '#999' }}>SBP</span>
            <br />
            <strong style={{ color: '#6b46c1' }}>{patient.vitals.systolicBP} mmHg</strong>
          </div>
          <div>
            <span style={{ color: '#999' }}>DBP</span>
            <br />
            <strong style={{ color: '#6b46c1' }}>{patient.vitals.diastolicBP} mmHg</strong>
          </div>
        </div>
        <p style={{ fontSize: 10, color: '#aaa', marginTop: 6 }}>
          Updated {timeAgo(patient.vitals.timestamp)}
        </p>
      </div>
    </InfoWindow>
  );
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
      if (map) {
        map.panTo({ lat: p.location.lat, lng: p.location.lng });
      }
    },
    [map, onSelect]
  );

  return (
    <>
      {patients.map((p) => (
        <PatientMarker
          key={p.id}
          patient={p}
          isSelected={selected?.id === p.id}
          onSelect={handleSelect}
        />
      ))}
      {selected && (
        <PatientInfoWindow
          patient={selected}
          onClose={() => onSelect(selected)}
        />
      )}
    </>
  );
}

// ─── No Key Placeholder ─────────────────────────────────────────────────────

function NoKeyPlaceholder() {
  return (
    <div className="relative w-full bg-bg-base border border-border rounded-xl overflow-hidden flex flex-col items-center justify-center gap-4 text-center"
      style={{ minHeight: 400 }}>
      <div className="w-14 h-14 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
        <Settings2 size={24} className="text-accent-cyan" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary mb-1">Google Maps API Key Required</p>
        <p className="text-xs text-text-muted max-w-xs">
          Go to <span className="text-accent-cyan font-mono">Settings → IoT Connectivity</span> and
          paste your Google Maps API key to enable the live tracking map.
        </p>
      </div>
      <a
        href="https://console.cloud.google.com/google/maps-apis"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono text-accent-cyan border border-accent-cyan/30 px-4 py-1.5 rounded-lg hover:bg-accent-cyan/10 transition-colors"
      >
        Get a free API key →
      </a>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function GPSTracker() {
  const { patients, isLive } = usePatients();
  const { settings } = useSettings();
  const [selected, setSelected] = useState<Patient | null>(null);
  const [wardFilter, setWardFilter] = useState<string>('All');

  const apiKey = settings.googleMapsApiKey;
  const wards = ['All', ...Array.from(new Set(patients.map((p) => p.ward)))];
  const filtered = wardFilter === 'All' ? patients : patients.filter((p) => p.ward === wardFilter);

  const handleSelect = useCallback(
    (p: Patient) => {
      setSelected((prev) => (prev?.id === p.id ? null : p));
    },
    []
  );

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

      {/* Ward filter */}
      <div className="flex gap-1 overflow-x-auto">
        {wards.map((w) => (
          <button
            key={w}
            onClick={() => setWardFilter(w)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              wardFilter === w
                ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                : 'border-border text-text-muted hover:text-text-primary'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Google Map */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden border border-border" style={{ minHeight: 460 }}>
          {!apiKey ? (
            <NoKeyPlaceholder />
          ) : (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={MAP_CENTER}
                defaultZoom={15}
                mapId="vitalsync-map"
                style={{ width: '100%', height: '100%', minHeight: 460 }}
                gestureHandling="greedy"
                disableDefaultUI={false}
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
              >
                <PatientMap patients={filtered} selected={selected} onSelect={handleSelect} />
              </Map>
            </APIProvider>
          )}

          {/* Live badge overlay */}
          {apiKey && (
            <div className="absolute top-3 left-3 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-bg-elevated/90 border border-border rounded-lg px-2 py-1 text-[10px] font-mono text-status-stable backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-status-stable vital-pulse" />
                {isLive ? 'LIVE TRACKING' : 'SIMULATED'}
              </div>
            </div>
          )}
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
                      {p.ward} · {p.bedNumber}
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
                {selected.ward} · {selected.bedNumber} · {selected.diagnosis}
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
