// hooks/useTasks.js — UPDATED for v2
//
// All task operations now go through the Flask API.
// localStorage is no longer the source of truth — the database is.
// We keep a local `tasks` state as a cache so the UI stays fast.
//
// Pattern used: Optimistic updates.
// Instead of waiting for the server to confirm before updating the UI,
// we update the UI instantly, then send the request to Flask.
// If Flask returns an error, we revert the UI change.
// This makes the app feel instant even on slow connections.

import { useState, useEffect, useCallback } from 'react'
import { tasksApi } from '../services/api'

export const TASK_TEMPLATES = {
  work:     ['Daily standup', 'Send weekly report', 'Review pull requests', 'Client follow-up', 'Update documentation', 'Team meeting prep'],
  home:     ['Clean kitchen', 'Do laundry', 'Water the plants', 'Take out trash', 'Vacuum floors', 'Grocery run'],
  health:   ['Morning workout', 'Take vitamins', 'Meditate 10 mins', 'Drink 8 glasses of water', 'Evening walk', 'Stretch routine'],
  shopping: ['Weekly groceries', 'Buy toiletries', 'Restock snacks', 'Office supplies', 'Pick up prescription'],
  personal: ['Read for 30 mins', 'Call family', 'Journal entry', 'Learn something new', 'Plan the week'],
}

export const TAGS = [
  { id: 'work',     label: 'Work',     emoji: '💼' },
  { id: 'home',     label: 'Home',     emoji: '🏠' },
  { id: 'health',   label: 'Health',   emoji: '💪' },
  { id: 'shopping', label: 'Shopping', emoji: '🛒' },
  { id: 'personal', label: 'Personal', emoji: '🧘' },
]

export const PRIORITIES = [
  { id: 'high',   label: 'High',   color: 'text-red-500' },
  { id: 'medium', label: 'Medium', color: 'text-amber-500' },
  { id: 'low',    label: 'Low',    color: 'text-gray-400' },
]

export function useTasks(user) {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Fetch tasks from Flask when the user is available
  useEffect(() => {
    if (!user) return
    setLoading(true)
    tasksApi.getAll()
      .then(data => setTasks(data.tasks))
      .catch(err => setError(err.message))
      .finally(()  => setLoading(false))
  }, [user])

  const addTask = useCallback(async (taskData) => {
    // Optimistic: add a temporary task immediately so UI feels instant
    const tempId   = `temp-${Date.now()}`
    const tempTask = { id: tempId, ...taskData, done: false, createdAt: new Date().toISOString() }
    setTasks(prev => [tempTask, ...prev])

    try {
      const data = await tasksApi.create(taskData)
      // Replace the temp task with the real one from the server (which has a real id)
      setTasks(prev => prev.map(t => t.id === tempId ? data.task : t))
    } catch (err) {
      // Revert on error
      setTasks(prev => prev.filter(t => t.id !== tempId))
      setError(err.message)
    }
  }, [])

  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    // Optimistic flip
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    try {
      await tasksApi.update(id, { done: !task.done })
    } catch (err) {
      // Revert
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: task.done } : t))
      setError(err.message)
    }
  }, [tasks])

  const toggleImportant = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    setTasks(prev => prev.map(t => t.id === id ? { ...t, important: !t.important } : t))
    try {
      await tasksApi.update(id, { important: !task.important })
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, important: task.important } : t))
      setError(err.message)
    }
  }, [tasks])

  const deleteTask = useCallback(async (id) => {
    const prev = tasks
    setTasks(p => p.filter(t => t.id !== id))
    try {
      await tasksApi.delete(id)
    } catch (err) {
      setTasks(prev)
      setError(err.message)
    }
  }, [tasks])

  const clearCompleted = useCallback(async () => {
    const prev = tasks
    setTasks(p => p.filter(t => !t.done))
    try {
      await tasksApi.clearCompleted()
    } catch (err) {
      setTasks(prev)
      setError(err.message)
    }
  }, [tasks])

  return { tasks, loading, error, addTask, toggleTask, toggleImportant, deleteTask, clearCompleted }
}

// Note: useTasks already passes all task fields including dueDate to the API.
// No changes needed here — dueDate flows through addTask/update naturally.
