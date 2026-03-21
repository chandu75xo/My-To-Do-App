// Sidebar.jsx
//
// A slide-in panel from the LEFT side of the screen.
// Triggered by the hamburger (3-line) icon in the header.
//
// CSS technique used here: `translate-x-0` vs `-translate-x-full`
// Tailwind's `transition-transform` animates between these two states:
//   - Closed: panel is shifted 100% to the LEFT (invisible, off-screen)
//   - Open:   panel slides back to position 0 (visible)

export default function Sidebar({ isOpen, onClose, darkMode, setDarkMode, user, onSignOut }) {

  const menuItems = [
    {
      section: 'App',
      items: [
        { icon: '◈', label: 'Dashboard',  action: null,       note: 'coming in v4' },
        { icon: '◷', label: 'Reminders',  action: null,       note: 'coming in v3' },
        { icon: '✦', label: 'Statistics', action: null,       note: 'coming in v4' },
      ]
    },
    {
      section: 'Preferences',
      items: [
        {
          icon: darkMode ? '☀️' : '🌙',
          label: darkMode ? 'Light mode' : 'Dark mode',
          // When clicked, toggle dark mode and keep sidebar open
          action: () => setDarkMode(!darkMode),
          note: null,
        },
        { icon: '🔔', label: 'Notifications', action: null, note: 'coming in v3' },
        { icon: '✉️', label: 'Email alerts',  action: null, note: 'coming in v2' },
      ]
    },
    {
      section: 'Account',
      items: [
        { icon: '⚙️', label: 'Settings', action: null, note: 'coming soon' },
        { icon: '→',  label: 'Sign out',  action: onSignOut, note: null, danger: true },
      ]
    },
  ]

  return (
    <>
      {/*
        Backdrop overlay — covers the rest of the screen when sidebar is open.
        Clicking it closes the sidebar.
        opacity transitions from 0 (invisible) to 1 (visible).
        pointer-events-none when closed so it doesn't block clicks.
      */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-30 bg-black/30 dark:bg-black/50 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/*
        The sidebar panel itself.
        transform: -translate-x-full moves it off-screen to the left.
        When open, translate-x-0 brings it back into view.
        transition-transform duration-300 animates the slide.
      */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 z-40
        bg-white dark:bg-gray-900
        border-r border-gray-100 dark:border-gray-800
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Sidebar header — shows user info */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <span className="font-serif text-xl text-gray-900 dark:text-white">done.</span>
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* User avatar + name */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Avatar circle — shows initials */}
              <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-white dark:text-gray-900">
                  {/* Get first letter of preferred name */}
                  {user.preferredName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {menuItems.map(group => (
            <div key={group.section} className="mb-4">
              {/* Section label */}
              <p className="px-5 py-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                {group.section}
              </p>

              {group.items.map(item => (
                <button
                  key={item.label}
                  onClick={item.action ? () => { item.action(); if(!item.keepOpen) onClose() } : undefined}
                  disabled={!item.action}
                  className={`
                    w-full flex items-center gap-3 px-5 py-2.5 text-left
                    transition-colors
                    ${item.action
                      ? item.danger
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                      : 'text-gray-400 dark:text-gray-600 cursor-default'
                    }
                  `}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {/* "coming soon" note */}
                  {item.note && (
                    <span className="text-xs text-gray-300 dark:text-gray-600 italic">
                      {item.note}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
            done. v1.0 — local storage
          </p>
        </div>
      </aside>
    </>
  )
}
