// Header.jsx — UPDATED
//
// Layout: [Hamburger] [Greeting + date] [Profile avatar]
//
// Left:   3-line hamburger → opens Sidebar
// Centre: "Hi, Good morning Ravi" using time + preferred name
// Right:  Profile avatar circle → opens ProfileModal
//
// Dark mode toggle has MOVED to the Sidebar (under Preferences).

import { getGreeting } from '../hooks/useAuth'

export default function Header({ onMenuOpen, onProfileOpen, user }) {
  const greeting = getGreeting()
  const displayName = user?.preferredName || user?.name?.split(' ')[0] || ''
  const initials = displayName?.[0]?.toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">

        {/* ── Left: Hamburger ───────────────────────────────────── */}
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <span className="w-[18px] h-[1.5px] bg-gray-600 dark:bg-gray-300 rounded-full block" />
          <span className="w-[18px] h-[1.5px] bg-gray-600 dark:bg-gray-300 rounded-full block" />
          <span className="w-[18px] h-[1.5px] bg-gray-600 dark:bg-gray-300 rounded-full block" />
        </button>

        {/* ── Centre: Greeting + date ───────────────────────────── */}
        <div className="flex-1 min-w-0">
          {user ? (
            <p className="text-base font-semibold text-gray-900 dark:text-white truncate leading-tight">
              {greeting},{' '}
              <span className="text-gray-500 dark:text-gray-400">{displayName}</span>
            </p>
          ) : (
            <p className="font-serif text-2xl text-gray-900 dark:text-white">done.</p>
          )}
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

        {/* ── Right: Profile avatar ─────────────────────────────── */}
        <button
          onClick={onProfileOpen}
          className="w-9 h-9 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 hover:opacity-80 active:scale-95 transition-all"
          aria-label="Open profile"
        >
          <span className="text-sm font-semibold text-white dark:text-gray-900">{initials}</span>
        </button>

      </div>
    </header>
  )
}
