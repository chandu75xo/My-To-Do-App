// hooks/useSettings.js
// Manages user preferences saved in localStorage.
// Currently: timeFormat ('12h' | '24h')
// Easily extendable for future settings (theme, language, etc.)

import { useState } from 'react'

const SETTINGS_KEY = 'done-settings'

const DEFAULT_SETTINGS = {
  timeFormat: '12h',  // '12h' or '24h'
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const updateSetting = (key, value) => {
    const updated = { ...settings, [key]: value }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
    setSettings(updated)
  }

  return { settings, updateSetting }
}

// ── Time formatting helper ────────────────────────────────────────────────────
// Used everywhere a due time is displayed (TaskCard, TaskList, etc.)
// Input:  "14:30" (always stored as 24h in DB)
// Output: "2:30 PM" (12h) or "14:30" (24h)

export function formatTime(timeStr, format = '12h') {
  if (!timeStr) return ''

  const [hourStr, minuteStr] = timeStr.split(':')
  const hour   = parseInt(hourStr, 10)
  const minute = minuteStr || '00'

  if (format === '24h') {
    return `${String(hour).padStart(2, '0')}:${minute}`
  }

  // 12h format
  const ampm      = hour >= 12 ? 'PM' : 'AM'
  const hour12    = hour % 12 || 12  // convert 0 → 12, 13 → 1, etc.
  return `${hour12}:${minute} ${ampm}`
}

// Format a full date + time label for task cards
// e.g. "Today at 2:30 PM" or "Tomorrow at 14:30"
export function formatDueDateTime(dateStr, timeStr, format = '12h') {
  if (!dateStr && !timeStr) return null

  const today    = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  let dateLabel = ''
  if (dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    if (d.getTime() === today.getTime())         dateLabel = 'Today'
    else if (d.getTime() === tomorrow.getTime()) dateLabel = 'Tomorrow'
    else dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const timeLabel = timeStr ? formatTime(timeStr, format) : ''

  if (dateLabel && timeLabel) return `${dateLabel} at ${timeLabel}`
  if (dateLabel)              return dateLabel
  return timeLabel
}
