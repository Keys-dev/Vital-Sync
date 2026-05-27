// src/hooks/useAlerts.ts
import { sendBrowserNotification } from '@/services/notifications';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Alert } from '@/types';

const SETTINGS_KEY = 'vitalsync-settings';

function getAlertsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed.alertsEnabled !== false;
  } catch {
    return true;
  }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(getAlertsEnabled);

  useEffect(() => {
    const handleStorage = () => setAlertsEnabled(getAlertsEnabled());
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => setAlertsEnabled(getAlertsEnabled()), 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) console.error('[useAlerts] initial fetch error:', error);
        if (data) setAlerts(data as Alert[]);
      });

    const channelName = `alerts-channel-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const alert = payload.new as Alert;
          setAlerts((prev) => [alert, ...prev]);
          if (getAlertsEnabled()) {
            sendBrowserNotification(
              alert.message,
              `Patient: ${alert.patientName} · ${alert.value}`,
              alert.severity,
            );
          }
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

    return () => { supabase.removeChannel(channel); };
  }, []);

  const acknowledge = useCallback(async (alertId: string) => {
    const { error } = await supabase.from('alerts').update({ acknowledged: true }).eq('id', alertId);
    if (error) console.error('[useAlerts] acknowledge error:', error);
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
  }, []);

  const acknowledgeAll = useCallback(async () => {
    const ids = alerts.filter((a) => !a.acknowledged).map((a) => a.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from('alerts').update({ acknowledged: true }).in('id', ids);
    if (error) console.error('[useAlerts] acknowledgeAll error:', error);
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  }, [alerts]);

  return {
    alerts,
    alertsEnabled,
    unacknowledged: alertsEnabled ? alerts.filter((a) => !a.acknowledged) : [],
    critical:       alertsEnabled ? alerts.filter((a) => a.severity === 'critical') : [],
    acknowledge,
    acknowledgeAll,
  };
}