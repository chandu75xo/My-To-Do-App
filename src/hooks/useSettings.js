import { useState } from 'react'

const SETTINGS_KEY = 'done-settings'

const DEFAULT_SETTINGS = {
  timeFormat:    '12h',
  alarmSound:    'gentle',
  vibration:     true,
  snoozeMinutes: 5,       // 5 | 10 | 15 | 30 | 60
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

export function formatTime(timeStr, format = '12h') {
  if (!timeStr) return ''
  const [hourStr, minuteStr] = timeStr.split(':')
  const hour   = parseInt(hourStr, 10)
  const minute = minuteStr || '00'
  if (format === '24h') return `${String(hour).padStart(2, '0')}:${minute}`
  const ampm   = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minute} ${ampm}`
}

export function formatDueDateTime(dateStr, timeStr, format = '12h') {
  if (!dateStr && !timeStr) return null
  const today    = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  let dateLabel  = ''
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
