// TaskCard.jsx — UPDATED
// Now shows due date alongside due time on the card meta row.

import { TAGS } from '../hooks/useTasks'

const getTag       = (id) => TAGS.find(t => t.id === id) || { label: id, emoji: '•' }
const PRIORITY_DOT = { high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-gray-300 dark:bg-gray-600' }
const TAG_COLORS   = {
  work:     'bg-blue-50  dark:bg-blue-950  text-blue-700  dark:text-blue-300',
  home:     'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
  health:   'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
  shopping: 'bg-red-50   dark:bg-red-950   text-red-700   dark:text-red-300',
  personal: 'bg-gray-100 dark:bg-gray-800  text-gray-600  dark:text-gray-400',
}

// Format due date for display on the card
const formatDueDate = (dateStr, timeStr) => {
  if (!dateStr && !timeStr) return null
  const today    = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  let label = ''
  if (dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    if (d.getTime() === today.getTime())    label = 'Today'
    else if (d.getTime() === tomorrow.getTime()) label = 'Tomorrow'
    else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return timeStr ? (label ? `${label} at ${timeStr}` : timeStr) : label
}

// Is this task overdue?
const isOverdue = (dateStr, done) => {
  if (!dateStr || done) return false
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(dateStr + 'T00:00:00')
  return due < today
}

export default function TaskCard({ task, onToggle, onDelete, onToggleImportant }) {
  const tag       = getTag(task.tag)
  const tagColor  = TAG_COLORS[task.tag] || TAG_COLORS.personal
  const dueLabel  = formatDueDate(task.dueDate, task.dueTime)
  const overdue   = isOverdue(task.dueDate, task.done)

  return (
    <div className={`
      group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200
      ${task.done
        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 opacity-60'
        : task.important
          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 hover:shadow-sm'
          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
      }
    `}>
      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />

      <div onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
          cursor-pointer transition-all duration-200
          ${task.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}>
        {task.done && <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>}
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onToggle(task.id)}>
        <p className={`text-sm font-medium leading-snug ${
          task.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor}`}>
            {tag.emoji} {tag.label}
          </span>
          {dueLabel && (
            <span className={`text-xs flex items-center gap-1 ${
              overdue ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="12" height="11" rx="2"/>
                <path d="M5 1v2M11 1v2M2 7h12" strokeLinecap="round"/>
              </svg>
              {overdue ? `Overdue · ${dueLabel}` : dueLabel}
            </span>
          )}
          {task.important && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center gap-1">
              ★ Important {task.dueDate && task.dueTime && <span title="Reminder active">✉</span>}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onToggleImportant(task.id)}
          className={`p-1.5 rounded-lg transition-all ${
            task.important
              ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
              : 'text-gray-300 dark:text-gray-600 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 opacity-0 group-hover:opacity-100'}`}
          title={task.important ? 'Important — reminder on' : 'Mark as important'}>
          <span className="text-base">{task.important ? '★' : '☆'}</span>
        </button>
        <button onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 4h10M6 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M6.5 7v4M9.5 7v4M4.5 4l.5 9a.5.5 0 00.5.5h6a.5.5 0 00.5-.5l.5-9" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
