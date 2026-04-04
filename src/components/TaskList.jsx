// TaskList.jsx — v5: better empty states, passes subtask handlers

import TaskCard from './TaskCard'

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x }

const getGroup = (task) => {
  if (task.done) return 'completed'
  if (!task.dueDate) return 'nodate'
  const today    = startOfDay(new Date())
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const weekEnd  = new Date(today); weekEnd.setDate(today.getDate() + 7)
  const due      = startOfDay(new Date(task.dueDate + 'T00:00:00'))
  if (due < today)                          return 'overdue'
  if (due.getTime() === today.getTime())    return 'today'
  if (due.getTime() === tomorrow.getTime()) return 'tomorrow'
  if (due <= weekEnd)                       return 'thisweek'
  return 'nodate'
}

const SECTIONS = [
  { key: 'overdue',   label: 'Overdue',   labelClass: 'text-red-500 dark:text-red-400' },
  { key: 'today',     label: 'Today',     labelClass: 'text-gray-500 dark:text-gray-400' },
  { key: 'tomorrow',  label: 'Tomorrow',  labelClass: 'text-gray-500 dark:text-gray-400' },
  { key: 'thisweek',  label: 'This week', labelClass: 'text-gray-500 dark:text-gray-400' },
  { key: 'nodate',    label: 'No date',   labelClass: 'text-gray-400 dark:text-gray-500' },
  { key: 'completed', label: 'Completed', labelClass: 'text-gray-400 dark:text-gray-500' },
]

const TAG_EMPTY = {
  work:     { icon: '💼', msg: 'No work tasks yet', sub: 'Add tasks for meetings, reports or projects' },
  home:     { icon: '🏠', msg: 'No home tasks yet', sub: 'Add chores, errands or household tasks' },
  health:   { icon: '💪', msg: 'No health tasks yet', sub: 'Add workouts, habits or wellness goals' },
  shopping: { icon: '🛒', msg: 'No shopping tasks yet', sub: 'Add things you need to buy' },
  personal: { icon: '🧘', msg: 'No personal tasks yet', sub: 'Add goals, habits or personal projects' },
  all:      { icon: '✦', msg: 'No tasks yet', sub: 'Tap + to add your first task' },
}

const ALL_DONE_MSGS = [
  'All done! You earned a break. ☕',
  'Everything is checked off. Nice work.',
  'Zero tasks remaining. Enjoy your day.',
  'Inbox zero for tasks. Outstanding.',
]

export default function TaskList({
  tasks, activeTag,
  onToggle, onDelete, onToggleImportant, onClearCompleted, onEdit,
  onAddSubtask, onToggleSubtask, onDeleteSubtask,
  timeFormat
}) {
  const filtered = activeTag === 'all' ? tasks : tasks.filter(t => t.tag === activeTag)

  if (filtered.length === 0) {
    const empty = TAG_EMPTY[activeTag] || TAG_EMPTY.all
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">{empty.icon}</div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{empty.msg}</p>
        <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">{empty.sub}</p>
      </div>
    )
  }

  const groups = {}
  SECTIONS.forEach(s => groups[s.key] = [])
  filtered.forEach(t => groups[getGroup(t)]?.push(t))

  // All non-completed tasks done
  const activeTasks   = filtered.filter(t => !t.done)
  const completedOnly = filtered.filter(t => t.done)
  if (activeTasks.length === 0 && completedOnly.length > 0) {
    const msg = ALL_DONE_MSGS[new Date().getDay() % ALL_DONE_MSGS.length]
    return (
      <div>
        <div className="text-center py-8 mb-6">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">{msg}</p>
        </div>
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Completed</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{completedOnly.length}</span>
            </div>
            <button onClick={onClearCompleted} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
          </div>
          <div className="space-y-2">
            {completedOnly.map(task => (
              <TaskCard key={task.id} task={task}
                onToggle={onToggle} onDelete={onDelete}
                onToggleImportant={onToggleImportant} onEdit={onEdit}
                onAddSubtask={onAddSubtask} onToggleSubtask={onToggleSubtask}
                onDeleteSubtask={onDeleteSubtask} timeFormat={timeFormat} />
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map(section => {
        const items = groups[section.key]
        if (!items || items.length === 0) return null
        return (
          <section key={section.key}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-widest ${section.labelClass}`}>{section.label}</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              {section.key === 'completed' && (
                <button onClick={onClearCompleted} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
              )}
            </div>
            <div className="space-y-2">
              {items.map(task => (
                <TaskCard key={task.id} task={task}
                  onToggle={onToggle} onDelete={onDelete}
                  onToggleImportant={onToggleImportant} onEdit={onEdit}
                  onAddSubtask={onAddSubtask} onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask} timeFormat={timeFormat} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
