// useDueAlarm.js — FIXED
// Fix 1: Check runs every 5s (was 15s) for near-instant firing
// Fix 2: When tasks change, immediately run a check (no waiting for next interval)
// Fix 3: firedRef key uses task.id + dueTime so editing time resets the fired state
// Fix 4: stopAlarm called correctly through the fixed useAlarm hook

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAlarm } from './useAlarm'

const ALARM_DURATION = 15

export function useDueAlarm(tasks, settings) {
  const { playAlarm, stopAlarm } = useAlarm()

  const [alarmTask,  setAlarmTask]  = useState(null)
  const dismissedRef  = useRef(new Set())   // Set of "taskId-dueTime" — dismissed combos
  const firedRef      = useRef(new Set())   // Set of "taskId-dueTime-HHMM" — already fired
  const snoozedRef    = useRef(new Map())   // Map of "taskId-dueTime" → snoozeUntil Date
  const autoStopTimer = useRef(null)

  const stopCurrentAlarm = useCallback(() => {
    stopAlarm()
    if (autoStopTimer.current) {
      clearTimeout(autoStopTimer.current)
      autoStopTimer.current = null
    }
  }, [stopAlarm])

  const fireAlarm = useCallback((task) => {
    stopCurrentAlarm()
    setAlarmTask(task)
    playAlarm(settings.alarmSound || 'gentle', ALARM_DURATION)
    if (settings.vibration && 'vibrate' in navigator) {
      navigator.vibrate([400, 200, 400, 200, 400])
    }
    // Auto-stop sound after 15s — modal stays open
    autoStopTimer.current = setTimeout(() => {
      stopAlarm()
      if ('vibrate' in navigator) navigator.vibrate(0)
    }, ALARM_DURATION * 1000)
  }, [playAlarm, stopAlarm, stopCurrentAlarm, settings])

  const handleDismiss = useCallback(() => {
    stopCurrentAlarm()
    if (alarmTask) {
      // Dismiss keyed on taskId+dueTime so editing the time allows re-fire
      dismissedRef.current.add(`${alarmTask.id}-${alarmTask.dueTime}`)
    }
    setAlarmTask(null)
  }, [stopCurrentAlarm, alarmTask])

  const handleSnooze = useCallback(() => {
    stopCurrentAlarm()
    if (alarmTask) {
      const snoozeMs    = (settings.snoozeMinutes || 5) * 60 * 1000
      const snoozeUntil = new Date(Date.now() + snoozeMs)
      snoozedRef.current.set(`${alarmTask.id}-${alarmTask.dueTime}`, snoozeUntil)
    }
    setAlarmTask(null)
  }, [stopCurrentAlarm, alarmTask, settings.snoozeMinutes])

  // The main check function — extracted so we can call it immediately
  const runCheck = useCallback(() => {
    const now   = new Date()
    const hhmm  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const today = now.toISOString().split('T')[0]

    for (const task of tasks) {
      if (task.done || !task.dueTime) continue

      const taskKey    = `${task.id}-${task.dueTime}`
      const fireKey    = `${taskKey}-${today}-${hhmm}`
      const snoozeUntil = snoozedRef.current.get(taskKey)

      // Still in snooze window — skip
      if (snoozeUntil && now < snoozeUntil) continue

      // Snooze expired — clear it and allow re-fire
      if (snoozeUntil && now >= snoozeUntil) {
        snoozedRef.current.delete(taskKey)
        // Remove the fired key so it can ring again
        firedRef.current.delete(fireKey)
      }

      // Dismissed — skip
      if (dismissedRef.current.has(taskKey)) continue

      // Not due right now — skip
      if (task.dueTime !== hhmm) continue

      // Already fired this minute — skip
      if (firedRef.current.has(fireKey)) continue

      firedRef.current.add(fireKey)
      fireAlarm(task)
      break // only one alarm at a time
    }

    // Clean up old keys
    if (firedRef.current.size > 500) {
      firedRef.current = new Set([...firedRef.current].slice(-200))
    }
  }, [tasks, fireAlarm])

  // Run check every 5s
  useEffect(() => {
    runCheck() // run immediately when tasks or settings change
    const interval = setInterval(runCheck, 5000)
    return () => clearInterval(interval)
  }, [runCheck])

  return { alarmTask, handleDismiss, handleSnooze }
}
