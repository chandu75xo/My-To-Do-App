const APP_NAME = 'done.'

self.addEventListener('install', () => {
  console.log('[SW] Installed')
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  console.log('[SW] Activated')
  event.waitUntil(clients.claim())
})

self.addEventListener('push', event => {
  console.log('[SW] Push received')

  let title = APP_NAME
  let body  = 'You have a task reminder'
  let url   = '/'
  let icon  = '/favicon.svg'

  if (event.data) {
    try {
      const data = event.data.json()
      title = data.title || title
      body  = data.body  || body
      url   = data.url   || url
      icon  = data.icon  || icon
    } catch {
      body = event.data.text() || body
    }
  }

  const showNotif = self.registration.showNotification(title, {
    body,
    icon,
    badge:              '/favicon.svg',
    data:               { url },
    vibrate:            [200, 100, 200],
    requireInteraction: false,
    tag:                'done-' + Date.now(),
    renotify:           true,
    silent:             false,
  })

  // Also notify open tabs so they can show an in-app toast
  const notifyClients = clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(clientList => {
      clientList.forEach(client => {
        client.postMessage({ type: 'PUSH_RECEIVED', title, body })
      })
    })

  event.waitUntil(
    Promise.all([showNotif, notifyClients])
      .then(() => console.log('[SW] ✅ Notification shown and clients notified'))
      .catch(err => console.error('[SW] Error:', err))
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }
        if (clients.openWindow) return clients.openWindow(url)
      })
  )
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
