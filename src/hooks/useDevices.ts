import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Device } from '@/types';

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    // Join patient name for display
    const { data, error: err } = await supabase
      .from('devices')
      .select('*, patients(full_name)')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setDevices(
        (data ?? []).map((d: any) => ({
          ...d,
          patient_name: d.patients?.full_name ?? null,
          patients: undefined,
        })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    // Realtime — new device auto-registers or status changes
    const channel = supabase
      .channel('devices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetch(); // re-fetch on any change (insert/update)
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const assignDevice = useCallback(async (deviceId: string, patientId: string | null) => {
    const { error: err } = await supabase
      .from('devices')
      .update({
        patient_id: patientId,
        status:     patientId ? 'online' : 'unassigned',
      })
      .eq('id', deviceId);

    if (err) throw new Error(err.message);
    await fetch();
  }, [fetch]);

  const registerDevice = useCallback(async (device_code: string, label: string) => {
    const { error: err } = await supabase
      .from('devices')
      .insert({ device_code: device_code.trim().toUpperCase(), label });

    if (err) throw new Error(err.message);
    await fetch();
  }, [fetch]);

  const deleteDevice = useCallback(async (deviceId: string) => {
    const { error: err } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);

    if (err) throw new Error(err.message);
    await fetch();
  }, [fetch]);

  return { devices, loading, error, assignDevice, registerDevice, deleteDevice, refetch: fetch };
}