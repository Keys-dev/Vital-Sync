// src/contexts/AlertsContext.tsx
// Single Supabase realtime subscription shared across all components.
// Wrap your app with <AlertsProvider> and use useAlertsContext() anywhere.

import {
  createContext, useContext, useEffect, useRef, useState,
  useCallback, type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { sendBrowserNotification } from '@/services/notifications';
import { playCriticalAlert, playWarningAlert } from '@/services/alertSound';
import type { Alert } from '@/types';

const SETTINGS_KEY    = 'vitalsync-settings';
const REPEAT_INTERVAL = 5_000;

function getAlertsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return true;
    return JSON.parse(raw).alertsEnabled !== false;
  } catch {
    return true;
  }
}

interface AlertsContextValue {
  alerts:         Alert[];
  alertsEnabled:  boolean;
  unacknowledged: Alert[];
  critical:       Alert[];
  acknowledge:    (id: string) => Promise<void>;
  acknowledgeAll: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextValue>({
  alerts:         [],
  alertsEnabled:  true,
  unacknowledged: [],
  critical:       [],
  acknowledge:    async () => {},
  acknowledgeAll: async () => {},
});

export function AlertsProvider({ children, patientIds }: { children: ReactNode; patientIds?: string[] }) {
  const [alerts,        setAlerts]        = useState<Alert[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(getAlertsEnabled);

  // Track which alert ids we've already sounded to avoid re-firing on re-render
  const soundedIds = useRef<Set<string>>(new Set());

  // ── Sync alertsEnabled with localStorage (Settings page writes here) ──
  useEffect(() => {
    const interval = setInterval(() => setAlertsEnabled(getAlertsEnabled()), 2000);
    const onStorage = () => setAlertsEnabled(getAlertsEnabled());
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ── Repeat reminder: re-sound every 60 s while critical unack'd alerts exist ──
  useEffect(() => {
    const timer = setInterval(() => {
      if (!getAlertsEnabled()) return;
      const hasUnackCritical = alerts.some(
        (a) => a.severity === 'critical' && !a.acknowledged,
      );
      if (hasUnackCritical) playCriticalAlert();
    }, REPEAT_INTERVAL);
    return () => clearInterval(timer);
  }, [alerts]);

  // ── Single realtime subscription ──────────────────────────────────────
  useEffect(() => {
    supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) console.error('[AlertsContext] fetch error:', error);
        if (data) setAlerts(data as Alert[]);
      });

    const channel = supabase
      .channel('alerts-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const alert = payload.new as Alert;
          setAlerts((prev) => [alert, ...prev]);

          if (!getAlertsEnabled()) return;

          // Browser notification
          sendBrowserNotification(
            alert.message,
            `Patient: ${alert.patientName} · ${alert.value}`,
            alert.severity,
          );

          // In-app sound — play once per unique alert id
          if (!soundedIds.current.has(alert.id)) {
            soundedIds.current.add(alert.id);
            if (alert.severity === 'critical') playCriticalAlert();
            else if (alert.severity === 'warning') playWarningAlert();
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
    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);
    if (error) console.error('[AlertsContext] acknowledge error:', error);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
    );
  }, []);

  const acknowledgeAll = useCallback(async () => {
    const ids = alerts.filter((a) => !a.acknowledged).map((a) => a.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .in('id', ids);
    if (error) console.error('[AlertsContext] acknowledgeAll error:', error);
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  }, [alerts]);

  const unacknowledged = alertsEnabled
    ? alerts.filter((a) => !a.acknowledged && (!patientIds || patientIds.includes(a.patientId)))
    : [];
  const critical = alertsEnabled
    ? alerts.filter((a) => a.severity === 'critical' && (!patientIds || patientIds.includes(a.patientId)))
    : [];

  return (
    <AlertsContext.Provider value={{
      alerts, alertsEnabled, unacknowledged, critical, acknowledge, acknowledgeAll,
    }}>
      {children}
    </AlertsContext.Provider>
  );
}

export const useAlertsContext = () => useContext(AlertsContext);