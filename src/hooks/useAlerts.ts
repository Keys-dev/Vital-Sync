import { sendBrowserNotification } from '@/services/notifications';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Alert } from '@/types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // ── Initial fetch (most recent 100 alerts) ─────────────────────────────
    supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false })   // ← was `created_at` (wrong column name)
      .limit(100)
      .then(({ data, error }) => {
        if (error) console.error('[useAlerts] initial fetch error:', error);
        if (data) setAlerts(data as Alert[]);
      });

    // ── Realtime: new alert inserted by DB trigger ─────────────────────────
    const channel = supabase
      .channel('alerts-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const alert = payload.new as Alert;
          setAlerts((prev) => [alert, ...prev]);

          // Fire browser notification immediately
          sendBrowserNotification(
            alert.message,
            `Patient: ${alert.patientName} · ${alert.value}`,
            alert.severity,
          );
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'alerts' },
        (payload) => {
          setAlerts((prev) =>
            prev.map((a) => (a.id === payload.new.id ? (payload.new as Alert) : a)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Acknowledge a single alert ────────────────────────────────────────────
  const acknowledge = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);
    if (error) console.error('[useAlerts] acknowledge error:', error);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
    );
  }, []);

  // ── Acknowledge all unread alerts ─────────────────────────────────────────
  const acknowledgeAll = useCallback(async () => {
    const ids = alerts.filter((a) => !a.acknowledged).map((a) => a.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .in('id', ids);
    if (error) console.error('[useAlerts] acknowledgeAll error:', error);
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  }, [alerts]);

  return {
    alerts,
    unacknowledged : alerts.filter((a) => !a.acknowledged),
    critical       : alerts.filter((a) => a.severity === 'critical'),
    acknowledge,
    acknowledgeAll,
  };
}