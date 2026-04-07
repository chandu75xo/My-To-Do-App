import { useEffect, useRef, useState, useCallback } from 'react'
import { useAlarm } from './useAlarm'

const ALARM_DURATION = 15

export function useDueAlarm(tasks, settings) {
  const { playAlarm, stopAlarm } = useAlarm()

  const [alarmTask,   setAlarmTask]   = useState(null)
  const dismissedRef  = useRef(new Set())
  const firedRef      = useRef(new Set())
  // KEY FIX: snoozedRef stores { fireAt, task } — NOT keyed by dueTime
  // so snooze fires at the new time regardless of original due time
  const snoozedRef    = useRef(new Map())  // taskId → { fireAt: Date, task }
  const autoStopTimer = useRef(null)
  const workerRef     = useRef(null)
  const runCheckRef   = useRef(null)

  const stopCurrentAlarm = useCallback(() => {
    stopAlarm()
    if (autoStopTimer.current) { clearTimeout(autoStopTimer.current); autoStopTimer.current = null }
  }, [stopAlarm])

  const fireAlarm = useCallback((task) => {
    stopCurrentAlarm()
    setAlarmTask(task)
    playAlarm(settings.alarmSound || 'gentle', ALARM_DURATION)
    if (settings.vibration && 'vibrate' in navigator) navigator.vibrate([400, 200, 400, 200, 400])
    autoStopTimer.current = setTimeout(() => {
      stopAlarm()
      if ('vibrate' in navigator) navigator.vibrate(0)
    }, ALARM_DURATION * 1000)
  }, [playAlarm, stopAlarm, stopCurrentAlarm, settings])

  const handleDismiss = useCallback(() => {
    stopCurrentAlarm()
    if (alarmTask) {
      dismissedRef.current.add(`${alarmTask.id}-${alarmTask.dueTime}`)
      snoozedRef.current.delete(alarmTask.id)
    }
    setAlarmTask(null)
  }, [stopCurrentAlarm, alarmTask])

  const handleSnooze = useCallback(() => {
    stopCurrentAlarm()
    if (alarmTask) {
      const fireAt = new Date(Date.now() + (settings.snoozeMinutes || 5) * 60 * 1000)
      snoozedRef.current.set(alarmTask.id, { fireAt, task: alarmTask })
    }
    setAlarmTask(null)
  }, [stopCurrentAlarm, alarmTask, settings.snoozeMinutes])

  const runCheck = useCallback(() => {
    const now   = new Date()
    const hhmm  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const today = now.toISOString().split('T')[0]

    // CHECK 1: snoozed tasks whose countdown has expired
    for (const [taskId, { fireAt, task }] of snoozedRef.current.entries()) {
      if (now >= fireAt) {
        snoozedRef.current.delete(taskId)
        if (!task.done && !dismissedRef.current.has(`${taskId}-${task.dueTime}`)) {
          fireAlarm(task)
          return
        }
      }
    }

    // CHECK 2: tasks due at current HH:MM
    for (const task of tasks) {
      if (task.done || !task.dueTime) continue
      if (dismissedRef.current.has(`${task.id}-${task.dueTime}`)) continue
      if (snoozedRef.current.has(task.id)) continue
      if (task.dueTime !== hhmm) continue

      const fireKey = `${task.id}-${task.dueTime}-${today}-${hhmm}`
      if (firedRef.current.has(fireKey)) continue

      firedRef.current.add(fireKey)
      fireAlarm(task)
      return
    }

    if (firedRef.current.size > 500) {
      firedRef.current = new Set([...firedRef.current].slice(-200))
    }
  }, [tasks, fireAlarm])

  useEffect(() => { runCheckRef.current = runCheck }, [runCheck])

  useEffect(() => {
    try {
      const worker = new Worker('/alarm-worker.js')
      worker.onmessage = () => { runCheckRef.current?.() }
      worker.postMessage('start')
      workerRef.current = worker
    } catch {
      const id = setInterval(() => { runCheckRef.current?.() }, 5000)
      workerRef.current = { fallbackId: id }
    }
    return () => {
      const w = workerRef.current
      if (w?.fallbackId) clearInterval(w.fallbackId)
      else { w?.postMessage('stop'); w?.terminate() }
    }
  }, [])

  useEffect(() => {
    const fn = () => { if (document.visibilityState === 'visible') runCheckRef.current?.() }
    document.addEventListener('visibilitychange', fn)
    return () => document.removeEventListener('visibilitychange', fn)
  }, [])

  return { alarmTask, handleDismiss, handleSnooze }
}
