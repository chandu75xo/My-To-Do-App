// NotificationBanner.jsx — UPDATED
// Edge fix: permission is only requested on explicit button click (user gesture)
// Some browsers (Edge, Firefox) block auto-permission requests

import { useState } from 'react'

export default function NotificationBanner({ permission, onEnable, isSupported }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('done-notif-dismissed') === 'true'
  )
  const [loading, setLoading] = useState(false)

  const dismiss = () => {
    localStorage.setItem('done-notif-dismissed', 'true')
    setDismissed(true)
  }

  const handleEnable = async () => {
    setLoading(true)
    await onEnable()
    setLoading(false)
  }

  if (!isSupported || permission === 'granted' || permission === 'denied' || dismissed) {
    return null
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/40">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <span className="text-lg flex-shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
            Enable notifications
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 opacity-80">
            Get 15-min reminders for important tasks
          </p>
        </div>
        <button
          onClick={handleEnable}
          disabled={loading}
          className="text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-200 dark:bg-amber-800/60 px-3 py-2 rounded-lg hover:bg-amber-300 dark:hover:bg-amber-700/60 transition-colors flex-shrink-0 disabled:opacity-60">
          {loading ? 'Setting up…' : 'Enable'}
        </button>
        <button onClick={dismiss}
          className="text-amber-500 dark:text-amber-600 hover:text-amber-700 flex-shrink-0 text-xl leading-none px-1">
          ×
        </button>
      </div>
    </div>
  )
}
