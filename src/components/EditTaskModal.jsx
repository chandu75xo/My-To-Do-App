// EditTaskModal.jsx — v5
// Fixed: clock pre-fills correctly using useEffect to sync state when task changes
// Added: recurrence picker

import { useState, useEffect } from 'react'
import { TAGS, PRIORITIES, RECURRENCE_OPTIONS } from '../hooks/useTasks'
import ClockPicker from './ClockPicker'

const toDateStr   = (d) => d.toISOString().split('T')[0]
const todayStr    = () => toDateStr(new Date())
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate()+1); return toDateStr(d) }

const dateSummary = (s) => {
  if (!s) return null
  if (s === todayStr())    return 'Today'
  if (s === tomorrowStr()) return 'Tomorrow'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
}

export default function EditTaskModal({ task, isOpen, onClose, onSave }) {
  const [title,      setTitle]      = useState('')
  const [tag,        setTag]        = useState('personal')
  const [priority,   setPriority]   = useState('medium')
  const [dueDate,    setDueDate]    = useState('')
  const [dueTime,    setDueTime]    = useState('')
  const [important,  setImportant]  = useState(false)
  const [recurrence, setRecurrence] = useState('none')
  const [showCal,    setShowCal]    = useState(false)

  // KEY FIX: sync all state when task changes (was causing clock not pre-filling)
  useEffect(() => {
    if (task) {
      setTitle(task.title      || '')
      setTag(task.tag          || 'personal')
      setPriority(task.priority|| 'medium')
      setDueDate(task.dueDate  || '')
      setDueTime(task.dueTime  || '')
      setImportant(!!task.important)
      setRecurrence(task.recurrence || 'none')
      setShowCal(false)
    }
  }, [task])

  if (!isOpen || !task) return null

  const handleSave = () => {
    if (!title.trim()) return
    onSave(task.id, { title: title.trim(), tag, priority, dueDate, dueTime, important, recurrence })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit task</h2>
          <button onClick={onClose}
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
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"/>
        </div>

        {/* Tag */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tag</label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(t => (
              <button key={t.id} onClick={() => setTag(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  tag === t.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Due date</label>
          <div className="flex gap-2 mb-2">
            {[['Today', todayStr()], ['Tomorrow', tomorrowStr()]].map(([label, val]) => (
              <button key={label} onClick={() => { setDueDate(val); setShowCal(false) }}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                  dueDate === val
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
                {label}
              </button>
            ))}
            <button onClick={() => setShowCal(!showCal)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                showCal || (dueDate && dueDate !== todayStr() && dueDate !== tomorrowStr())
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
              Pick date
            </button>
            {dueDate && (
              <button onClick={() => { setDueDate(''); setShowCal(false) }}
                className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all border border-gray-200 dark:border-gray-600">
                ✕
              </button>
            )}
          </div>
          {showCal && (
            <input type="date" value={dueDate}
              onChange={e => { setDueDate(e.target.value); setShowCal(false) }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 mb-2"/>
          )}
          {dueDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📅 {dateSummary(dueDate)}</p>}
        </div>

        {/* Priority */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300">
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        {/* Time — pre-fills from task.dueTime via useEffect above */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Time (optional)</label>
            <button onClick={() => setDueTime(dueTime ? '' : '09:00')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                dueTime ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
              {dueTime ? `Set: ${dueTime}` : 'Add time'}
            </button>
          </div>
          {dueTime !== '' && (
            <div className="flex justify-center py-2 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
              <ClockPicker value={dueTime} onChange={setDueTime}/>
            </div>
          )}
        </div>

        {/* Recurrence */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Repeat</label>
          <div className="grid grid-cols-4 gap-2">
            {RECURRENCE_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setRecurrence(opt.id)}
                className={`py-2 rounded-xl text-xs font-medium transition-all border ${
                  recurrence === opt.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                {opt.id === 'none' ? '—' : opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Important */}
        <div className="mb-5">
          <button onClick={() => setImportant(!important)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              important ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
              important ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 dark:border-gray-500'}`}>
              {important && <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            </div>
            <p className={`text-sm font-medium ${important ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'}`}>
              ★ Mark as important
            </p>
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!title.trim()}
            className="flex-1 py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all">
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
