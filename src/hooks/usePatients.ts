import { useAssignedPatients } from './useDoctorData';

/**
 * Adapter: keeps the existing Layout/Sidebar working with real data.
 * The existing Layout passes `isLive` — we derive it from whether
 * any patient has recent vitals.
 */
export function usePatients() {
  const { patients, loading } = useAssignedPatients();

  const isLive = patients.some(
    (p) =>
      p.latest_vitals?.recorded_at != null &&
      Date.now() - new Date(p.latest_vitals.recorded_at).getTime() < 5 * 60 * 1000
  );

  return { patients, loading, isLive };
}