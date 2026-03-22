// PushToast.jsx
// Shows an in-app banner when a push notification arrives while the app is open.
// The Service Worker sends a postMessage to all open tabs — we listen for it here.

import { useState, useEffect } from 'react'

export default function PushToast() {
  const [toast, setToast] = useState(null) // { title, body }

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handler = (event) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        setToast({ title: event.data.title, body: event.data.body })
        // Auto-dismiss after 6 seconds
        setTimeout(() => setToast(null), 6000)
      }
    }

    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  if (!toast) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-xl p-4 flex items-start gap-3 animate-bounce-in">
        <span className="text-xl flex-shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{toast.title}</p>
          <p className="text-xs opacity-75 mt-0.5 truncate">{toast.body}</p>
        </div>
        <button
          onClick={() => setToast(null)}
          className="text-white/60 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 flex-shrink-0 text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  )
}
