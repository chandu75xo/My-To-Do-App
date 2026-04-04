// useDueAlarm.js — v5 fix
// CRITICAL FIX: Web Worker closure bug.
// The worker sets onmessage ONCE. When tasks change, runCheck is recreated
// but the worker still calls the OLD stale version with no tasks.
// Fix: store latest runCheck in a ref, worker always calls ref.current().
//
// SNOOZE FIX: snoozedRef.get() was comparing wrong key format causing
// snooze to never expire and re-fire. Fixed key format consistency.

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

  // KEY FIX: always holds latest runCheck — worker calls this ref, not stale closure
  const runCheckRef = useRef(null)

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
      // Store with consistent key format
      const key = `${alarmTask.id}-${alarmTask.dueTime}`
      snoozedRef.current.set(key, snoozeUntil)
      // Remove from dismissed so it can re-fire after snooze
      dismissedRef.current.delete(key)
      // Remove from fired so it fires again
      const now   = new Date()
      const hhmm  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      const today = now.toISOString().split('T')[0]
      firedRef.current.delete(`${key}-${today}-${hhmm}`)
    }
    setAlarmTask(null)
  }, [stopCurrentAlarm, alarmTask, settings.snoozeMinutes])

  // runCheck — defined with latest tasks via useCallback
  const runCheck = useCallback(() => {
    const now   = new Date()
    const hhmm  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const today = now.toISOString().split('T')[0]

    for (const task of tasks) {
      if (task.done || !task.dueTime) continue

      const taskKey     = `${task.id}-${task.dueTime}`
      const fireKey     = `${taskKey}-${today}-${hhmm}`
      const snoozeUntil = snoozedRef.current.get(taskKey)

      // Still in snooze window
      if (snoozeUntil && now < snoozeUntil) continue

      // Snooze just expired — clear it so task can fire
      if (snoozeUntil && now >= snoozeUntil) {
        snoozedRef.current.delete(taskKey)
        // Clear fired key so it rings again right now
        firedRef.current.delete(fireKey)
      }

      if (dismissedRef.current.has(taskKey)) continue
      if (task.dueTime !== hhmm) continue
      if (firedRef.current.has(fireKey)) continue

      firedRef.current.add(fireKey)
      fireAlarm(task)
      break // only one alarm at a time
    }

    if (firedRef.current.size > 500) {
      firedRef.current = new Set([...firedRef.current].slice(-200))
    }
  }, [tasks, fireAlarm])

  // Update ref EVERY time runCheck changes — this is the closure fix
  useEffect(() => {
    runCheckRef.current = runCheck
  }, [runCheck])

  // Start Web Worker ONCE — it calls runCheckRef.current() so it always
  // uses the latest version of runCheck even as tasks update
  useEffect(() => {
    try {
      const worker = new Worker('/alarm-worker.js')
      worker.onmessage = () => {
        // Always call the LATEST runCheck via the ref
        if (runCheckRef.current) runCheckRef.current()
      }
      worker.postMessage('start')
      workerRef.current = worker
    } catch (err) {
      console.warn('[Alarm] Web Worker unavailable, using setInterval fallback')
      const id = setInterval(() => {
        if (runCheckRef.current) runCheckRef.current()
      }, 5000)
      workerRef.current = { fallbackId: id }
    }

    return () => {
      const w = workerRef.current
      if (w?.fallbackId) {
        clearInterval(w.fallbackId)
      } else if (w) {
        w.postMessage('stop')
        w.terminate()
      }
    }
  }, []) // empty deps — worker starts ONCE, uses ref for fresh runCheck

  // visibilitychange — catch missed alarms when tab regains focus
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && runCheckRef.current) {
        runCheckRef.current()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, []) // empty deps — stable event listener

  return { alarmTask, handleDismiss, handleSnooze }
}
