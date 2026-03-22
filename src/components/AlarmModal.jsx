// AlarmModal.jsx
// Pops up when an alarm fires. Shows task name + two buttons.
// Dismiss   → stops alarm, marks task as dismissed (won't ring again)
// Remind again → stops alarm, re-rings after the snooze interval

export default function AlarmModal({ task, snoozeMinutes, onDismiss, onSnooze }) {
  if (!task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 z-10">

        {/* Alarm icon + pulse ring */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <span className="text-3xl">⏰</span>
            </div>
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
          </div>
        </div>

        {/* Task info */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-1">
          Task is due now!
        </p>
        <h2 className="font-serif text-xl text-gray-900 dark:text-white text-center leading-snug mb-6">
          {task.title}
        </h2>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onSnooze}
            className="w-full py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95">
            ⏱ Remind me in {snoozeMinutes} min
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition-all active:scale-95">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
