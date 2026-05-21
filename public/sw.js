self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'VitalSync Alert', {
      body: data.body ?? 'A patient needs attention.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: data.url ?? '/alerts' },
      requireInteraction: data.severity === 'critical',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? '/alerts')
  );
});