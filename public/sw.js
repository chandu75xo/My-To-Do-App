// sw.js — v5d
// 3 notification actions: View task, Mark as complete, Dismiss
// "Mark as complete" calls backend directly from the Service Worker
// Works even when the webapp is completely closed

const APP = 'done.'

self.addEventListener('install', () => {
  console.log('[SW] Installed v5d')
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  console.log('[SW] Activated v5d')
  event.waitUntil(clients.claim())
})

self.addEventListener('push', event => {
  if (!event.data) return

  let d = {}
  try { d = event.data.json() } catch { d = { body: event.data.text() } }

  const title = d.title || APP
  const body  = d.body  || 'You have a task reminder'
  const url   = d.url   || '/'
  const tag   = d.tag   || 'done-reminder'

  const options = {
    body,
    icon:               '/favicon.svg',
    badge:              '/favicon.svg',
    requireInteraction: true,
    tag:                tag,
    renotify:           true,
    vibrate:            [200, 100, 200, 100, 200],
    data: {
      url,
      taskId:        d.taskId        || null,
      completeToken: d.completeToken || null,
      completeUrl:   d.completeUrl   || null,
    },
    actions: [
      { action: 'view',     title: 'View task'        },
      { action: 'complete', title: 'Mark as complete'  },
      { action: 'dismiss',  title: 'Dismiss'           },
    ],
  }

  // Notify open tabs so they show the in-app toast
  const notifyTabs = clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then(all => all.forEach(c => c.postMessage({ type: 'PUSH_RECEIVED', title, body })))

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      notifyTabs,
    ])
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = event.notification.data || {}

  if (event.action === 'dismiss') return

  if (event.action === 'complete') {
    // Mark task complete directly from notification — no app needed
    const { completeToken, completeUrl } = data
    if (completeToken && completeUrl) {
      event.waitUntil(
        fetch(completeUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token: completeToken }),
        })
        .then(r => {
          if (r.ok) {
            // Show a brief confirmation notification
            return self.registration.showNotification(APP, {
              body:  'Task marked as complete',
              icon:  '/favicon.svg',
              badge: '/favicon.svg',
              tag:   'done-complete-confirm',
            })
          }
        })
        .catch(e => console.error('[SW] Complete failed:', e))
      )
    }
    return
  }

  // View task or tap notification body — open/focus the app
  const viewUrl = data.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(all => {
        for (const c of all) {
          if ('focus' in c) return c.focus()
        }
        return clients.openWindow(viewUrl)
      })
  )
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
