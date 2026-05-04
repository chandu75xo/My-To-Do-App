// StatsScreen.jsx — v9: This Week / This Month / Last Month (weekly groups)
import { useState } from 'react'

const DAY_LABELS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const TAG_COLORS = {
  work:     'bg-blue-500',
  home:     'bg-amber-500',
  health:   'bg-green-500',
  shopping: 'bg-red-500',
  personal: 'bg-purple-500',
}
const TAG_LABELS = {
  work: 'Work', home: 'Home', health: 'Health', shopping: 'Shopping', personal: 'Personal',
}

const RANGES = [
  { id: 'this_week',  label: 'This Week'  },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
]

// ── date helpers ──────────────────────────────────────────────────────────

function getRangeBounds(rangeId) {
  const now = new Date()
  switch (rangeId) {
    case 'this_week': {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay()) // Sunday
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)            // Saturday
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    case 'last_month':
    default: {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end   = new Date(now.getFullYear(), now.getMonth(), 0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
  }
}

function taskDate(t) {
  if (t.completedAt) return new Date(t.completedAt)
  if (t.dueDate)     return new Date(t.dueDate + 'T00:00:00')
  if (t.createdAt)   return new Date(t.createdAt)
  return null
}

function toDateStr(d) { return d.toISOString().split('T')[0] }
function todayStr()   { return toDateStr(new Date()) }

function computeStreak(tasks) {
  const doneDates = new Set(
    tasks
      .filter(t => t.done || t.archived)
      .map(t => { const d = taskDate(t); return d ? toDateStr(d) : null })
      .filter(Boolean)
  )
  let streak = 0
  const d = new Date(); d.setHours(0, 0, 0, 0)
  if (!doneDates.has(toDateStr(d))) d.setDate(d.getDate() - 1)
  while (doneDates.has(toDateStr(d))) { streak++; d.setDate(d.getDate() - 1) }
  return streak
}

// ── bar data builders ─────────────────────────────────────────────────────

// Returns flat array of { label, dateStr, isToday, inRange, count }
function buildWeeklyBars(tasks, start, end) {
  const today = todayStr()
  // Build a map: dateStr → count
  const countMap = {}
  tasks.forEach(t => {
    if (!(t.done || t.archived)) return
    const d = taskDate(t); if (!d) return
    const ds = toDateStr(d)
    countMap[ds] = (countMap[ds] || 0) + 1
  })

  const bars = []
  // Walk from the Sunday on or before `start` to the Saturday on or after `end`
  const cursor = new Date(start)
  cursor.setDate(cursor.getDate() - cursor.getDay()) // back to Sunday
  cursor.setHours(0, 0, 0, 0)

  const rangeEnd = new Date(end)

  while (cursor <= rangeEnd) {
    const ds      = toDateStr(cursor)
    const inRange = cursor >= start && cursor <= rangeEnd
    bars.push({
      label:   DAY_INITIALS[cursor.getDay()],
      dateStr: ds,
      isToday: ds === today,
      inRange,                          // false = blank bar (outside month)
      count:   inRange ? (countMap[ds] || 0) : 0,
      weekDay: cursor.getDay(),         // 0=Sun
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return bars
}

// Groups flat bars into weeks of 7
function groupIntoWeeks(bars) {
  const weeks = []
  for (let i = 0; i < bars.length; i += 7) {
    const slice = bars.slice(i, i + 7)
    // Label = first in-range date in DD/MM
    const firstInRange = slice.find(b => b.inRange)
    const label = firstInRange
      ? (() => {
          const d = new Date(firstInRange.dateStr + 'T00:00:00')
          return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
        })()
      : ''
    weeks.push({ bars: slice, label })
  }
  return weeks
}

// For This Week and This Month: flat daily bars (no grouping)
function buildDailyBars(tasks, start, end) {
  const today = todayStr()
  const countMap = {}
  tasks.forEach(t => {
    if (!(t.done || t.archived)) return
    const d = taskDate(t); if (!d) return
    const ds = toDateStr(d)
    countMap[ds] = (countMap[ds] || 0) + 1
  })
  const bars = []
  const cursor = new Date(start); cursor.setHours(0,0,0,0)
  const endD   = new Date(end)
  while (cursor <= endD) {
    const ds = toDateStr(cursor)
    bars.push({
      label:   DAY_LABELS[cursor.getDay()].slice(0,1),
      dateStr: ds,
      isToday: ds === today,
      inRange: true,
      count:   countMap[ds] || 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return bars
}

// ── sub-components ────────────────────────────────────────────────────────

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

// Single flat bar
function Bar({ bar, isActive, onEnter, onLeave, onTap }) {
  const BAR_MAX_H = 56   // px — keeps bars well inside the card
  const barH = bar.inRange
    ? Math.max((bar.count / 1) * BAR_MAX_H, bar.count > 0 ? 6 : 2)
    : 2   // blank bar for out-of-range days

  return (
    <div
      className="flex flex-col items-center gap-0.5 cursor-pointer select-none"
      style={{ flex: '1 1 0', minWidth: 0 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onTouchStart={(e) => { e.preventDefault(); onTap() }}
    >
      {/* Count — only visible when active */}
      <span className={`text-xs tabular-nums font-semibold leading-none transition-opacity duration-100 ${
        isActive && bar.inRange && bar.count > 0
          ? 'opacity-100 text-gray-900 dark:text-white'
          : 'opacity-0'
      }`}>
        {bar.count}
      </span>

      {/* Bar area */}
      <div className="w-full flex flex-col justify-end" style={{ height: `${BAR_MAX_H}px` }}>
        <div
          className={`w-full rounded-t transition-colors duration-150 ${
            !bar.inRange
              ? 'bg-gray-100 dark:bg-gray-800'                          // out-of-month: very faint
              : isActive
              ? 'bg-gray-500 dark:bg-gray-200'                          // hover: dark grey / near-white
              : bar.isToday
              ? 'bg-gray-400 dark:bg-gray-500'                          // today: medium grey
              : 'bg-gray-200 dark:bg-gray-700'                          // default: light / dark grey
          }`}
          style={{ height: `${barH}px` }}
        />
      </div>

      {/* Label */}
      <span className={`text-xs leading-none transition-colors duration-150 ${
        !bar.inRange
          ? 'text-gray-300 dark:text-gray-700'
          : isActive
          ? 'font-semibold text-gray-800 dark:text-gray-100'
          : bar.isToday
          ? 'font-semibold text-gray-600 dark:text-gray-300'
          : 'text-gray-400 dark:text-gray-500'
      }`}>
        {bar.label}
      </span>
    </div>
  )
}

// Flat bar chart (This Week / This Month)
function FlatBarChart({ bars, rangeLabel }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const maxCount = Math.max(...bars.map(b => b.count), 1)

  // Normalize bar heights against actual max
  const normalised = bars.map(b => ({
    ...b,
    count: b.count,
    _maxCount: maxCount,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400 dark:text-gray-500"><Icon path={ICONS.chart} size={16}/></span>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{rangeLabel} Activity</p>
      </div>
      <div className="flex items-end gap-1 w-full overflow-hidden">
        {normalised.map((b, i) => {
          const BAR_MAX_H = 56
          const barH = Math.max((b.count / maxCount) * BAR_MAX_H, b.count > 0 ? 6 : 2)
          const isActive = activeIdx === i
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-0.5 cursor-pointer select-none"
              style={{ flex: '1 1 0', minWidth: 0 }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              onTouchStart={(e) => { e.preventDefault(); setActiveIdx(p => p === i ? null : i) }}
            >
              <span className={`text-xs tabular-nums font-semibold leading-none transition-opacity duration-100 ${
                isActive && b.count > 0 ? 'opacity-100 text-gray-900 dark:text-white' : 'opacity-0'
              }`}>{b.count}</span>
              <div className="w-full flex flex-col justify-end" style={{ height: '56px' }}>
                <div className={`w-full rounded-t transition-colors duration-150 ${
                  isActive
                    ? 'bg-gray-500 dark:bg-gray-200'
                    : b.isToday
                    ? 'bg-gray-400 dark:bg-gray-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`} style={{ height: `${barH}px` }}/>
              </div>
              <span className={`text-xs leading-none ${
                isActive ? 'font-semibold text-gray-800 dark:text-gray-100'
                : b.isToday ? 'font-semibold text-gray-600 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-500'
              }`}>{b.label}</span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-300 dark:text-gray-600 text-center mt-3 select-none">
        Hover or tap a bar to see count
      </p>
    </div>
  )
}

// Grouped weekly chart (Last Month) — 4–5 week groups each with 7 day bars
function GroupedWeekChart({ weeks }) {
  const [activeKey, setActiveKey] = useState(null) // "weekIdx-barIdx"
  const allCounts = weeks.flatMap(w => w.bars.map(b => b.count))
  const maxCount  = Math.max(...allCounts, 1)
  const BAR_MAX_H = 56

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400 dark:text-gray-500"><Icon path={ICONS.chart} size={16}/></span>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Month Activity</p>
      </div>

      {/* Week groups */}
      <div className="flex gap-2 w-full overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col items-center" style={{ flex: '1 1 0', minWidth: 0 }}>

            {/* 7 day bars */}
            <div className="flex gap-px w-full items-end" style={{ height: `${BAR_MAX_H + 20}px` }}>
              {week.bars.map((bar, bi) => {
                const key      = `${wi}-${bi}`
                const isActive = activeKey === key
                const barH     = bar.inRange
                  ? Math.max((bar.count / maxCount) * BAR_MAX_H, bar.count > 0 ? 6 : 2)
                  : 2

                return (
                  <div
                    key={bi}
                    className="flex flex-col items-center justify-end gap-0.5 cursor-pointer select-none"
                    style={{ flex: '1 1 0', minWidth: 0, height: `${BAR_MAX_H + 20}px` }}
                    onMouseEnter={() => setActiveKey(key)}
                    onMouseLeave={() => setActiveKey(null)}
                    onTouchStart={(e) => { e.preventDefault(); setActiveKey(p => p === key ? null : key) }}
                  >
                    {/* Count bubble */}
                    <span className={`text-xs tabular-nums font-semibold leading-none transition-opacity duration-100 ${
                      isActive && bar.inRange && bar.count > 0
                        ? 'opacity-100 text-gray-900 dark:text-white'
                        : 'opacity-0'
                    }`} style={{ fontSize: '10px' }}>
                      {bar.count}
                    </span>

                    {/* Bar */}
                    <div className="w-full flex flex-col justify-end" style={{ height: `${BAR_MAX_H}px` }}>
                      <div
                        className={`w-full rounded-t transition-colors duration-150 ${
                          !bar.inRange
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : isActive
                            ? 'bg-gray-500 dark:bg-gray-200'
                            : bar.isToday
                            ? 'bg-gray-400 dark:bg-gray-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        style={{ height: `${barH}px` }}
                      />
                    </div>

                    {/* Day initial */}
                    <span className={`leading-none ${
                      !bar.inRange
                        ? 'text-gray-200 dark:text-gray-800'
                        : isActive
                        ? 'font-semibold text-gray-700 dark:text-gray-200'
                        : 'text-gray-400 dark:text-gray-500'
                    }`} style={{ fontSize: '9px' }}>
                      {bar.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Week label DD/MM below group */}
            <div className="mt-1 text-center w-full">
              <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '9px' }}>
                {week.label}
              </span>
            </div>

            {/* Divider between weeks (not after last) */}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-300 dark:text-gray-600 text-center mt-3 select-none">
        Hover or tap a bar to see count
      </p>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────

export default function StatsScreen({ tasks, onClose }) {
  const [range, setRange] = useState('this_week')
  const { start, end }    = getRangeBounds(range)

  // Tasks completed/done within range
  const inRange = tasks.filter(t => {
    if (!(t.done || t.archived)) return false
    const d = taskDate(t)
    return d && d >= start && d <= end
  })

  // Tasks created in range (for completion rate)
  const createdInRange = tasks.filter(t => {
    const d = t.createdAt ? new Date(t.createdAt) : null
    return d && d >= start && d <= end
  })

  const totalDone    = inRange.length
  const totalCreated = createdInRange.length
  const rate         = totalCreated > 0 ? Math.round((totalDone / totalCreated) * 100) : 0
  const streak       = computeStreak(tasks)

  const today = todayStr()
  const todayDone = tasks.filter(t => {
    if (!(t.done || t.archived)) return false
    const d = taskDate(t)
    return d && toDateStr(d) === today
  }).length

  // Build chart data
  const isLastMonth = range === 'last_month'
  const flatBars    = isLastMonth ? null : buildDailyBars(tasks, start, end)
  const weekGroups  = isLastMonth ? groupIntoWeeks(buildWeeklyBars(tasks, start, end)) : null

  // Tag breakdown
  const tagCounts = {}
  inRange.forEach(t => { tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1 })
  const tagEntries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])

  // Most productive day
  const dayTotals = Array(7).fill(0)
  inRange.filter(t => taskDate(t)).forEach(t => { dayTotals[taskDate(t).getDay()]++ })
  const bestDay = DAY_LABELS[dayTotals.indexOf(Math.max(...dayTotals))]

  const rangeLabel = RANGES.find(r => r.id === range)?.label ?? ''

  const metrics = [
    { value: todayDone,    label: 'Done Today',     sub: 'tasks completed today',                       iconPath: ICONS.check },
    { value: totalDone,    label: 'Completed',       sub: 'in selected period',                          iconPath: ICONS.total },
    { value: `${streak}d`, label: 'Current Streak',  sub: streak === 1 ? '1 day in a row' : `${streak} days in a row`, iconPath: ICONS.fire  },
    { value: `${rate}%`,   label: 'Completion Rate', sub: `${totalDone} of ${totalCreated} tasks`,       iconPath: ICONS.rate  },
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

        {/* Chart */}
        {isLastMonth
          ? <GroupedWeekChart weeks={weekGroups} />
          : <FlatBarChart bars={flatBars} rangeLabel={rangeLabel} />
        }

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
