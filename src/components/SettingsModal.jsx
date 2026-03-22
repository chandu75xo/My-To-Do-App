// SettingsModal.jsx
// Opens from the Settings item in the sidebar.
// Currently has: Time format (12h / 24h)
// Easily extendable — add new settings sections here in future versions.

export default function SettingsModal({ isOpen, onClose, settings, onUpdate }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"/>

      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Time format ── */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Time format
          </p>

          <div className="flex gap-3">
            {/* 12h option */}
            <button
              onClick={() => onUpdate('timeFormat', '12h')}
              className={`flex-1 py-4 rounded-2xl border-2 transition-all ${
                settings.timeFormat === '12h'
                  ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
              <p className={`text-lg font-mono font-semibold text-center ${
                settings.timeFormat === '12h' ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'
              }`}>
                2:30 PM
              </p>
              <p className={`text-xs text-center mt-1 ${
                settings.timeFormat === '12h' ? 'text-white/70 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'
              }`}>
                12-hour
              </p>
            </button>

            {/* 24h option */}
            <button
              onClick={() => onUpdate('timeFormat', '24h')}
              className={`flex-1 py-4 rounded-2xl border-2 transition-all ${
                settings.timeFormat === '24h'
                  ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}>
              <p className={`text-lg font-mono font-semibold text-center ${
                settings.timeFormat === '24h' ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'
              }`}>
                14:30
              </p>
              <p className={`text-xs text-center mt-1 ${
                settings.timeFormat === '24h' ? 'text-white/70 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'
              }`}>
                24-hour
              </p>
            </button>
          </div>

          {/* Live preview */}
          <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Preview</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="12" height="11" rx="2"/>
                  <path d="M5 1v2M11 1v2M2 7h12" strokeLinecap="round"/>
                </svg>
                Today at
              </span>
              <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                {settings.timeFormat === '12h' ? '9:00 AM' : '09:00'}
              </span>
            </div>
          </div>
        </div>

        {/* More settings coming */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Coming soon
          </p>
          <div className="space-y-2">
            {['Alarm sound preference', 'Vibration on mobile', 'Default task priority', 'Week starts on'].map(item => (
              <div key={item} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400 dark:text-gray-600">{item}</span>
                <span className="text-xs text-gray-300 dark:text-gray-700 italic">v4</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
