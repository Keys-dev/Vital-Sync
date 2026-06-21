import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Wifi, WifiOff, Gauge, Clock } from 'lucide-react';
import { computeSpeedKmh, timeAgo } from '@/services/vitals';

const DEFAULT_CENTER: [number, number] = [6.5244, 3.3792]; // Lagos
const STALE_MS = 5 * 60 * 1000; // no fix for 5min => treat as offline

/** A single timestamped GPS fix, oldest → newest. */
export interface TrackPoint {
  lat:       number;
  lng:       number;
  timestamp: string; // ISO string
}

interface Props {
  latitude:    number | null;
  longitude:   number | null;
  patientName: string;
  /** Chronological (oldest → newest) GPS history for the breadcrumb trail. */
  history?:    TrackPoint[];
}

// Custom pulsing "live" marker built from a plain divIcon — no external image
// assets needed, styled entirely with CSS (keyframes live in index.css).
const pulsingIcon = L.divIcon({
  className: '',
  html: `<div class="gps-pulse-marker"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function LiveMap({ latitude, longitude, patientName, history = [] }: Props) {
  const hasCoords = latitude != null && longitude != null;
  const position: [number, number] | null = hasCoords ? [latitude!, longitude!] : null;

  const trail = history.filter((p) => p.lat != null && p.lng != null);
  const trailLatLngs: [number, number][] = trail.map((p) => [p.lat, p.lng]);

  const latestFix = trail[trail.length - 1] ?? null;
  const prevFix    = trail[trail.length - 2] ?? null;
  const speedKmh   = latestFix && prevFix ? computeSpeedKmh(prevFix, latestFix) : null;

  const isStale = latestFix
    ? Date.now() - new Date(latestFix.timestamp).getTime() > STALE_MS
    : true;

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest">
          Live Location
        </p>
        <ConnectionBadge connected={hasCoords && !isStale} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
        {/* Map */}
        <div className="h-64 lg:h-72 rounded-lg overflow-hidden relative border border-border">
          <MapContainer
            center={position ?? DEFAULT_CENTER}
            zoom={15}
            scrollWheelZoom
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {trailLatLngs.length > 1 && (
              <Polyline positions={trailLatLngs} pathOptions={{ color: '#22d3ee', weight: 3, opacity: 0.8 }} />
            )}
            {position && (
              <>
                <RecenterOnChange position={position} />
                <Marker position={position} icon={pulsingIcon}>
                  <Popup>
                    <strong>{patientName}</strong>
                    <br />
                    {position[0].toFixed(5)}, {position[1].toFixed(5)}
                  </Popup>
                </Marker>
              </>
            )}
          </MapContainer>

          {!hasCoords && (
            <div className="absolute inset-0 flex flex-col items-center justify-center
              gap-2 bg-bg-elevated/80 pointer-events-none z-[1000]">
              <MapPin size={20} className="text-text-muted opacity-40" />
              <p className="text-xs font-mono text-text-muted">Waiting for GPS coordinates</p>
            </div>
          )}
        </div>

        {/* Telemetry sidebar */}
        <TelemetryPanel
          latitude={latitude}
          longitude={longitude}
          speedKmh={speedKmh}
          lastUpdated={latestFix?.timestamp ?? null}
        />
      </div>
    </div>
  );
}

// Pans the map smoothly whenever the live position changes, without forcing
// zoom/recenter on every single render (matches the original "camera
// isolation" behavior — only the position prop, not user pan/zoom, drives it).
function RecenterOnChange({ position }: { position: [number, number] }) {
  const map = useMap();
  const lastRef = useRef<string>('');

  useEffect(() => {
    const key = `${position[0]},${position[1]}`;
    if (lastRef.current === key) return;
    lastRef.current = key;
    map.panTo(position);
  }, [map, position]);

  return null;
}

// ─── Telemetry Sidebar ───────────────────────────────────────────────────

function TelemetryPanel({
  latitude, longitude, speedKmh, lastUpdated,
}: {
  latitude:    number | null;
  longitude:   number | null;
  speedKmh:    number | null;
  lastUpdated: string | null;
}) {
  return (
    <div className="space-y-2">
      <Stat label="Latitude"  value={latitude  != null ? latitude.toFixed(6)  : '--.------'} />
      <Stat label="Longitude" value={longitude != null ? longitude.toFixed(6) : '--.------'} />
      <Stat
        label="Speed"
        icon={<Gauge size={11} className="text-accent-cyan" />}
        value={speedKmh != null ? `${speedKmh.toFixed(1)} km/h` : '0.0 km/h'}
      />
      <Stat
        label="Last Fix"
        icon={<Clock size={11} className="text-text-muted" />}
        value={lastUpdated ? timeAgo(lastUpdated) : '—'}
      />
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-bg-base/60 border border-border rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon}
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-wide">{label}</span>
      </div>
      <span className="font-mono text-sm text-text-primary">{value}</span>
    </div>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="flex items-center gap-1 text-[10px] font-mono text-accent-cyan">
      <Wifi size={11} /> Live
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
      <WifiOff size={11} /> No GPS fix yet
    </span>
  );
}