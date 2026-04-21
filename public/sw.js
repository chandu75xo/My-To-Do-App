// sw.js — v6a
// Professional branded notifications with app-native styling
// Supports: View task, Mark as complete, Dismiss
// Overdue repeat notifications have escalating visual treatment

const APP = 'done.'
const APP_URL = self.location.origin

self.addEventListener('install', () => {
  console.log('[SW] v6a installed')
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

// ── Notification appearance by type ───────────────────────────────────────

function buildOptions(d) {
  const body  = d.body  || 'You have a task reminder'
  const url   = d.url   || '/'
  const tag   = d.tag   || `done-${Date.now()}`
  const type  = d.type  || 'reminder'  // 'before' | 'due' | 'overdue' | 'overdue_repeat'

  // Urgency escalates visually as task gets more overdue
  const vibrate = {
    before:          [200, 100, 200],
    due:             [300, 100, 300, 100, 300],
    overdue:         [400, 100, 400, 100, 400],
    overdue_repeat:  [500, 100, 500, 100, 500, 100, 500],
    daily_overdue:   [200, 100, 200],
  }[type] || [200, 100, 200]

  return {
    body,
    icon:               '/favicon.svg',
    badge:              '/favicon.svg',
    tag,
    renotify:           true,
    requireInteraction: type !== 'before',   // stay on screen unless it's just a heads-up
    silent:             false,
    vibrate,
    data: {
      url,
      type,
      taskId:        d.taskId        || null,
      completeToken: d.completeToken || null,
      completeUrl:   d.completeUrl   || null,
    },
    actions: [
      { action: 'view',     title: 'View task'       },
      { action: 'complete', title: 'Mark complete'    },
      { action: 'dismiss',  title: 'Dismiss'          },
    ],
  }
}

// ── Push received ──────────────────────────────────────────────────────────

self.addEventListener('push', event => {
  if (!event.data) return

  let d = {}
  try { d = event.data.json() } catch { d = { body: event.data.text() } }

  const title   = d.title || APP
  const options = buildOptions(d)

  // Notify any open tabs so they can show an in-app toast
  const notifyTabs = clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then(all => all.forEach(c => c.postMessage({
      type: 'PUSH_RECEIVED', title, body: options.body, notifType: d.type,
    })))

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      notifyTabs,
    ])
  )
})

// ── Notification click ──────────────────────────────────────────────────────

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = event.notification.data || {}

  // Dismiss — do nothing
  if (event.action === 'dismiss') return

  // Mark as complete — call backend directly, no app open needed
  if (event.action === 'complete') {
    const { completeToken, completeUrl } = data
    if (completeToken && completeUrl) {
      event.waitUntil(
        fetch(completeUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token: completeToken }),
        })
        .then(async r => {
          const msg = r.ok ? 'Task marked as complete' : 'Could not complete task'
          return self.registration.showNotification(APP, {
            body:   msg,
            icon:   '/favicon.svg',
            badge:  '/favicon.svg',
            tag:    'done-complete-confirm',
            silent: true,
          })
        })
        .catch(e => console.error('[SW] Complete failed:', e))
      )
    }
    return
  }

  // View task or tap on notification body — open/focus app
  const viewUrl = data.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(all => {
        // If app is already open, focus it
        for (const c of all) {
          if (c.url.includes(APP_URL) && 'focus' in c) return c.focus()
        }
        // Otherwise open a new window
        return clients.openWindow(viewUrl)
      })
  )
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
