// TaskForm.jsx — v5c
// Added: custom templates (add + edit + delete per tag)
// Added: utcOffsetMinutes sent with every task for accurate server-side notifications
// Clock defaults to current time

import { useState } from 'react'
import { TAGS, TASK_TEMPLATES, PRIORITIES, RECURRENCE_OPTIONS } from '../hooks/useTasks'
import { useCustomTemplates } from '../hooks/useCustomTemplates'
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
const currentTimeStr = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
}
// Get browser's UTC offset in minutes (e.g. IST = +330)
const getUtcOffset = () => -new Date().getTimezoneOffset()

export default function TaskForm({ onAdd, isOpen, onClose }) {
  const [title,      setTitle]      = useState('')
  const [notes,      setNotes]      = useState('')
  const [tag,        setTag]        = useState('personal')
  const [priority,   setPriority]   = useState('medium')
  const [dueDate,    setDueDate]    = useState('')
  const [dueTime,    setDueTime]    = useState('')
  const [important,  setImportant]  = useState(false)
  const [recurrence, setRecurrence] = useState('none')
  const [showCal,    setShowCal]    = useState(false)
  const [showTemp,   setShowTemp]   = useState(false)

  // Custom templates
  const { custom, addTemplate, deleteTemplate, editTemplate } = useCustomTemplates()
  const [newCustom,   setNewCustom]   = useState('')
  const [editingTemp, setEditingTemp] = useState(null) // { tag, title, value }

  const reset = () => {
    setTitle(''); setNotes(''); setTag('personal'); setPriority('medium')
    setDueDate(''); setDueTime(''); setImportant(false)
    setRecurrence('none'); setShowCal(false); setShowTemp(false)
    setNewCustom(''); setEditingTemp(null)
  }
  const handleClose = () => { reset(); onClose() }
  const handleAdd   = () => {
    if (!title.trim()) return
    onAdd({
      title: title.trim(), notes, tag, priority,
      dueDate, dueTime, important, recurrence,
      utcOffsetMinutes: getUtcOffset(),
    })
    reset(); onClose()
  }

  const handleAddCustom = () => {
    addTemplate(tag, newCustom)
    setNewCustom('')
  }

  if (!isOpen) return null

  const builtIn = TASK_TEMPLATES[tag] || []
  const userDefined = custom[tag] || []

  return (
    <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"/>
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">New task</h2>
          <button onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15"/>
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="mb-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') handleClose() }}
            autoFocus placeholder="What needs to be done?"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"/>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Add notes (optional)" rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 resize-none"/>
        </div>

        {/* Templates — built-in + custom */}
        <div className="mb-4">
          <button onClick={() => setShowTemp(!showTemp)}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mb-2 transition-colors">
            <span>{showTemp ? '▲' : '▼'}</span> Quick templates
          </button>

          {showTemp && (
            <div>
              {/* Built-in templates */}
              {builtIn.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 dark:text-gray-600 mb-1.5">Built-in</p>
                  <div className="flex flex-wrap gap-1.5">
                    {builtIn.map(t => (
                      <button key={t} onClick={() => { setTitle(t); setShowTemp(false) }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom templates */}
              {(userDefined.length > 0 || true) && (
                <div className="mb-2">
                  <p className="text-xs text-gray-400 dark:text-gray-600 mb-1.5">Your templates</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {userDefined.map(t => (
                      <div key={t} className="group relative">
                        {editingTemp?.title === t && editingTemp?.tag === tag ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              value={editingTemp.value}
                              onChange={e => setEditingTemp({ ...editingTemp, value: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') { editTemplate(tag, t, editingTemp.value); setEditingTemp(null) }
                                if (e.key === 'Escape') setEditingTemp(null)
                              }}
                              className="text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-28 focus:outline-none"
                            />
                            <button onClick={() => { editTemplate(tag, t, editingTemp.value); setEditingTemp(null) }}
                              className="text-xs text-green-500 hover:text-green-700 font-medium">✓</button>
                            <button onClick={() => setEditingTemp(null)}
                              className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => { setTitle(t); setShowTemp(false) }}
                              className="text-xs px-2.5 py-1 rounded-l-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border border-r-0 border-purple-200 dark:border-purple-800/40">
                              {t}
                            </button>
                            {/* Edit button */}
                            <button
                              onClick={() => setEditingTemp({ tag, title: t, value: t })}
                              className="text-xs px-1.5 py-1 bg-purple-50 dark:bg-purple-950/30 text-purple-400 hover:text-purple-700 dark:hover:text-purple-200 border-y border-purple-200 dark:border-purple-800/40 transition-colors"
                              title="Edit">
                              ✎
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => deleteTemplate(tag, t)}
                              className="text-xs px-1.5 py-1 rounded-r-lg bg-purple-50 dark:bg-purple-950/30 text-purple-300 hover:text-red-500 dark:hover:text-red-400 border border-l-0 border-purple-200 dark:border-purple-800/40 transition-colors"
                              title="Delete">
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add new custom template */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCustom}
                      onChange={e => setNewCustom(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddCustom() }}
                      placeholder="Add custom template..."
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-transparent text-gray-600 dark:text-gray-400 placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
                    />
                    <button onClick={handleAddCustom} disabled={!newCustom.trim()}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors font-medium">
                      + Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
                  dueDate === val ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
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
                className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all border border-gray-200 dark:border-gray-600">✕</button>
            )}
          </div>
          {showCal && (
            <input type="date" value={dueDate} min={todayStr()}
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

        {/* Time */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Time (optional)</label>
            <button onClick={() => setDueTime(dueTime ? '' : currentTimeStr())}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                dueTime ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
              {dueTime ? `Set: ${dueTime}` : 'Add time'}
            </button>
          </div>
          {dueTime !== '' && (
            <div className="flex justify-center py-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
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
                  recurrence === opt.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}>
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
              {important && <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <p className={`text-sm font-medium ${important ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'}`}>★ Mark as important</p>
          </button>
        </div>

        <button onClick={handleAdd} disabled={!title.trim()}
          className="w-full py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all active:scale-95">
          Add task
        </button>
      </div>
    </div>
  )
}
