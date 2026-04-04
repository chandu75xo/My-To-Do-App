// AlarmModal.jsx — v5 fix: replaced emoji with SVG clock icon

const ClockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="16" r="12"/>
    <path d="M16 10v6.5l4 2"/>
  </svg>
)

export default function AlarmModal({ task, snoozeMinutes, onDismiss, onSnooze }) {
  if (!task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 z-10">

        {/* Animated clock icon */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-gray-900">
                <ClockIcon/>
              </span>
            </div>
            <div className="absolute inset-0 rounded-full bg-gray-900/20 dark:bg-white/20 animate-ping" />
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-1">
          Task is due now
        </p>
        <h2 className="font-serif text-xl text-gray-900 dark:text-white text-center leading-snug mb-6">
          {task.title}
        </h2>

        <div className="flex flex-col gap-3">
          <button onClick={onSnooze}
            className="w-full py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95">
            Remind me in {snoozeMinutes} min
          </button>
          <button onClick={onDismiss}
            className="w-full py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition-all active:scale-95">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
