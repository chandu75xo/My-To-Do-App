// StatsScreen.jsx — v5 fix: replaced emojis with SVG icons

const todayStr = () => new Date().toISOString().split('T')[0]

const startOfWeek = () => {
  const d = new Date(); d.setHours(0,0,0,0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

const last7Days = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i))
  return d.toISOString().split('T')[0]
})

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TAG_COLORS = {
  work: 'bg-blue-500', home: 'bg-amber-500', health: 'bg-green-500',
  shopping: 'bg-red-500', personal: 'bg-purple-500',
}
const TAG_LABELS = {
  work: 'Work', home: 'Home', health: 'Health', shopping: 'Shopping', personal: 'Personal'
}

function computeStreak(tasks) {
  const doneDates = new Set(tasks.filter(t => t.done && t.dueDate).map(t => t.dueDate))
  let streak = 0
  const d = new Date(); d.setHours(0,0,0,0)
  if (!doneDates.has(d.toISOString().split('T')[0])) d.setDate(d.getDate() - 1)
  while (true) {
    const key = d.toISOString().split('T')[0]
    if (!doneDates.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// Clean SVG icon component
const Icon = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={path}/>
  </svg>
)

const ICONS = {
  back:    'M13 4L7 10l6 6',
  check:   'M3.5 10l4 4 9-9',
  week:    'M2 5.5h16M2 10h16M2 14.5h10',
  fire:    'M10 18c-4 0-7-2.5-7-6.5 0-2 .8-3.8 2.2-5 0 1.5.8 2.8 2 3.5C7 8 7.5 5.5 9 4c.5 2 1.5 3.5 3 4.5.5-1 .5-2 .2-3C14.5 7 17 9.5 17 11.5c0 4-3 6.5-7 6.5z',
  rate:    'M10 2l2.4 4.8 5.3.8-3.8 3.7.9 5.2L10 14l-4.8 2.5.9-5.2L2.3 7.6l5.3-.8z',
  trophy:  'M7 3H3v4a4 4 0 004 4m6-8h4v4a4 4 0 01-4 4m-6 0a4 4 0 004 4m0 0v2m0 0h-3m3 0h3',
  chart:   'M3 15h2.5V9H3zM8.75 15h2.5V5h-2.5zM14.5 15H17V11h-2.5z',
  empty:   'M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h5.5L15 7.5V15a2 2 0 01-2 2zM9 3v4.5H15',
}

export default function StatsScreen({ tasks, onClose }) {
  const today     = todayStr()
  const weekStart = startOfWeek()
  const days      = last7Days()

  const total     = tasks.length
  const totalDone = tasks.filter(t => t.done).length
  const todayDone = tasks.filter(t => t.done && t.dueDate === today).length
  const weekDone  = tasks.filter(t => t.done && t.dueDate && new Date(t.dueDate + 'T00:00:00') >= weekStart).length
  const rate      = total > 0 ? Math.round((totalDone / total) * 100) : 0
  const streak    = computeStreak(tasks)

  const dayData = days.map(dateStr => ({
    label:   DAY_LABELS[new Date(dateStr + 'T00:00:00').getDay()],
    count:   tasks.filter(t => t.done && t.dueDate === dateStr).length,
    isToday: dateStr === today,
  }))
  const maxDay = Math.max(...dayData.map(d => d.count), 1)

  const tagCounts = {}
  tasks.filter(t => t.done).forEach(t => { tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1 })
  const tagEntries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])

  const dayTotals = Array(7).fill(0)
  tasks.filter(t => t.done && t.dueDate).forEach(t => {
    dayTotals[new Date(t.dueDate + 'T00:00:00').getDay()]++
  })
  const bestDay = DAY_LABELS[dayTotals.indexOf(Math.max(...dayTotals))]

  const metrics = [
    { value: todayDone, label: 'Done today',     sub: 'tasks completed',       iconPath: ICONS.check },
    { value: weekDone,  label: 'Done this week',  sub: 'tasks completed',       iconPath: ICONS.week  },
    { value: streak,    label: 'Day streak',      sub: `${streak === 1 ? '1 day' : `${streak} days`} in a row`, iconPath: ICONS.fire  },
    { value: `${rate}%`,label: 'Completion rate', sub: `${totalDone} of ${total} tasks`, iconPath: ICONS.rate  },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Icon path={ICONS.back} size={18}/>
          </button>
          <p className="font-serif text-xl text-gray-900 dark:text-white">Statistics</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-serif text-3xl text-gray-900 dark:text-white font-medium leading-none">
                  {m.value}
                </p>
                <span className="text-gray-300 dark:text-gray-600">
                  <Icon path={m.iconPath} size={16}/>
                </span>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{m.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Best day */}
        {totalDone > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
              <Icon path={ICONS.trophy} size={18}/>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Most productive day</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                You get the most done on <span className="font-semibold text-gray-600 dark:text-gray-300">{bestDay}</span>
              </p>
            </div>
          </div>
        )}

        {/* Last 7 days bar chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-400 dark:text-gray-500">
              <Icon path={ICONS.chart} size={16}/>
            </span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last 7 days</p>
          </div>
          <div className="flex items-end gap-2 h-28">
            {dayData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
                  {d.count > 0 ? d.count : ''}
                </span>
                <div className="w-full flex flex-col justify-end" style={{ height: '72px' }}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      d.isToday ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                    style={{ height: `${Math.max((d.count / maxDay) * 72, d.count > 0 ? 6 : 2)}px` }}
                  />
                </div>
                <span className={`text-xs ${d.isToday ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tag breakdown */}
        {tagEntries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">By category</p>
            <div className="space-y-3">
              {tagEntries.map(([tag, count]) => (
                <div key={tag}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{TAG_LABELS[tag] || tag}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                      {count} task{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${TAG_COLORS[tag] || 'bg-gray-400'}`}
                      style={{ width: `${(count / totalDone) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalDone === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Icon path={ICONS.empty} size={24}/>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No data yet</p>
            <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Complete some tasks to see your stats</p>
          </div>
        )}

      </div>
    </div>
  )
}
