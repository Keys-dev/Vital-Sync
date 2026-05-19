import { useState, useCallback } from 'react';
import { alerts as initialAlerts } from '@/data/alerts';
import type { Alert } from '@/types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  const acknowledge = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }, []);

  const acknowledgeAll = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  }, []);

  const unacknowledged = alerts.filter((a) => !a.acknowledged);
  const critical = alerts.filter((a) => a.severity === 'critical');

  return { alerts, unacknowledged, critical, acknowledge, acknowledgeAll };
}
