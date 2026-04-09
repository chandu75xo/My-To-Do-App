// Header.jsx — clock removed, clean version

import { getGreeting } from '../hooks/useAuth'

export default function Header({ onMenuOpen, onProfileOpen, user }) {
  const greeting    = getGreeting()
  const displayName = user?.preferredName || user?.name?.split(' ')[0] || ''
  const initials    = displayName?.[0]?.toUpperCase() || '?'

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">

        <button onClick={onMenuOpen}
          className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label="Open menu">
          <span className="w-[18px] h-[1.5px] bg-gray-600 dark:bg-gray-300 rounded-full block"/>
          <span className="w-[18px] h-[1.5px] bg-gray-600 dark:bg-gray-300 rounded-full block"/>
          <span className="w-[18px] h-[1.5px] bg-gray-600 dark:bg-gray-300 rounded-full block"/>
        </button>

        <div className="flex-1 min-w-0">
          {user ? (
            <p className="font-serif text-xl text-gray-900 dark:text-white truncate leading-tight">
              {greeting},{' '}
              <span className="text-gray-500 dark:text-gray-400">{displayName}</span>
            </p>
          ) : (
            <p className="font-serif text-2xl text-gray-900 dark:text-white">done.</p>
          )}
          <p className="font-serif text-sm text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {dateLabel}
          </p>
        </div>

        <button onClick={onProfileOpen}
          className="w-9 h-9 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 hover:opacity-80 active:scale-95 transition-all"
          aria-label="Open profile">
          <span className="text-sm font-semibold text-white dark:text-gray-900">{initials}</span>
        </button>

      </div>
    </header>
  )
}
