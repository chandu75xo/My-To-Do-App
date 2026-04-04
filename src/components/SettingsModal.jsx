// SettingsModal.jsx — v5 professional redesign

import { useAlarm, SOUND_OPTIONS } from '../hooks/useAlarm'

const SNOOZE_OPTIONS = [
  { value: 5,  label: '5m'  },
  { value: 10, label: '10m' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h'  },
]

const SvgIcon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)

const ICONS = {
  clock:  'M10 2.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM10 6v4.5l3 1.5',
  bell:   'M10 2.5c-3 0-5 2-5 5v3l-1.5 2H16.5L15 10.5v-3c0-3-2-5-5-5zM8.5 15.5a1.5 1.5 0 003 0',
  sound:  'M10 3.5L6 7H3v6h3l4 3.5V3.5zM14 7a4 4 0 010 6M16.5 5a7 7 0 010 10',
  repeat: 'M4 10a6 6 0 0110.5-4H12m4 4a6 6 0 01-10.5 4H8m-4-4l2-2-2-2',
  phone:  'M14 12.5c-.2 0-1.3.2-2 .5-1 .5-2.5-1-3.5-2S6.5 8.5 7 7.5c.3-.7.5-1.8.5-2C7.5 5 7 4 6 3.5c-.7-.3-1.5 0-2 .5C2.5 5.5 3 8 5.5 11s5.5 7 7.5 5.5c.5-.5.8-1.3.5-2-.5-1-1.5-2-1.5-2z',
  close:  'M5 5l10 10M15 5L5 15',
  check:  'M4 10l4 4 8-8',
}

// Section header inside modal
const Section = ({ title }) => (
  <div className="flex items-center gap-3 mb-3 mt-5 first:mt-0">
    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
      {title}
    </span>
    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700"/>
  </div>
)

// Toggle row component
const ToggleRow = ({ icon, label, sub, active, onClick }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
      active
        ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-700/60'
        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
    }`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
      active ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    }`}>
      <SvgIcon d={icon} size={15}/>
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
      active ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
    }`}>
      {active && <div className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white"/>}
    </div>
  </button>
)

export default function SettingsModal({ isOpen, onClose, settings, onUpdate }) {
  const { previewAlarm } = useAlarm()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"/>

      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-10 max-h-[92vh] overflow-y-auto">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg text-gray-900 dark:text-white">Settings</p>
            <button onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <SvgIcon d={ICONS.close} size={18}/>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">

          {/* ── Time format ─────────────────────────────────────── */}
          <Section title="Time format"/>
          <div className="grid grid-cols-2 gap-3 mb-1">
            {[
              { id: '12h', display: '2:30 PM', label: '12-hour', sub: 'AM / PM' },
              { id: '24h', display: '14:30',   label: '24-hour', sub: 'Military' },
            ].map(opt => (
              <button key={opt.id} onClick={() => onUpdate('timeFormat', opt.id)}
                className={`relative py-4 px-4 rounded-2xl border-2 transition-all text-left ${
                  settings.timeFormat === opt.id
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-gray-700'
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800/60'
                }`}>
                {settings.timeFormat === opt.id && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-white/20 dark:bg-white/30 flex items-center justify-center">
                    <SvgIcon d={ICONS.check} size={10}/>
                  </div>
                )}
                <p className={`text-xl font-mono font-semibold mb-1 ${
                  settings.timeFormat === opt.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {opt.display}
                </p>
                <p className={`text-xs font-medium ${
                  settings.timeFormat === opt.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                  {opt.label}
                </p>
                <p className={`text-xs ${
                  settings.timeFormat === opt.id ? 'text-white/50' : 'text-gray-400 dark:text-gray-600'}`}>
                  {opt.sub}
                </p>
              </button>
            ))}
          </div>

          {/* ── Alarm ──────────────────────────────────────────── */}
          <Section title="Alarm"/>
          <div className="space-y-2 mb-1">
            {SOUND_OPTIONS.map(sound => (
              <div key={sound.id}
                onClick={() => onUpdate('alarmSound', sound.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.alarmSound === sound.id
                    ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-700/60'
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  settings.alarmSound === sound.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {sound.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${settings.alarmSound === sound.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {sound.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{sound.desc}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); previewAlarm(sound.id) }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M2 1.5l7 3.5-7 3.5V1.5z"/>
                  </svg>
                  Preview
                </button>
              </div>
            ))}
          </div>

          {/* Vibration */}
          <div className="mt-2">
            <ToggleRow
              icon={ICONS.phone}
              label="Vibration"
              sub="Vibrate on alarm — mobile devices only"
              active={settings.vibration}
              onClick={() => onUpdate('vibration', !settings.vibration)}
            />
          </div>

          {/* ── Snooze ─────────────────────────────────────────── */}
          <Section title="Remind again interval"/>
          <div className="grid grid-cols-5 gap-2">
            {SNOOZE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => onUpdate('snoozeMinutes', opt.value)}
                className={`py-3 rounded-xl border-2 text-center transition-all ${
                  settings.snoozeMinutes === opt.value
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                    : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                <p className={`text-sm font-semibold ${settings.snoozeMinutes === opt.value ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>
                  {opt.label}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-2">
            Time before alarm repeats after snooze
          </p>

          {/* ── Notifications ──────────────────────────────────── */}
          <Section title="Notifications"/>
          <ToggleRow
            icon={ICONS.bell}
            label="Push notifications"
            sub="Reminder at 15 mins and at exact due time"
            active={true}
            onClick={() => {}}
          />

          {/* ── Save ────────────────────────────────────────────── */}
          <button onClick={onClose}
            className="w-full mt-5 py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all">
            Save & close
          </button>

        </div>
      </div>
    </div>
  )
}
