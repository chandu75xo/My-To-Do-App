import { useAlarm, SOUND_OPTIONS } from '../hooks/useAlarm'

const SNOOZE_OPTIONS = [
  { value: 5,  label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
]

export default function SettingsModal({ isOpen, onClose, settings, onUpdate }) {
  const { previewAlarm } = useAlarm()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">

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
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Time format</p>
          <div className="flex gap-3">
            {[{ id: '12h', display: '2:30 PM', label: '12-hour' }, { id: '24h', display: '14:30', label: '24-hour' }].map(opt => (
              <button key={opt.id} onClick={() => onUpdate('timeFormat', opt.id)}
                className={`flex-1 py-4 rounded-2xl border-2 transition-all ${
                  settings.timeFormat === opt.id
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <p className={`text-lg font-mono font-semibold text-center ${settings.timeFormat === opt.id ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>{opt.display}</p>
                <p className={`text-xs text-center mt-1 ${settings.timeFormat === opt.id ? 'text-white/70 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`}>{opt.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Alarm sound ── */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Alarm sound — plays at exact due time (15s)
          </p>
          <div className="space-y-2">
            {SOUND_OPTIONS.map(sound => (
              <div key={sound.id} onClick={() => onUpdate('alarmSound', sound.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  settings.alarmSound === sound.id
                    ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700'
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${settings.alarmSound === sound.id ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'}`}>
                  {settings.alarmSound === sound.id && <div className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />}
                </div>
                <span className="text-lg flex-shrink-0">{sound.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{sound.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{sound.desc}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); previewAlarm(sound.id) }}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors flex-shrink-0">
                  ▶ Preview
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Snooze interval ── */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Remind again interval
          </p>
          <div className="grid grid-cols-5 gap-2">
            {SNOOZE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => onUpdate('snoozeMinutes', opt.value)}
                className={`py-3 rounded-2xl border-2 transition-all text-center ${
                  settings.snoozeMinutes === opt.value
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <p className={`text-sm font-semibold ${settings.snoozeMinutes === opt.value ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>
                  {opt.value < 60 ? opt.value : '1h'}
                </p>
                <p className={`text-xs ${settings.snoozeMinutes === opt.value ? 'text-white/70 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`}>
                  {opt.value < 60 ? 'min' : ''}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            Default: 5 minutes
          </p>
        </div>

        {/* ── Vibration ── */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Vibration</p>
          <button onClick={() => onUpdate('vibration', !settings.vibration)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
              settings.vibration
                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700'
                : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${settings.vibration ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'}`}>
              {settings.vibration && <div className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />}
            </div>
            <span className="text-lg">📳</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white text-left">Vibrate on alarm</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-left">Mobile only</p>
            </div>
          </button>
        </div>

        <button onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all">
          Done
        </button>
      </div>
    </div>
  )
}
