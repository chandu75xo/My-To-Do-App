// useAlarm.js — FIXED
// Key fix: tracks every oscillator node in activeNodesRef
// so stopAlarm() calls .stop() on each one immediately.
// ctx.suspend() was wrong — it doesn't cancel already-scheduled nodes.

import { useRef, useCallback } from 'react'

let audioCtx = null
const getCtx = () => {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

// Shared ref to track all active oscillator nodes across the app
const activeNodes = []

function scheduleOsc(ctx, type, freq, startTime, stopTime, volume = 0.2) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.setValueAtTime(0, stopTime - 0.01)
  osc.start(startTime)
  osc.stop(stopTime)
  // Track for immediate cancellation
  activeNodes.push(osc)
  osc.onended = () => {
    const i = activeNodes.indexOf(osc)
    if (i > -1) activeNodes.splice(i, 1)
  }
}

function playGentle(ctx, duration) {
  [0, 1.5, 3, 4.5, 6, 7.5, 9].forEach(t => {
    if (t >= duration) return
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime + t)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + t + 1.0)
    gain.gain.setValueAtTime(0, ctx.currentTime + t)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + t + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 1.2)
    osc.start(ctx.currentTime + t)
    osc.stop(ctx.currentTime + t + 1.3)
    activeNodes.push(osc)
    osc.onended = () => { const i = activeNodes.indexOf(osc); if (i > -1) activeNodes.splice(i, 1) }
  })
}

function playBeep(ctx, duration) {
  [0, 0.35, 1.2, 1.55, 2.4, 2.75, 3.6, 3.95, 5, 5.35, 6.5, 6.85, 8, 8.35].forEach(t => {
    if (t >= duration) return
    scheduleOsc(ctx, 'square', 1000, ctx.currentTime + t, ctx.currentTime + t + 0.22, 0.15)
  })
}

function playBell(ctx, duration) {
  const strikeAt = (t) => {
    if (t >= duration) return
    [1, 2.756, 5.404, 8.933].forEach((h, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25 * h, ctx.currentTime + t)
      const vol = 0.25 / (i + 1)
      gain.gain.setValueAtTime(vol, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 2.5)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 2.6)
      activeNodes.push(osc)
      osc.onended = () => { const i2 = activeNodes.indexOf(osc); if (i2 > -1) activeNodes.splice(i2, 1) }
    })
  }
  ;[0, 2.8, 5.6, 8.4].forEach(strikeAt)
}

function playUrgent(ctx, duration) {
  let t = 0
  while (t < duration) {
    ;[880, 660].forEach((freq, i) => {
      const at = t + i * 0.18
      if (at >= duration) return
      scheduleOsc(ctx, 'sawtooth', freq, ctx.currentTime + at, ctx.currentTime + at + 0.17, 0.2)
    })
    t += 0.5
  }
}

const SOUNDS = { gentle: playGentle, beep: playBeep, bell: playBell, urgent: playUrgent }

export function useAlarm() {
  const stopAlarm = useCallback(() => {
    // Stop every tracked oscillator immediately
    const toStop = [...activeNodes]
    toStop.forEach(osc => {
      try { osc.stop() } catch {}
    })
    activeNodes.length = 0
    if ('vibrate' in navigator) navigator.vibrate(0)
  }, [])

  const playAlarm = useCallback((soundId = 'gentle', durationSecs = 15) => {
    try {
      const ctx = getCtx()
      // Resume if suspended
      if (ctx.state === 'suspended') ctx.resume()
      const player = SOUNDS[soundId] || SOUNDS.gentle
      player(ctx, durationSecs)
    } catch (err) {
      console.error('[Alarm] Playback error:', err)
    }
  }, [])

  const previewAlarm = useCallback((soundId = 'gentle') => {
    stopAlarm()
    playAlarm(soundId, 2)
  }, [playAlarm, stopAlarm])

  return { playAlarm, stopAlarm, previewAlarm }
}

export const SOUND_OPTIONS = [
  { id: 'gentle', label: 'Gentle chime',  desc: 'Soft and pleasant',   emoji: '🔔' },
  { id: 'beep',   label: 'Digital beep',  desc: 'Classic double-beep', emoji: '📳' },
  { id: 'bell',   label: 'Soft bell',     desc: 'Rich bell resonance', emoji: '🛎️' },
  { id: 'urgent', label: 'Urgent alarm',  desc: 'Escalating two-tone', emoji: '🚨' },
]
