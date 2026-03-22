// NotificationPrompt.jsx
//
// Shown ONCE after the user signs up or logs in, before the main app.
// Asks to enable notifications with Allow / Not now buttons.
// Never shown again after a choice is made (saved in localStorage).

export default function NotificationPrompt({ onAllow, onDecline }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-8">
          <span style={{ fontSize: '2.5rem' }}>🔔</span>
        </div>

        {/* Heading */}
        <h2 className="font-serif text-3xl text-gray-900 dark:text-white text-center mb-3">
          Stay on top of things
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed mb-3">
          Get notified 15 minutes before your important tasks are due — even when the app is closed.
        </p>

        {/* Feature list */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-8 space-y-3">
          {[
            { icon: '⏰', text: '15-min reminders before important tasks' },
            { icon: '📧', text: 'Email alerts when Gmail is configured' },
            { icon: '🔕', text: 'You can turn this off anytime in settings' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-base flex-shrink-0" style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <p className="text-sm text-gray-600 dark:text-gray-300">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <button
          onClick={onAllow}
          className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all mb-3">
          Allow notifications
        </button>
        <button
          onClick={onDecline}
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
