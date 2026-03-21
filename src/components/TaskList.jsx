// TaskList.jsx — UPDATED
// Tasks are now grouped into sections: Overdue, Today, Tomorrow, This Week, No Date, Completed.

import TaskCard from './TaskCard'

// ── Date helpers ────────────────────────────────────────────────────────────
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x }

const getGroup = (task) => {
  if (task.done) return 'completed'
  if (!task.dueDate) return 'nodate'

  const today    = startOfDay(new Date())
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const weekEnd  = new Date(today); weekEnd.setDate(today.getDate() + 7)
  const due      = startOfDay(new Date(task.dueDate + 'T00:00:00'))

  if (due < today)                              return 'overdue'
  if (due.getTime() === today.getTime())        return 'today'
  if (due.getTime() === tomorrow.getTime())     return 'tomorrow'
  if (due <= weekEnd)                           return 'thisweek'
  return 'nodate'
}

const SECTIONS = [
  { key: 'overdue',   label: 'Overdue',    labelClass: 'text-red-500 dark:text-red-400' },
  { key: 'today',     label: 'Today',      labelClass: 'text-gray-500 dark:text-gray-400' },
  { key: 'tomorrow',  label: 'Tomorrow',   labelClass: 'text-gray-500 dark:text-gray-400' },
  { key: 'thisweek',  label: 'This week',  labelClass: 'text-gray-500 dark:text-gray-400' },
  { key: 'nodate',    label: 'No date',    labelClass: 'text-gray-400 dark:text-gray-500' },
  { key: 'completed', label: 'Completed',  labelClass: 'text-gray-400 dark:text-gray-500' },
]

export default function TaskList({ tasks, activeTag, onToggle, onDelete, onToggleImportant, onClearCompleted }) {
  const filtered = activeTag === 'all' ? tasks : tasks.filter(t => t.tag === activeTag)

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">✦</div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No tasks here yet</p>
        <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Tap + to add one</p>
      </div>
    )
  }

  // Group tasks into their sections
  const groups = {}
  SECTIONS.forEach(s => groups[s.key] = [])
  filtered.forEach(t => groups[getGroup(t)]?.push(t))

  return (
    <div className="space-y-6">
      {SECTIONS.map(section => {
        const items = groups[section.key]
        if (!items || items.length === 0) return null

        return (
          <section key={section.key}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-widest ${section.labelClass}`}>
                  {section.label}
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              {/* Clear button only on completed section */}
              {section.key === 'completed' && (
                <button onClick={onClearCompleted}
                  className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors">
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-2">
              {items.map(task => (
                <TaskCard key={task.id} task={task}
                  onToggle={onToggle} onDelete={onDelete} onToggleImportant={onToggleImportant}/>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
