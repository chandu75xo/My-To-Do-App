// StatsScreen.jsx — v10
// This Week  : 7 bars, Sun–Sat, full day names, hover shows count + DD/MM
// This Month : week-grouped rows (Week 1…N), each row = Sun–Sat, same hover
// Last Month : same week-grouped rows as This Month

import { useState } from 'react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TAG_COLORS = {
  work: 'bg-blue-500', home: 'bg-amber-500', health: 'bg-green-500',
  shopping: 'bg-red-500', personal: 'bg-purple-500',
}
const TAG_LABELS = {
  work: 'Work', home: 'Home', health: 'Health', shopping: 'Shopping', personal: 'Personal',
}

const RANGES = [
  { id: 'this_week',  label: 'This Week'  },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
]

// ── helpers ────────────────────────────────────────────────────────────────

function toDS(d) { return d.toISOString().split('T')[0] }

function getRangeBounds(id) {
  const now = new Date()
  if (id === 'this_week') {
    const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0)
    const e = new Date(s);   e.setDate(s.getDate() + 6);              e.setHours(23,59,59,999)
    return { start: s, end: e }
  }
  if (id === 'this_month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1)
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0); e.setHours(23,59,59,999)
    return { start: s, end: e }
  }
  // last_month
  const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const e = new Date(now.getFullYear(), now.getMonth(), 0); e.setHours(23,59,59,999)
  return { start: s, end: e }
}

function taskDate(t) {
  if (t.completedAt) return new Date(t.completedAt)
  if (t.dueDate)     return new Date(t.dueDate + 'T00:00:00')
  if (t.createdAt)   return new Date(t.createdAt)
  return null
}

function computeStreak(tasks) {
  const set = new Set(
    tasks.filter(t => t.done || t.archived)
         .map(t => { const d = taskDate(t); return d ? toDS(d) : null })
         .filter(Boolean)
  )
  const cur = new Date(); cur.setHours(0,0,0,0)
  if (!set.has(toDS(cur))) cur.setDate(cur.getDate() - 1)
  let streak = 0
  while (set.has(toDS(cur))) { streak++; cur.setDate(cur.getDate() - 1) }
  return streak
}

// Build a count map: dateStr → number of completed tasks
function countMap(tasks) {
  const map = {}
  tasks.forEach(t => {
    if (!(t.done || t.archived)) return
    const d = taskDate(t); if (!d) return
    const ds = toDS(d)
    map[ds] = (map[ds] || 0) + 1
  })
  return map
}

// For This Week: 7 day objects Sun–Sat
function buildWeekDays(tasks, start) {
  const cm    = countMap(tasks)
  const today = toDS(new Date())
  return Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(start); d.setDate(start.getDate() + i)
    const ds = toDS(d)
    return {
      dayName: DAY_NAMES[d.getDay()],
      dateStr: ds,
      ddmm:    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
      isToday: ds === today,
      inRange: true,
      count:   cm[ds] || 0,
    }
  })
}

// For This Month / Last Month: split into week rows (Sun–Sat)
// Days outside the month are inRange=false (blank bars)
function buildMonthWeeks(tasks, start, end) {
  const cm    = countMap(tasks)
  const today = toDS(new Date())

  // Anchor to the Sunday on/before the 1st of month
  const anchor = new Date(start)
  anchor.setDate(anchor.getDate() - anchor.getDay())
  anchor.setHours(0,0,0,0)

  const weeks = []
  const cursor = new Date(anchor)

  while (cursor <= end) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d      = new Date(cursor); d.setDate(cursor.getDate() + i)
      const ds     = toDS(d)
      const inRange = d >= start && d <= end
      return {
        dayName: DAY_NAMES[d.getDay()],
        dateStr: ds,
        ddmm:    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
        isToday: ds === today,
        inRange,
        count:   inRange ? (cm[ds] || 0) : 0,
      }
    })
    weeks.push(days)
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

// ── icons ──────────────────────────────────────────────────────────────────

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

// ── WeekRow: one row of 7 bars (Sun–Sat) ──────────────────────────────────

