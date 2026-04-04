// NotificationPrompt.jsx — v5 fix: replaced emojis with SVG icons

const Icon = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={path}/>
  </svg>
)

const ICONS = {
  bell:    'M10 2.5c-3 0-5 2-5 5v3l-1.5 2H16.5L15 10.5v-3c0-3-2-5-5-5zM8.5 15.5a1.5 1.5 0 003 0',
  clock:   'M10 2.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM10 6v4.5l3 1.5',
  mail:    'M2.5 5.5h15v11h-15zM2.5 5.5l7.5 6 7.5-6',
  mute:    'M10 2.5c-3 0-5 2-5 5v3l-1.5 2H16.5L15 10.5v-3c0-3-2-5-5-5zM8.5 15.5a1.5 1.5 0 003 0M3 3l14 14',
}

export default function NotificationPrompt({ onAllow, onDecline }) {
  const features = [
    { iconPath: ICONS.clock, text: '15-min reminders before important tasks' },
    { iconPath: ICONS.bell,  text: 'Push alert at exact due time' },
    { iconPath: ICONS.mute,  text: 'You can turn this off anytime in settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gray-900 dark:bg-white flex items-center justify-center mx-auto mb-8 text-white dark:text-gray-900">
          <Icon path={ICONS.bell} size={32}/>
        </div>

        <h2 className="font-serif text-3xl text-gray-900 dark:text-white text-center mb-3">
          Stay on top of things
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed mb-6">
          Get notified before your important tasks are due — even when the app is closed.
        </p>

        {/* Feature list */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-8 space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">
                <Icon path={f.iconPath} size={16}/>
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-300">{f.text}</p>
            </div>
          ))}
        </div>

        <button onClick={onAllow}
          className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all mb-3">
          Allow notifications
        </button>
        <button onClick={onDecline}
          className="w-full py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
          Not now
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-4">
          You can change this anytime from the sidebar
        </p>
      </div>
    </div>
  )
}
