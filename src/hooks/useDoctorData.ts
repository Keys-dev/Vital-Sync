import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useProfile  } from './useProfile';
import type { AccessRequest, VitalsRow } from '@/types';

export interface AssignedPatient {
  id:                    string;
  full_name:             string;
  date_of_birth:         string;
  thingspeak_channel_id: string;
  latest_vitals:         Partial<VitalsRow> | null;
}

// ── Hook: assigned patients ────────────────────────────────────────────────────
export function useAssignedPatients() {
  const supabase        = useSupabase();
  const { profile }     = useProfile();
  const [patients,  setPatients]  = useState<AssignedPatient[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data: assignments } = await supabase
      .from('doctor_patients')
      .select('patient_id')
      .eq('doctor_id', profile.id);

    if (!assignments?.length) { setPatients([]); setLoading(false); return; }

    const ids = assignments.map((a) => a.patient_id);

    const { data: rows, error: pErr } = await supabase
      .from('patients')
      .select('id, full_name, date_of_birth, thingspeak_channel_id')
      .in('id', ids);

    if (pErr || !rows) { setError(pErr?.message ?? null); setLoading(false); return; }

    const enriched = await Promise.all(
      rows.map(async (p) => {
        const { data: vitals } = await supabase
          .from('vitals_log')
          .select('heart_rate, spo2, temperature, recorded_at')
          .eq('patient_id', p.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return { ...p, latest_vitals: vitals ?? null } as AssignedPatient;
      })
    );

    setPatients(enriched);
    setLoading(false);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);
  return { patients, loading, error, refetch: fetch };
}

// ── Hook: access requests ──────────────────────────────────────────────────────
export function useAccessRequests() {
  const supabase      = useSupabase();
  const { profile }   = useProfile();
  const [requests,  setRequests]  = useState<AccessRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [updating,  setUpdating]  = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data: assignments } = await supabase
      .from('doctor_patients')
      .select('patient_id')
      .eq('doctor_id', profile.id);

    if (!assignments?.length) { setRequests([]); setLoading(false); return; }

    const patientIds = assignments.map((a) => a.patient_id);

    const { data: rows, error: rErr } = await supabase
      .from('access_requests')
      .select('id, status, created_at, patient_id, family_member_id')
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false });

    if (rErr || !rows) { setError(rErr?.message ?? null); setLoading(false); return; }

    const enriched = await Promise.all(
      rows.map(async (r) => {
        const [{ data: patient }, { data: requester }] = await Promise.all([
          supabase.from('patients').select('full_name').eq('id', r.patient_id).single(),
          supabase.from('profiles').select('full_name, email').eq('id', r.family_member_id).single(),
        ]);
        return {
          id:              r.id,
          status:          r.status,
          created_at:      r.created_at,
          patient_id:      r.patient_id,
          patient_name:    patient?.full_name  ?? 'Unknown patient',
          requester_id:    r.family_member_id,
          requester_name:  requester?.full_name ?? 'Unknown',
          requester_email: requester?.email     ?? '',
        } as AccessRequest;
      })
    );

    setRequests(enriched);
    setLoading(false);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);

  const updateRequestStatus = async (
    requestId: string,
    newStatus: 'approved' | 'rejected'
  ) => {
    setUpdating(requestId);
    const { error: uErr } = await supabase
      .from('access_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (!uErr) {
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );
    }
    setUpdating(null);
  };

  return {
    requests, loading, error, updating,
    pendingCount: requests.filter((r) => r.status === 'pending').length,
    updateRequestStatus,
    refetch: fetch,
  };
}