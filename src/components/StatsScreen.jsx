// StatsScreen.jsx — v7: 3 ranges, hover/tap count on bars
import { useState } from 'react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TAG_COLORS = {
  work: 'bg-blue-500', home: 'bg-amber-500', health: 'bg-green-500',
  shopping: 'bg-red-500', personal: 'bg-purple-500',
}
const TAG_LABELS = {
  work: 'Work', home: 'Home', health: 'Health', shopping: 'Shopping', personal: 'Personal',
}

const RANGES = [
  { id: 'this_week',     label: 'This Week' },
  { id: 'this_month',   label: 'This Month' },
  { id: 'last_90_days', label: 'Last 90 Days' },
]

function getRangeBounds(rangeId) {
  const now   = new Date()
  const today = new Date(now); today.setHours(23, 59, 59, 999)
  switch (rangeId) {
    case 'this_week': {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      return { start, end: today }
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, end: today }
    }
    case 'last_90_days':
    default: {
      const start = new Date(now)
      start.setDate(now.getDate() - 89)
      start.setHours(0, 0, 0, 0)
      return { start, end: today }
    }
  }
}

// Effective completion date for a task
function taskDate(t) {
  if (t.completedAt) return new Date(t.completedAt)
  if (t.dueDate)     return new Date(t.dueDate + 'T00:00:00')
  if (t.createdAt)   return new Date(t.createdAt)
  return null
}

