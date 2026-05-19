import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import type { VitalsRow } from '@/types';

export function usePatientVitals(patientId: string) {
  const supabase = useSupabase();
  const [vitals, setVitals] = useState<VitalsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'live' | 'error' | 'closed'>('connecting');

  const fetchHistory = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    
    const { data, error: fetchErr } = await supabase
      .from('vitals_log')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(50); // Get last 50 readings

    if (fetchErr) {
      setError(fetchErr.message);
      setStatus('error');
    } else {
      // Reverse to chronological order for charts
      setVitals((data || []).reverse() as VitalsRow[]);
      setStatus('live');
    }
    setLoading(false);
  }, [patientId, supabase]);

  useEffect(() => {
    fetchHistory();

    if (!patientId) return;

    // Subscribe to realtime inserts
    const channel = supabase.channel(`public:vitals_log:patient_id=eq.${patientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vitals_log', filter: `patient_id=eq.${patientId}` },
        (payload) => {
          setVitals((prev) => {
            const newVitals = [...prev, payload.new as VitalsRow];
            // Keep maximum of 50 items in memory to prevent performance issues
            if (newVitals.length > 50) return newVitals.slice(newVitals.length - 50);
            return newVitals;
          });
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') setStatus('live');
        if (subscribeStatus === 'CLOSED') setStatus('closed');
        if (subscribeStatus === 'CHANNEL_ERROR') setStatus('error');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, fetchHistory, supabase]);

  return {
    vitals,
    latest: vitals.length > 0 ? vitals[vitals.length - 1] : null,
    loading,
    error,
    status
  };
}