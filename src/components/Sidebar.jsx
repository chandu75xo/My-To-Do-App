// Sidebar.jsx — triple-click secret on "done." wordmark
// Click "done." 3 times within 800ms → navigates to /admin (asks for creds)

import { useRef, useCallback } from 'react'

const Icon = ({ path, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={path}/>
  </svg>
)

const ICONS = {
  sun:     'M10 3V1.5M10 18.5V17M3 10H1.5M18.5 10H17M4.9 4.9L3.8 3.8M16.2 16.2l-1.1-1.1M4.9 15.1l-1.1 1.1M16.2 3.8l-1.1 1.1M10 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
  moon:    'M17 12A7 7 0 116 3.3 5.5 5.5 0 1017 12z',
  bell:    'M10 2.5c-3 0-5 2-5 5v3l-1.5 2H16.5L15 10.5v-3c0-3-2-5-5-5zM8.5 15.5a1.5 1.5 0 003 0',
  bellOff: 'M3 3l14 14M10 2.5c-1.5 0-2.8.6-3.8 1.6M15 10.5v-.8M15 10.5L16.5 13.5H4.2M5 7.5c0-1.3.4-2.5 1.2-3.4M8.5 15.5a1.5 1.5 0 003 0',
  mail:    'M2.5 5.5h15v11h-15zM2.5 5.5l7.5 6 7.5-6',
  chart:   'M3 15h2.5V9H3zM8.75 15h2.5V5h-2.5zM14.5 15H17V11h-2.5z',
  settings:'M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM10 2.5v1.8M10 15.7v1.8M3.8 5.2l1.3 1.3M14.9 14.9l1.3-1.3M2.5 10h1.8M15.7 10h1.8M3.8 14.8l1.3-1.3M14.9 5.1l1.3 1.3',
  signout: 'M13.5 10H3.5M11 7l3 3-3 3M7.5 5.5h-4v9h4',
  close:   'M5 5l10 10M15 5L5 15',
}

export default function Sidebar({
  isOpen, onClose, darkMode, setDarkMode, user,
  permission, isSupported, onEnableNotifications, onDisableNotifications,
  onTestPush, testStatus, onSignOut, onOpenSettings, onOpenStats,
}) {
  const notifEnabled = permission === 'granted'

  // ── Triple-click secret ───────────────────────────────────────────────────
  const tapCount = useRef(0)
  const tapTimer = useRef(null)

  const handleWordmarkClick = useCallback(() => {
    tapCount.current += 1

    if (tapTimer.current) clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0
    }, 800)

    if (tapCount.current >= 3) {
      tapCount.current = 0
      clearTimeout(tapTimer.current)
      onClose()
      setTimeout(() => { window.location.href = '/admin' }, 150)
    }
  }, [onClose])
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}/>

      <aside className={`fixed top-0 left-0 h-full w-72 z-40 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">

            {/* Secret triple-click target — no visual hint */}
            <button
              onClick={handleWordmarkClick}
              className="font-serif text-xl text-gray-900 dark:text-white select-none focus:outline-none cursor-default"
              tabIndex={-1}
            >
              done.
            </button>

            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Icon path={ICONS.close} size={18}/>
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-white dark:text-gray-900">
                  {user.preferredName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3">

          <p className="px-5 py-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Preferences</p>

          <button onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span className="w-5 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Icon path={darkMode ? ICONS.sun : ICONS.moon} size={16}/>
            </span>
            <span className="text-sm font-medium flex-1">{darkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {isSupported && (
            <div className="px-5 py-2.5">
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-5 flex items-center justify-center ${notifEnabled ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  <Icon path={notifEnabled ? ICONS.bell : ICONS.bellOff} size={16}/>
                </span>
                <span className={`text-sm font-medium flex-1 ${notifEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {notifEnabled ? 'Notifications on' : 'Notifications off'}
                </span>
                {notifEnabled && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"/>}
              </div>
              {!notifEnabled ? (
                <button onClick={() => { onEnableNotifications(); onClose() }}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-all">
                  Enable notifications
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={onTestPush} disabled={testStatus === 'sending'}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                      testStatus === 'sent'    ? 'bg-green-500 text-white border-green-500' :
                      testStatus === 'error'   ? 'bg-red-500 text-white border-red-500' :
                      testStatus === 'sending' ? 'bg-gray-300 text-gray-500 border-gray-300' :
                      'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {testStatus === 'sending' ? 'Sending…' : testStatus === 'sent' ? 'Sent!' : testStatus === 'error' ? 'Failed' : 'Test push'}
                  </button>
                  <button onClick={() => { onDisableNotifications(); onClose() }}
                    className="flex-1 py-2 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all">
                    Turn off
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="w-full flex items-center gap-3 px-5 py-2.5 text-gray-400 dark:text-gray-600">
            <span className="w-5 flex items-center justify-center"><Icon path={ICONS.mail} size={16}/></span>
            <span className="text-sm font-medium flex-1">Email alerts</span>
            <span className="text-xs italic text-gray-300 dark:text-gray-700">configured</span>
          </div>

          <p className="px-5 py-1 mt-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">App</p>

          <button onClick={() => { onOpenStats(); onClose() }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span className="w-5 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Icon path={ICONS.chart} size={16}/>
            </span>
            <span className="text-sm font-medium flex-1">Statistics</span>
          </button>

          <p className="px-5 py-1 mt-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Account</p>

          <button onClick={() => { onOpenSettings(); onClose() }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span className="w-5 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Icon path={ICONS.settings} size={16}/>
            </span>
            <span className="text-sm font-medium flex-1">Settings</span>
          </button>

          <button onClick={onSignOut}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
            <span className="w-5 flex items-center justify-center">
              <Icon path={ICONS.signout} size={16}/>
            </span>
            <span className="text-sm font-medium">Sign out</span>
          </button>

        </nav>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">done. v5d</p>
        </div>
      </aside>
    </>
  )
}
