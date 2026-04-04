// useTasks.js — v5: added subtask operations

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

export const RECURRENCE_OPTIONS = [
  { id: 'none',    label: 'No repeat' },
  { id: 'daily',   label: 'Daily' },
  { id: 'weekly',  label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
]

export function useTasks(user) {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    tasksApi.getAll()
      .then(data => setTasks(data.tasks))
      .catch(err  => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  const addTask = useCallback(async (taskData) => {
    const tempId   = `temp-${Date.now()}`
    const tempTask = { id: tempId, subtasks: [], recurrence: 'none', ...taskData, done: false, createdAt: new Date().toISOString() }
    setTasks(prev => [tempTask, ...prev])
    try {
      const data = await tasksApi.create(taskData)
      setTasks(prev => prev.map(t => t.id === tempId ? data.task : t))
    } catch (err) {
      setTasks(prev => prev.filter(t => t.id !== tempId))
      setError(err.message)
    }
  }, [])

  const editTask = useCallback(async (id, fields) => {
    const prev = tasks
    setTasks(p => p.map(t => t.id === id ? { ...t, ...fields } : t))
    try {
      const data = await tasksApi.update(id, fields)
      // Use server response to get accurate subtasks + recurrence state
      if (data?.task) {
        setTasks(p => p.map(t => t.id === id ? data.task : t))
      }
    } catch (err) {
      setTasks(prev)
      setError(err.message)
    }
  }, [tasks])

  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newDone = !task.done
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t))
    try {
      const data = await tasksApi.update(id, { done: newDone })
      // If recurrence, a new task was created — refresh all tasks
      if (data?.task && task.recurrence !== 'none' && newDone) {
        const fresh = await tasksApi.getAll()
        setTasks(fresh.tasks)
      } else if (data?.task) {
        setTasks(prev => prev.map(t => t.id === id ? data.task : t))
      }
    } catch (err) {
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

  // ── Subtask operations ──────────────────────────────────────────────────
  const addSubtask = useCallback(async (taskId, title) => {
    try {
      const data = await tasksApi.addSubtask(taskId, title)
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), data.subtask] } : t
      ))
    } catch (err) { setError(err.message) }
  }, [])

  const toggleSubtask = useCallback(async (taskId, subtaskId) => {
    const task    = tasks.find(t => t.id === taskId)
    const subtask = task?.subtasks?.find(s => s.id === subtaskId)
    if (!subtask) return

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s) }
        : t
    ))

    try {
      const data = await tasksApi.updateSubtask(taskId, subtaskId, { done: !subtask.done })
      // Server may have auto-completed the parent task
      if (data?.task) {
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t))
      }
    } catch (err) {
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, done: subtask.done } : s) }
          : t
      ))
      setError(err.message)
    }
  }, [tasks])

  const deleteSubtask = useCallback(async (taskId, subtaskId) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, subtasks: (t.subtasks || []).filter(s => s.id !== subtaskId) } : t
    ))
    try {
      await tasksApi.deleteSubtask(taskId, subtaskId)
    } catch (err) { setError(err.message) }
  }, [])

  return {
    tasks, loading, error,
    addTask, editTask, toggleTask, toggleImportant, deleteTask, clearCompleted,
    addSubtask, toggleSubtask, deleteSubtask,
  }
}