function WeekRow({ days, weekLabel, maxCount }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const BAR_H = 52  // fixed max bar height px

  return (
    <div className="flex items-start gap-2">
      {/* Week label — fixed width so bars always align */}
      {weekLabel !== undefined && (
        <div className="flex-shrink-0 w-14 pt-1">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {weekLabel}
          </span>
        </div>
      )}

      {/* 7 bars */}
      <div className="flex gap-1 flex-1 min-w-0">
        {days.map((day, i) => {
          const isActive = activeIdx === i
          const barH = day.inRange
            ? Math.max((day.count / Math.max(maxCount, 1)) * BAR_H, day.count > 0 ? 6 : 2)
            : 2

          return (
            <div
              key={i}
              className="flex flex-col items-center select-none cursor-pointer"
              style={{ flex: '1 1 0', minWidth: 0 }}
              onMouseEnter={() => day.inRange && setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              onTouchStart={(e) => { e.preventDefault(); setActiveIdx(p => p === i ? null : i) }}
            >
              {/* Count + DD/MM tooltip — only when active and has count */}
              <div className={`flex flex-col items-center transition-opacity duration-100 ${
                isActive && day.inRange && day.count > 0 ? 'opacity-100' : 'opacity-0'
              }`} style={{ minHeight: '28px' }}>
                <span className="text-xs font-bold tabular-nums text-gray-900 dark:text-white leading-none">
                  {day.count}
                </span>
                <span className="text-gray-400 dark:text-gray-500 leading-none mt-0.5" style={{ fontSize: '9px' }}>
                  {day.ddmm}
                </span>
              </div>

              {/* Bar */}
              <div className="w-full flex flex-col justify-end" style={{ height: `${BAR_H}px` }}>
                <div
                  className={`w-full rounded-t transition-colors duration-150 ${
                    !day.inRange
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : isActive
                      ? 'bg-gray-500 dark:bg-gray-300'
                      : day.isToday
                      ? 'bg-gray-400 dark:bg-gray-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ height: `${barH}px` }}
                />
              </div>

              {/* Day name */}
              <span className={`leading-none mt-1 transition-colors duration-150 ${
                !day.inRange
                  ? 'text-gray-200 dark:text-gray-800'
                  : isActive
                  ? 'font-semibold text-gray-700 dark:text-gray-200'
                  : day.isToday
                  ? 'font-semibold text-gray-500 dark:text-gray-300'
                  : 'text-gray-400 dark:text-gray-500'
              }`} style={{ fontSize: '10px' }}>
                {day.dayName}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── SingleWeekChart: This Week (no week label) ────────────────────────────

function SingleWeekChart({ days }) {
  const maxCount = Math.max(...days.map(d => d.count), 1)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400 dark:text-gray-500"><Icon path={ICONS.chart} size={16}/></span>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">This Week Activity</p>
      </div>
      <WeekRow days={days} maxCount={maxCount} />
      <p className="text-xs text-gray-300 dark:text-gray-600 text-center mt-3 select-none">
        Hover or tap a bar to see count
      </p>
    </div>
  )
}

// ── MultiWeekChart: This Month / Last Month ───────────────────────────────

function MultiWeekChart({ weeks, rangeLabel }) {
  const maxCount = Math.max(...weeks.flatMap(w => w.map(d => d.count)), 1)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400 dark:text-gray-500"><Icon path={ICONS.chart} size={16}/></span>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{rangeLabel} Activity</p>
      </div>

      <div className="flex flex-col gap-4">
        {weeks.map((days, wi) => (
          <WeekRow
            key={wi}
            days={days}
            weekLabel={`Week ${wi + 1}`}
            maxCount={maxCount}
          />
        ))}
      </div>

      <p className="text-xs text-gray-300 dark:text-gray-600 text-center mt-4 select-none">
        Hover or tap a bar to see count
      </p>
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────

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
  const todayDone    = tasks.filter(t => {
    if (!(t.done || t.archived)) return false
    const d = taskDate(t)
    return d && toDS(d) === toDS(new Date())
  }).length

  // Chart data
  const isWeek   = range === 'this_week'
  const weekDays  = isWeek ? buildWeekDays(tasks, start) : null
  const monthWeeks = !isWeek ? buildMonthWeeks(tasks, start, end) : null

  // Tag breakdown
  const tagCounts = {}
  inRange.forEach(t => { tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1 })
  const tagEntries = Object.entries(tagCounts).sort((a,b) => b[1]-a[1])

  // Best day
  const dayTotals = Array(7).fill(0)
  inRange.filter(t => taskDate(t)).forEach(t => { dayTotals[taskDate(t).getDay()]++ })
  const bestDay = DAY_NAMES[dayTotals.indexOf(Math.max(...dayTotals))]

  const rangeLabel = RANGES.find(r => r.id === range)?.label ?? ''

  const metrics = [
    { value: todayDone,    label: 'Done Today',     sub: 'tasks completed today',                           iconPath: ICONS.check },
    { value: totalDone,    label: 'Completed',       sub: 'in selected period',                              iconPath: ICONS.total },
    { value: `${streak}d`, label: 'Current Streak',  sub: streak === 1 ? '1 day in a row' : `${streak} days in a row`, iconPath: ICONS.fire  },
    { value: `${rate}%`,   label: 'Completion Rate', sub: `${totalDone} of ${totalCreated} tasks`,           iconPath: ICONS.rate  },
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
        {isWeek
          ? <SingleWeekChart days={weekDays} />
          : <MultiWeekChart  weeks={monthWeeks} rangeLabel={rangeLabel} />
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
                    <div className={`h-full rounded-full transition-all duration-500 ${TAG_COLORS[tag] || 'bg-gray-400'}`}
                      style={{ width: `${(count / totalDone) * 100}%` }}/>
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
