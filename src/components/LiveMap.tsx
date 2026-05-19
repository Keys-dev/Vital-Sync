import { useEffect, useState } from 'react';
import {
  APIProvider, Map, AdvancedMarker, useMap, InfoWindow,
} from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

const MAPS_KEY       = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const DEFAULT_CENTER = { lat: 6.5244, lng: 3.3792 }; // Lagos

interface Props {
  latitude:    number | null;
  longitude:   number | null;
  patientName: string;
}

export default function LiveMap({ latitude, longitude, patientName }: Props) {
  const hasCoords = latitude != null && longitude != null;
  const position  = hasCoords ? { lat: latitude!, lng: longitude! } : null;

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest">
          Live Location
        </p>
        {hasCoords ? (
          <span className="text-[10px] font-mono text-accent-cyan">
            {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-text-muted">No GPS fix yet</span>
        )}
      </div>

      {/* Map */}
      <div className="h-64 rounded-lg overflow-hidden relative border border-border">
        <APIProvider apiKey={MAPS_KEY}>
          <Map
            defaultCenter={position ?? DEFAULT_CENTER}
            center={position ?? DEFAULT_CENTER}
            defaultZoom={15}
            mapId="vitalsync-map"
            disableDefaultUI
            gestureHandling="cooperative"
            style={{ width: '100%', height: '100%' }}
          >
            {position && <PulsingMarker position={position} label={patientName} />}
          </Map>
        </APIProvider>

        {!hasCoords && (
          <div className="absolute inset-0 flex flex-col items-center justify-center
            gap-2 bg-bg-elevated/80 pointer-events-none">
            <MapPin size={20} className="text-text-muted opacity-40" />
            <p className="text-xs font-mono text-text-muted">Waiting for GPS coordinates</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PulsingMarker({
  position, label,
}: {
  position: { lat: number; lng: number };
  label:    string;
}) {
  const map             = useMap();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    map?.panTo(position);
  }, [map, position.lat, position.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <AdvancedMarker position={position} onClick={() => setOpen((o) => !o)}>
        <div className="relative w-5 h-5 cursor-pointer">
          <span className="absolute inset-0 rounded-full bg-accent-cyan/40 animate-ping" />
          <span className="absolute inset-[20%] rounded-full bg-accent-cyan border-2 border-white shadow" />
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow position={position} onCloseClick={() => setOpen(false)}>
          <div style={{ fontFamily: 'Outfit, sans-serif', padding: '2px 4px' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6a8fa8' }}>
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}