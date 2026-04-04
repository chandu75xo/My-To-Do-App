// TaskCard.jsx — v5
// Added: subtask progress bar, expandable subtasks, recurrence badge

import { useState } from 'react'
import { TAGS } from '../hooks/useTasks'
import { formatDueDateTime } from '../hooks/useSettings'

const getTag       = (id) => TAGS.find(t => t.id === id) || { label: id, emoji: '•' }
const PRIORITY_DOT = { high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-gray-300 dark:bg-gray-600' }
const TAG_COLORS   = {
  work:     'bg-blue-50  dark:bg-blue-950  text-blue-700  dark:text-blue-300',
  home:     'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
  health:   'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
  shopping: 'bg-red-50   dark:bg-red-950   text-red-700   dark:text-red-300',
  personal: 'bg-gray-100 dark:bg-gray-800  text-gray-600  dark:text-gray-400',
}

const isOverdue = (dateStr, done) => {
  if (!dateStr || done) return false
  const today = new Date(); today.setHours(0,0,0,0)
  return new Date(dateStr + 'T00:00:00') < today
}

const RECURRENCE_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

export default function TaskCard({
  task, onToggle, onDelete, onToggleImportant, onEdit,
  onAddSubtask, onToggleSubtask, onDeleteSubtask, timeFormat
}) {
  const [expanded,     setExpanded]     = useState(false)
  const [newSubtask,   setNewSubtask]   = useState('')
  const [addingSubtask,setAddingSubtask]= useState(false)

  const tag        = getTag(task.tag)
  const tagColor   = TAG_COLORS[task.tag] || TAG_COLORS.personal
  const dueLabel   = formatDueDateTime(task.dueDate, task.dueTime, timeFormat)
  const overdue    = isOverdue(task.dueDate, task.done)
  const subtasks   = task.subtasks || []
  const subDone    = subtasks.filter(s => s.done).length
  const hasSubtasks = subtasks.length > 0

  const handleAddSubtask = (e) => {
    e.preventDefault()
    const title = newSubtask.trim()
    if (!title) return
    onAddSubtask(task.id, title)
    setNewSubtask('')
  }

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      task.done
        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 opacity-60'
        : task.important
          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
    }`}>

      {/* Main row */}
      <div className="group flex items-start gap-3 p-4">
        {/* Priority dot */}
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />

        {/* Checkbox */}
        <div onClick={() => onToggle(task.id)}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all duration-200 ${
            task.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}>
          {task.done && (
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title — click to expand subtasks if any */}
          <p
            className={`text-sm font-medium leading-snug cursor-pointer ${
              task.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'
            }`}
            onClick={() => hasSubtasks ? setExpanded(!expanded) : onToggle(task.id)}
          >
            {task.title}
            {hasSubtasks && (
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                {expanded ? '▲' : '▼'}
              </span>
            )}
          </p>

          {/* Tags row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor}`}>
              {tag.emoji} {tag.label}
            </span>
            {dueLabel && (
              <span className={`text-xs flex items-center gap-1 font-mono ${
                overdue ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="12" height="11" rx="2"/>
                  <path d="M5 1v2M11 1v2M2 7h12" strokeLinecap="round"/>
                </svg>
                {overdue ? `Overdue · ${dueLabel}` : dueLabel}
              </span>
            )}
            {task.important && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                ★ Important
              </span>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
                ↻ {RECURRENCE_LABEL[task.recurrence]}
              </span>
            )}
          </div>

          {/* Subtask progress bar */}
          {hasSubtasks && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${(subDone / subtasks.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                {subDone}/{subtasks.length}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => onToggleImportant(task.id)}
            className={`p-1.5 rounded-lg transition-all ${
              task.important
                ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                : 'text-gray-300 dark:text-gray-600 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}>
            <span className="text-base">{task.important ? '★' : '☆'}</span>
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 text-gray-400 hover:text-purple-500"
            title="Subtasks">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h10M3 8h7M3 12h5" strokeLinecap="round"/>
            </svg>
          </button>
          <button onClick={() => onEdit(task)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-gray-400 hover:text-blue-500"
            title="Edit">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500"
            title="Delete">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h10M6 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M6.5 7v4M9.5 7v4M4.5 4l.5 9a.5.5 0 00.5.5h6a.5.5 0 00.5-.5l.5-9" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded subtasks panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700/50">
          <div className="pt-3 space-y-1.5">
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 group/sub">
                <div onClick={() => onToggleSubtask(task.id, sub.id)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                    sub.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-green-400'}`}>
                  {sub.done && (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-sm flex-1 ${sub.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {sub.title}
                </span>
                <button onClick={() => onDeleteSubtask(task.id, sub.id)}
                  className="opacity-0 group-hover/sub:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-all p-0.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 2l8 8M10 2L2 10" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}

            {/* Add subtask input */}
            {subtasks.length < 10 && (
              addingSubtask ? (
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                  <input
                    autoFocus
                    type="text"
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onBlur={() => { if (!newSubtask.trim()) setAddingSubtask(false) }}
                    onKeyDown={e => { if (e.key === 'Escape') { setAddingSubtask(false); setNewSubtask('') } }}
                    placeholder="Add a step..."
                    className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                  />
                  <button type="submit"
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90">
                    Add
                  </button>
                </form>
              ) : (
                <button onClick={() => setAddingSubtask(true)}
                  className="mt-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors">
                  <span className="text-base leading-none">+</span> Add step
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
