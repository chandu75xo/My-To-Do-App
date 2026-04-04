// sw.js — v5 fix
// Added: View and Dismiss action buttons on notifications
// Both 15-min advance and exact due-time notifications get action buttons

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
  let tag   = 'done-reminder'

  if (event.data) {
    try {
      const data = event.data.json()
      title = data.title || title
      body  = data.body  || body
      url   = data.url   || url
      icon  = data.icon  || icon
      tag   = data.tag   || tag
    } catch {
      body = event.data.text() || body
    }
  }

  const options = {
    body,
    icon,
    badge:              '/favicon.svg',
    data:               { url },
    vibrate:            [200, 100, 200],
    requireInteraction: true,
    tag:                tag + '-' + Date.now(),
    renotify:           true,
    silent:             false,
    // Action buttons — shown below the notification body
    actions: [
      { action: 'view',    title: 'View task' },
      { action: 'dismiss', title: 'Dismiss'   },
    ],
  }

  const showNotif   = self.registration.showNotification(title, options)
  const notifyTabs  = clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(clientList => {
      clientList.forEach(client => {
        client.postMessage({ type: 'PUSH_RECEIVED', title, body })
      })
    })

  event.waitUntil(
    Promise.all([showNotif, notifyTabs])
      .then(() => console.log('[SW] Notification shown:', title))
      .catch(err => console.error('[SW] Error:', err))
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  // Dismiss — just close, do nothing
  if (event.action === 'dismiss') return

  // View (or tap on notification body) — open/focus the app
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
