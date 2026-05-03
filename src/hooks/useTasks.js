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
  const [tasks,        setTasks]        = useState([])
  const [archivedTasks, setArchivedTasks] = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  // Stable fetch — always gets latest from server
  const fetchAll = useCallback(async () => {
    const [activeData, archivedData] = await Promise.all([
      tasksApi.getAll(),
      tasksApi.getArchived(),
    ])
    setTasks(activeData.tasks)
    setArchivedTasks(archivedData.tasks)
  }, [])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchAll()
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, fetchAll])

  const addTask = useCallback(async (taskData) => {
    // Optimistic: show task immediately
    const tempId   = `temp-${Date.now()}`
    const tempTask = {
      id: tempId, subtasks: [], recurrence: 'none',
      utcOffsetMinutes: -new Date().getTimezoneOffset(),
      ...taskData, done: false, createdAt: new Date().toISOString(),
    }
    setTasks(prev => [tempTask, ...prev])
    try {
      const data = await tasksApi.create(taskData)
      // Replace temp with server's real task (has real id, all fields)
      setTasks(prev => prev.map(t => t.id === tempId ? data.task : t))
    } catch (err) {
      console.error('[Tasks] addTask failed:', err.message)
      setError(err.message)
      // Remove temp and refetch — keeps UI accurate
      setTasks(prev => prev.filter(t => t.id !== tempId))
      try { await fetchAll() } catch {}
    }
  }, [fetchAll])

  const editTask = useCallback(async (id, fields) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t))
    try {
      const data = await tasksApi.update(id, fields)
      if (data?.task) setTasks(prev => prev.map(t => t.id === id ? data.task : t))
    } catch (err) {
      setError(err.message)
      try { await fetchAll() } catch {}
    }
  }, [fetchAll])

  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newDone = !task.done
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t))
    try {
      const data = await tasksApi.update(id, { done: newDone })
      if (data?.task && task.recurrence !== 'none' && newDone) {
        await fetchAll()
      } else if (data?.task) {
        setTasks(prev => prev.map(t => t.id === id ? data.task : t))
      }
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: task.done } : t))
      setError(err.message)
    }
  }, [tasks, fetchAll])

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
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await tasksApi.delete(id)
    } catch (err) {
      setError(err.message)
      try { await fetchAll() } catch {}
    }
  }, [fetchAll])

  const clearCompleted = useCallback(async () => {
    setTasks(prev => prev.filter(t => !t.done))
    try {
      await tasksApi.clearCompleted()
    } catch (err) {
      setError(err.message)
      try { await fetchAll() } catch {}
    }
  }, [fetchAll])

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
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s) }
        : t
    ))
    try {
      const data = await tasksApi.updateSubtask(taskId, subtaskId, { done: !subtask.done })
      if (data?.task) setTasks(prev => prev.map(t => t.id === taskId ? data.task : t))
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
    tasks, archivedTasks, allTasks: [...tasks, ...archivedTasks],
    loading, error, fetchAll,
    addTask, editTask, toggleTask, toggleImportant, deleteTask, clearCompleted,
    addSubtask, toggleSubtask, deleteSubtask,
  }
}