function computeStreak(tasks) {
  const doneDates = new Set(
    tasks
      .filter(t => t.done || t.archived)
      .map(t => { const d = taskDate(t); return d ? d.toISOString().split('T')[0] : null })
      .filter(Boolean)
  )
  let streak = 0
  const d = new Date(); d.setHours(0, 0, 0, 0)
  if (!doneDates.has(d.toISOString().split('T')[0])) d.setDate(d.getDate() - 1)
  while (true) {
    const key = d.toISOString().split('T')[0]
    if (!doneDates.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function buildBarData(tasks, start, end) {
  const diffDays = Math.round((end - start) / 86400000)

  if (diffDays <= 31) {
    // Daily bars
    const days = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const ds = cursor.toISOString().split('T')[0]
      days.push({
        label:   DAY_LABELS[cursor.getDay()],
        dateStr: ds,
        isToday: ds === new Date().toISOString().split('T')[0],
        count:   0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    tasks.forEach(t => {
      if (!(t.done || t.archived)) return
      const td = taskDate(t); if (!td) return
      const ds = td.toISOString().split('T')[0]
      const entry = days.find(d => d.dateStr === ds)
      if (entry) entry.count++
    })
    return days
  } else {
    // Weekly bars — align to Sunday
    const weeks = []
    const cursor = new Date(start)
    cursor.setDate(cursor.getDate() - cursor.getDay())
    while (cursor <= end) {
      const ws = new Date(cursor)
      const we = new Date(cursor); we.setDate(we.getDate() + 6); we.setHours(23,59,59,999)
      const mo = ws.getMonth() + 1
      weeks.push({ label: `${mo}/${ws.getDate()}`, start: new Date(ws), end: new Date(we), isToday: false, count: 0 })
      cursor.setDate(cursor.getDate() + 7)
    }
    tasks.forEach(t => {
      if (!(t.done || t.archived)) return
      const td = taskDate(t); if (!td) return
      const w = weeks.find(w => td >= w.start && td <= w.end)
      if (w) w.count++
    })
    return weeks
  }
}

const Icon = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={path}/>
  </svg>
)

const ICONS = {
  back:   'M13 4L7 10l6 6',
  check:  'M3.5 10l4 4 9-9',
  fire:   'M10 18c-4 0-7-2.5-7-6.5 0-2 .8-3.8 2.2-5 0 1.5.8 2.8 2 3.5C7 8 7.5 5.5 9 4c.5 2 1.5 3.5 3 4.5.5-1 .5-2 .2-3C14.5 7 17 9.5 17 11.5c0 4-3 6.5-7 6.5z',
  rate:   'M10 2l2.4 4.8 5.3.8-3.8 3.7.9 5.2L10 14l-4.8 2.5.9-5.2L2.3 7.6l5.3-.8z',
  trophy: 'M7 3H3v4a4 4 0 004 4m6-8h4v4a4 4 0 01-4 4m-6 0a4 4 0 004 4m0 0v2m0 0h-3m3 0h3',
  chart:  'M3 15h2.5V9H3zM8.75 15h2.5V5h-2.5zM14.5 15H17V11h-2.5z',
  empty:  'M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h5.5L15 7.5V15a2 2 0 01-2 2zM9 3v4.5H15',
  total:  'M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h0a2 2 0 002-2M9 5a2 2 0 012-2h0a2 2 0 012 2',
}

// Bar chart with hover + tap tooltip
function BarChart({ barData, rangeLabel }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const maxBar = Math.max(...barData.map(d => d.count), 1)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400 dark:text-gray-500"><Icon path={ICONS.chart} size={16}/></span>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{rangeLabel} Activity</p>
      </div>

      <div className="flex items-end gap-1" style={{ height: '96px' }}>
        {barData.map((d, i) => {
          const isActive = activeIdx === i
          const barH = Math.max((d.count / maxBar) * 72, d.count > 0 ? 6 : 2)

          return (
            <div
              key={i}
              className="flex-1 min-w-[18px] flex flex-col items-center gap-1 cursor-pointer select-none"
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              onTouchStart={() => setActiveIdx(idx => idx === i ? null : i)}
            >
              {/* Count label — always reserve space, show when active or count > 0 */}
              <span
                className="text-xs tabular-nums font-medium transition-all duration-150"
                style={{
                  color: isActive
                    ? 'rgb(17 24 39)' // gray-900
                    : d.count > 0
                    ? 'rgb(156 163 175)' // gray-400
                    : 'transparent',
                  // dark handled via filter trick — we use inline for simplicity
                }}
              >
                {d.count > 0 ? d.count : '0'}
              </span>

              {/* Bar */}
              <div className="w-full flex flex-col justify-end" style={{ height: '72px' }}>
                <div
                  className={`w-full rounded-t-md transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-700 dark:bg-gray-200'
                      : d.isToday
                      ? 'bg-gray-900 dark:bg-white'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                  style={{ height: `${barH}px` }}
                />
              </div>

              {/* Day label */}
              <span className={`text-xs leading-none ${
                d.isToday
                  ? 'font-semibold text-gray-900 dark:text-white'
                  : isActive
                  ? 'text-gray-700 dark:text-gray-200'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {d.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile hint */}
      <p className="text-xs text-gray-300 dark:text-gray-700 text-center mt-3">
        Tap a bar to see count
      </p>
    </div>
  )
}

export default function StatsScreen({ tasks, onClose }) {
  const [range, setRange] = useState('this_week')
  const { start, end }    = getRangeBounds(range)

  const inRange = tasks.filter(t => {
    if (!(t.done || t.archived)) return false
    const d = taskDate(t)
    return d && d >= start && d <= end
  })

  const createdInRange = tasks.filter(t => {
    const d = t.createdAt ? new Date(t.createdAt) : null
    return d && d >= start && d <= end
  })

  const totalDone    = inRange.length
  const totalCreated = createdInRange.length
  const rate         = totalCreated > 0 ? Math.round((totalDone / totalCreated) * 100) : 0
  const streak       = computeStreak(tasks)

  const todayStr  = new Date().toISOString().split('T')[0]
  const todayDone = tasks.filter(t => {
    if (!(t.done || t.archived)) return false
    const d = taskDate(t)
    return d && d.toISOString().split('T')[0] === todayStr
  }).length

  const barData = buildBarData(tasks, start, end)

  const tagCounts = {}
  inRange.forEach(t => { tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1 })
  const tagEntries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])

  const dayTotals = Array(7).fill(0)
  inRange.filter(t => taskDate(t)).forEach(t => { dayTotals[taskDate(t).getDay()]++ })
  const bestDay = DAY_LABELS[dayTotals.indexOf(Math.max(...dayTotals))]

  const metrics = [
    { value: todayDone,    label: 'Done Today',       sub: 'tasks completed today',                       iconPath: ICONS.check },
    { value: totalDone,    label: 'Completed',         sub: 'in selected period',                          iconPath: ICONS.total },
    { value: `${streak}d`, label: 'Current Streak',    sub: streak === 1 ? '1 day in a row' : `${streak} days in a row`, iconPath: ICONS.fire  },
    { value: `${rate}%`,   label: 'Completion Rate',   sub: `${totalDone} of ${totalCreated} tasks`,       iconPath: ICONS.rate  },
  ]

  const rangeLabel = RANGES.find(r => r.id === range)?.label ?? ''

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

        {/* Range pills */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                range === r.id
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-serif text-3xl text-gray-900 dark:text-white font-medium leading-none">{m.value}</p>
                <span className="text-gray-300 dark:text-gray-600"><Icon path={m.iconPath} size={16}/></span>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{m.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Most productive day */}
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

        {/* Bar chart */}
        <BarChart barData={barData} rangeLabel={rangeLabel} />

        {/* Tag breakdown */}
        {tagEntries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">By Category</p>
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
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No data for this period</p>
            <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Complete some tasks to see your stats</p>
          </div>
        )}

      </div>
    </div>
  )
}
