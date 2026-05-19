import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useProfile  } from './useProfile';

export interface PatientOption  { id: string; full_name: string; }
export interface FamilyRequest  {
  id: string; patient_id: string;
  patient_name: string; status: 'pending' | 'approved' | 'rejected';
}

export function useFamilyData() {
  const supabase     = useSupabase();
  const { profile }  = useProfile();
  const [myRequests,   setMyRequests]   = useState<FamilyRequest[]>([]);
  const [allPatients,  setAllPatients]  = useState<PatientOption[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data: requests, error: rErr } = await supabase
      .from('access_requests')
      .select('id, patient_id, status')
      .eq('family_member_id', profile.id)
      .order('created_at', { ascending: false });

    if (rErr) { setError(rErr.message); setLoading(false); return; }

    const enriched: FamilyRequest[] = await Promise.all(
      (requests ?? []).map(async (r) => {
        const { data: p } = await supabase
          .from('patients').select('full_name').eq('id', r.patient_id).single();
        return {
          id: r.id, patient_id: r.patient_id,
          patient_name: p?.full_name ?? 'Unknown patient', status: r.status,
        };
      })
    );
    setMyRequests(enriched);

    const { data: patients } = await supabase
      .from('patients').select('id, full_name').order('full_name');
    setAllPatients(patients ?? []);
    setLoading(false);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);

  const submitRequest = async (
    patientId: string
  ): Promise<'ok' | 'duplicate' | 'error'> => {
    if (!profile) return 'error';
    setSubmitting(true);
    const { error: iErr } = await supabase.from('access_requests').insert({
      family_member_id: profile.id,
      patient_id:       patientId,
      status:           'pending',
    });
    setSubmitting(false);
    if (!iErr)              { await fetch(); return 'ok'; }
    if (iErr.code === '23505') return 'duplicate';
    return 'error';
  };

  return {
    myRequests,
    approvedPatients: myRequests.filter((r) => r.status === 'approved'),
    allPatients, loading, submitting, error, submitRequest,
    refetch: fetch,
  };
}