import { useAssignedPatients } from './useDoctorData';
import type { Patient, PatientGender } from '@/types';

export function usePatients() {
  const { patients: assigned, loading, refetch } = useAssignedPatients();

  const isLive = assigned.some(
    (p) =>
      p.latest_vitals?.recorded_at != null &&
      Date.now() - new Date(p.latest_vitals.recorded_at).getTime() < 5 * 60 * 1000
  );

  const patients: Patient[] = assigned.map((p) => {
    const v = p.latest_vitals;

    // Calculate age from date_of_birth if available
    const age = p.date_of_birth
      ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / 3.156e10)
      : 0;

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
      age,
      gender:         (p.gender as PatientGender) ?? 'Other',
      bedNumber:      p.bed_number        || `Bed ${p.id.slice(-2)}`,
      admissionDate:  new Date().toISOString(),
      diagnosis:      p.diagnosis         || 'Under observation',
      doctorAssigned: 'Dr. Default',
      status,
      location: {
        lat: v?.latitude  ?? 6.5244,
        lng: v?.longitude ?? 3.3792,
      },
      deviceId:         'DEV-000',
      bloodType:        p.blood_type        || 'O+',
      emergencyContact: p.emergency_contact || 'None',
      vitals: {
        heartRate:   v?.heart_rate  ?? 0,
        spo2:        v?.spo2        ?? 0,
        temperature: v?.temperature ?? 0,
        systolicBP:  120,
        diastolicBP: 80,
        timestamp:   v?.recorded_at ?? new Date().toISOString(),
      },
      vitalHistory: [],
    };
  });

  const stats = {
    totalPatients:    patients.length,
    criticalPatients: patients.filter((p) => p.status === 'critical').length,
    warningPatients:  patients.filter((p) => p.status === 'warning').length,
    stablePatients:   patients.filter((p) => p.status === 'stable').length,
    devicesOnline:    patients.filter((p) => p.status !== 'inactive').length,
  };

  return { patients, stats, loading, isLive, refetch };
}