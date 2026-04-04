// StatsScreen.jsx — v5
// Full stats dashboard calculated from existing tasks — no new DB tables needed.

const todayStr = () => new Date().toISOString().split('T')[0]

const startOfWeek = () => {
  const d = new Date(); d.setHours(0,0,0,0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

const last7Days = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TAG_COLORS = {
  work:     'bg-blue-500',
  home:     'bg-amber-500',
  health:   'bg-green-500',
  shopping: 'bg-red-500',
  personal: 'bg-purple-500',
}

const TAG_LABELS = {
  work: 'Work', home: 'Home', health: 'Health', shopping: 'Shopping', personal: 'Personal'
}

function computeStreak(tasks) {
  const doneDates = new Set(
    tasks.filter(t => t.done && t.dueDate).map(t => t.dueDate)
  )
  let streak = 0
  let d = new Date()
  d.setHours(0,0,0,0)
  // Check today first, if not done, start from yesterday
  const todayKey = d.toISOString().split('T')[0]
  if (!doneDates.has(todayKey)) d.setDate(d.getDate() - 1)
  while (true) {
    const key = d.toISOString().split('T')[0]
    if (!doneDates.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function StatsScreen({ tasks, onClose }) {
  const today    = todayStr()
  const weekStart = startOfWeek()
  const days     = last7Days()

  const total      = tasks.length
  const totalDone  = tasks.filter(t => t.done).length
  const todayDone  = tasks.filter(t => t.done && t.dueDate === today).length
  const weekDone   = tasks.filter(t => t.done && t.dueDate && new Date(t.dueDate + 'T00:00:00') >= weekStart).length
  const rate       = total > 0 ? Math.round((totalDone / total) * 100) : 0
  const streak     = computeStreak(tasks)

  // Last 7 days bar chart
  const dayData = days.map(dateStr => ({
    label: DAY_LABELS[new Date(dateStr + 'T00:00:00').getDay()],
    count: tasks.filter(t => t.done && t.dueDate === dateStr).length,
    isToday: dateStr === today,
  }))
  const maxDay = Math.max(...dayData.map(d => d.count), 1)

  // Tag breakdown
  const tagCounts = {}
  tasks.filter(t => t.done).forEach(t => {
    tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1
  })
  const tagEntries = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])

  // Most productive day
  const dayTotals = Array(7).fill(0)
  tasks.filter(t => t.done && t.dueDate).forEach(t => {
    const day = new Date(t.dueDate + 'T00:00:00').getDay()
    dayTotals[day]++
  })
  const bestDay = DAY_LABELS[dayTotals.indexOf(Math.max(...dayTotals))]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 4L7 10l6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p className="font-serif text-xl text-gray-900 dark:text-white">Statistics</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: todayDone, label: 'Done today',     sub: 'tasks completed' },
            { value: weekDone,  label: 'Done this week', sub: 'tasks completed' },
            { value: streak,    label: 'Day streak',     sub: streak === 1 ? '1 day in a row' : `${streak} days in a row` },
            { value: `${rate}%`,label: 'Completion',     sub: `${totalDone} of ${total} tasks` },
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="font-serif text-3xl text-gray-900 dark:text-white font-medium leading-none mb-1">
                {m.value}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{m.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Best day */}
        {totalDone > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <span style={{ fontSize: '18px' }}>🏆</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Most productive day</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">You get the most done on <span className="font-semibold text-gray-600 dark:text-gray-300">{bestDay}</span></p>
            </div>
          </div>
        )}

        {/* Last 7 days bar chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Last 7 days</p>
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
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No data yet</p>
            <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Complete some tasks to see your stats</p>
          </div>
        )}

      </div>
    </div>
  )
}
