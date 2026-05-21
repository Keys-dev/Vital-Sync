export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function sendBrowserNotification(title: string, body: string, severity: string) {
  if (Notification.permission !== 'granted') return;
  const icons = { critical: '🔴', warning: '🟡', info: '🔵' };
  new Notification(`${icons[severity as keyof typeof icons] ?? '🔔'} ${title}`, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `vitalsync-${severity}`,
    requireInteraction: severity === 'critical', // critical alerts stay until dismissed
  });
}