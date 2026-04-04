// useDueAlarm.js — v5
// KEY FIX: Uses a Web Worker for the tick timer.
// Web Workers run on a separate thread and are never throttled by
// Chrome/Edge/Firefox's background tab battery-saving policy.
// This means alarms fire accurately even when the tab is in the background.
//
// ADDITIONAL FIX: visibilitychange listener — when the user switches back
// to the tab, we immediately run a check to catch any alarms that were
// missed while the tab was hidden.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAlarm } from './useAlarm'

const ALARM_DURATION = 15

export function useDueAlarm(tasks, settings) {
  const { playAlarm, stopAlarm } = useAlarm()

  const [alarmTask,   setAlarmTask]   = useState(null)
  const dismissedRef  = useRef(new Set())
  const firedRef      = useRef(new Set())
  const snoozedRef    = useRef(new Map())
  const autoStopTimer = useRef(null)
  const workerRef     = useRef(null)

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
    autoStopTimer.current = setTimeout(() => {
      stopAlarm()
      if ('vibrate' in navigator) navigator.vibrate(0)
    }, ALARM_DURATION * 1000)
  }, [playAlarm, stopAlarm, stopCurrentAlarm, settings])

  const handleDismiss = useCallback(() => {
    stopCurrentAlarm()
    if (alarmTask) dismissedRef.current.add(`${alarmTask.id}-${alarmTask.dueTime}`)
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

  // Core check — runs on every tick from the Web Worker
  const runCheck = useCallback(() => {
    const now   = new Date()
    const hhmm  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const today = now.toISOString().split('T')[0]

    for (const task of tasks) {
      if (task.done || !task.dueTime) continue

      const taskKey     = `${task.id}-${task.dueTime}`
      const fireKey     = `${taskKey}-${today}-${hhmm}`
      const snoozeUntil = snoozedRef.current.get(taskKey)

      if (snoozeUntil) {
        if (now < snoozeUntil) continue
        snoozedRef.current.delete(taskKey)
        firedRef.current.delete(fireKey)
      }

      if (dismissedRef.current.has(taskKey)) continue
      if (task.dueTime !== hhmm) continue
      if (firedRef.current.has(fireKey)) continue

      firedRef.current.add(fireKey)
      fireAlarm(task)
      break
    }

    if (firedRef.current.size > 500) {
      firedRef.current = new Set([...firedRef.current].slice(-200))
    }
  }, [tasks, fireAlarm])

  // Start Web Worker — runs independently of tab visibility
  useEffect(() => {
    try {
      workerRef.current = new Worker('/alarm-worker.js')
      workerRef.current.onmessage = () => runCheck()
      workerRef.current.postMessage('start')
    } catch (err) {
      // Fallback to setInterval if Worker fails (e.g. some private browsing modes)
      console.warn('[Alarm] Web Worker unavailable, falling back to setInterval')
      const id = setInterval(runCheck, 5000)
      workerRef.current = { fallback: id }
    }

    return () => {
      if (workerRef.current?.fallback) {
        clearInterval(workerRef.current.fallback)
      } else {
        workerRef.current?.postMessage('stop')
        workerRef.current?.terminate()
      }
    }
  }, [runCheck])

  // visibilitychange — fire any missed alarms the moment user switches back
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') runCheck()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [runCheck])

  return { alarmTask, handleDismiss, handleSnooze }
}
