// TaskForm.jsx — UPDATED
// Added: Today / Tomorrow quick buttons + date picker + time picker
// dueDate (YYYY-MM-DD) + dueTime (HH:MM) sent to Flask together

import { useState } from 'react'
import { TAGS, TASK_TEMPLATES, PRIORITIES } from '../hooks/useTasks'
import ClockPicker from './ClockPicker'

// Helper: format a Date object to "YYYY-MM-DD" string for the input
const toDateStr = (date) => date.toISOString().split('T')[0]

const today    = () => toDateStr(new Date())
const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toDateStr(d)
}

// Human-readable label for the selected date
const dateSummary = (dateStr) => {
  if (!dateStr) return null
  const t = today()
  const m = tomorrow()
  if (dateStr === t) return 'Today'
  if (dateStr === m) return 'Tomorrow'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })
}

export default function TaskForm({ onAdd, isOpen, onClose }) {
  const [title,     setTitle]     = useState('')
  const [tag,       setTag]       = useState('work')
  const [priority,  setPriority]  = useState('medium')
  const [dueDate,   setDueDate]   = useState('')
  const [dueTime,   setDueTime]   = useState('')
  const [important, setImportant] = useState(false)
  const [showCal,   setShowCal]   = useState(false)

  const reset = () => {
    setTitle(''); setTag('work'); setPriority('medium')
    setDueDate(''); setDueTime(''); setImportant(false); setShowCal(false)
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    onAdd({ title: title.trim(), tag, priority, dueDate, dueTime, important })
    reset(); onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-20 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) { reset(); onClose() } }}
    >
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">New task</h2>
          <button onClick={() => { reset(); onClose() }}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Task name</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') handleSubmit(); if(e.key==='Escape') { reset(); onClose() }}}
            placeholder="What needs to be done?" autoFocus
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"/>
        </div>

        {/* Tag selector */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tag</label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(t => (
              <button key={t.id} type="button" onClick={() => setTag(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  tag === t.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick templates */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Quick templates</label>
          <div className="flex flex-wrap gap-1.5">
            {(TASK_TEMPLATES[tag] || []).map(tmpl => (
              <button key={tmpl} type="button" onClick={() => setTitle(tmpl)}
                className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                {tmpl}
              </button>
            ))}
          </div>
        </div>

        {/* ── Due date section ── */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Due date</label>

          {/* Quick buttons row */}
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => { setDueDate(today()); setShowCal(false) }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                dueDate === today()
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
              Today
            </button>
            <button type="button" onClick={() => { setDueDate(tomorrow()); setShowCal(false) }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                dueDate === tomorrow()
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
              Tomorrow
            </button>
            <button type="button" onClick={() => setShowCal(!showCal)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                showCal || (dueDate && dueDate !== today() && dueDate !== tomorrow())
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
              Pick date
            </button>
            {dueDate && (
              <button type="button" onClick={() => { setDueDate(''); setShowCal(false) }}
                className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all border border-gray-200 dark:border-gray-600">
                ✕
              </button>
            )}
          </div>

          {/* Calendar input — shown when Pick date is clicked */}
          {showCal && (
            <input type="date" value={dueDate}
              min={today()}
              onChange={e => { setDueDate(e.target.value); setShowCal(false) }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 mb-2"/>
          )}

          {/* Summary of selected date */}
          {dueDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📅 {dateSummary(dueDate)}
            </p>
          )}
        </div>

        {/* Priority row */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500">
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        {/* Analog clock time picker */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Time (optional)
            </label>
            {/* Toggle to show/hide clock */}
            <button type="button" onClick={() => setDueTime(dueTime ? '' : '09:00')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                dueTime
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}>
              {dueTime ? `Set: ${dueTime}` : 'Add time'}
            </button>
          </div>

          {/* Clock shown only when a time is set */}
          {dueTime !== '' && (
            <div className="flex justify-center py-2 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <ClockPicker value={dueTime} onChange={setDueTime} />
            </div>
          )}
        </div>

        {/* Important toggle */}
        <div className="mb-5">
          <button type="button" onClick={() => setImportant(!important)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              important ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              important ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 dark:border-gray-500'}`}>
              {important && <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-medium ${important ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'}`}>
                ★ Mark as important
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {important && dueDate && dueTime
                  ? 'Push + email reminder 15 min before due time'
                  : 'Add a date and time to enable reminders'}
              </p>
            </div>
          </button>
        </div>

        <button onClick={handleSubmit} disabled={!title.trim()}
          className="w-full py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Add task
        </button>
      </div>
    </div>
  )
}
