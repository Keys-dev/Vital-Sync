import { useAssignedPatients } from './useDoctorData';
import type { Patient } from '@/types';

/**
 * Adapter: keeps the existing Layout/Sidebar working with real data.
 * It maps the real Supabase data back to the mock Patient interface
 * so the existing Dashboard, GPSTracker, and Alerts UI components don't break.
 */
export function usePatients() {
  const { patients: assigned, loading } = useAssignedPatients();

  const isLive = assigned.some(
    (p) =>
      p.latest_vitals?.recorded_at != null &&
      Date.now() - new Date(p.latest_vitals.recorded_at).getTime() < 5 * 60 * 1000
  );

  const patients: Patient[] = assigned.map((p) => {
    const v = p.latest_vitals;
    let status: 'stable' | 'warning' | 'critical' | 'inactive' = 'inactive';

    if (v) {
      if (
        (v.heart_rate  != null && (v.heart_rate  > 100 || v.heart_rate  < 50)) ||
        (v.spo2        != null &&  v.spo2        < 94)                          ||
        (v.temperature != null && (v.temperature > 38.5 || v.temperature < 35))
      ) {
        status = 'critical';
      } else {
        status = 'stable';
      }
    }

    return {
      id:             p.id,
      name:           p.full_name,
      age:            45,                          // Fallback — not in DB schema
      gender:         'Other',                     // Fallback
      ward:           'General',                   // Fallback
      bedNumber:      `Bed ${p.id.slice(-2)}`,
      admissionDate:  new Date().toISOString(),    // Fallback
      diagnosis:      'Under observation',         // Fallback
      doctorAssigned: 'Dr. Default',               // Fallback
      status,
      location: {
        lat: v?.latitude  ?? 6.5244,
        lng: v?.longitude ?? 3.3792,
      },
      deviceId:         'DEV-000', // Fallback
      bloodType:        'O+',      // Fallback
      emergencyContact: 'None',    // Fallback
      vitals: {
        heartRate:       v?.heart_rate  ?? 0,
        spo2:            v?.spo2        ?? 0,
        temperature:     v?.temperature ?? 0,
        systolicBP:      120,  // Fallback — not in DB schema
        diastolicBP:     80,   // Fallback
        respiratoryRate: 16,   // Fallback
        timestamp:       v?.recorded_at ?? new Date().toISOString(),
      },
      vitalHistory: [], // Populated by usePatientVitals when viewing a patient
    };
  });

  // Derived stats consumed by Dashboard.tsx
  const stats = {
    totalPatients:    patients.length,
    criticalPatients: patients.filter((p) => p.status === 'critical').length,
    warningPatients:  patients.filter((p) => p.status === 'warning').length,
    stablePatients:   patients.filter((p) => p.status === 'stable').length,
    // A patient is considered "online" if they have any vitals at all
    devicesOnline:    patients.filter((p) => p.status !== 'inactive').length,
  };

  return { patients, stats, loading, isLive };
}