// Sidebar.jsx — v5: added Stats link

export default function Sidebar({
  isOpen, onClose, darkMode, setDarkMode, user,
  permission, isSupported, onEnableNotifications, onDisableNotifications,
  onTestPush, testStatus, onSignOut, onOpenSettings, onOpenStats
}) {
  const notifEnabled = permission === 'granted'

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}/>

      <aside className={`fixed top-0 left-0 h-full w-72 z-40 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="font-serif text-xl text-gray-900 dark:text-white">done.</span>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/>
              </svg>
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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">

          {/* Preferences */}
          <p className="px-5 py-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Preferences</p>

          <button onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <span className="text-base w-5 text-center">{darkMode ? '☀️' : '🌙'}</span>
            <span className="text-sm font-medium flex-1">{darkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {/* Notifications */}
          {isSupported && (
            <div className="px-5 py-2.5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-base w-5 text-center">🔔</span>
                <span className={`text-sm font-medium flex-1 ${notifEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {notifEnabled ? 'Notifications on' : 'Notifications off'}
                </span>
                {notifEnabled && <span className="text-xs text-green-500">●</span>}
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
                      'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {testStatus === 'sending' ? 'Sending…' : testStatus === 'sent' ? '✓ Sent!' : testStatus === 'error' ? '✗ Failed' : 'Test push'}
                  </button>
                  <button onClick={() => { onDisableNotifications(); onClose() }}
                    className="flex-1 py-2 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-all">
                    Turn off
                  </button>
                </div>
              )}
            </div>
          )}

          <button className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-gray-400 dark:text-gray-600 cursor-default">
            <span className="text-base w-5 text-center">✉️</span>
            <span className="text-sm font-medium flex-1">Email alerts</span>
            <span className="text-xs italic text-gray-300 dark:text-gray-600">needs Gmail config</span>
          </button>

          {/* App */}
          <p className="px-5 py-1 mt-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">App</p>

          <button onClick={() => { onOpenStats(); onClose() }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <span className="text-base w-5 text-center">📊</span>
            <span className="text-sm font-medium flex-1">Statistics</span>
          </button>

          {/* Account */}
          <p className="px-5 py-1 mt-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Account</p>

          <button onClick={() => { onOpenSettings(); onClose() }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <span className="text-base w-5 text-center">⚙️</span>
            <span className="text-sm font-medium flex-1">Settings</span>
          </button>

          <button onClick={() => { onSignOut() }}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer transition-colors">
            <span className="text-base w-5 text-center">→</span>
            <span className="text-sm font-medium">Sign out</span>
          </button>

        </nav>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">done. v5.0</p>
        </div>
      </aside>
    </>
  )
}
