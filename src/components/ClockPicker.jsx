// ClockPicker.jsx
//
// A custom analog clock time picker.
// Replaces the plain <input type="time"> in TaskForm.
//
// How it works:
//   - Draws an SVG clock face
//   - User clicks/drags on the clock to set hours, then minutes
//   - AM / PM buttons on the right side
//   - Two-step interaction: first tap sets hour, second tap sets minute
//   - Calls onChange(timeString) with "HH:MM" in 24h format for the backend

import { useState, useRef, useCallback } from 'react'

const CLOCK_R   = 90   // radius of clock face
const CX        = 100  // centre x
const CY        = 100  // centre y
const NUM_R     = 75   // radius where numbers sit
const HAND_R    = 65   // length of the clock hand

// Position a number on the clock face given an index (0-11 for hours, 0-11 for 5-min intervals)
const polarToXY = (index, total, radius) => {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  }
}

// Get the clock value from a click position on the SVG
const xyToValue = (clientX, clientY, svgEl, total) => {
  const rect  = svgEl.getBoundingClientRect()
  const x     = clientX - rect.left - (rect.width  / 2)
  const y     = clientY - rect.top  - (rect.height / 2)
  let angle   = Math.atan2(y, x) + Math.PI / 2
  if (angle < 0) angle += 2 * Math.PI
  const raw   = Math.round((angle / (2 * Math.PI)) * total)
  return raw % total
}

export default function ClockPicker({ value, onChange }) {
  // Parse the incoming "HH:MM" value
  const parseTime = (v) => {
    if (!v) return { h: 12, m: 0, ampm: 'AM' }
    const [hh, mm] = v.split(':').map(Number)
    const ampm = hh < 12 ? 'AM' : 'PM'
    const h    = hh % 12 || 12
    return { h, m: mm, ampm }
  }

  const { h: initH, m: initM, ampm: initAMPM } = parseTime(value)
  const [hour,    setHour]    = useState(initH)
  const [minute,  setMinute]  = useState(initM)
  const [ampm,    setAmpm]    = useState(initAMPM)
  const [step,    setStep]    = useState('hour')   // 'hour' or 'minute'
  const svgRef = useRef(null)

  // Emit "HH:MM" in 24h format whenever time changes
  const emit = useCallback((h, m, ap) => {
    let hh = h % 12
    if (ap === 'PM') hh += 12
    onChange(`${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }, [onChange])

  const handleClockClick = (e) => {
    if (!svgRef.current) return
    if (step === 'hour') {
      const raw = xyToValue(e.clientX, e.clientY, svgRef.current, 12)
      const h   = raw === 0 ? 12 : raw
      setHour(h)
      setStep('minute')
      emit(h, minute, ampm)
    } else {
      const m = xyToValue(e.clientX, e.clientY, svgRef.current, 60)
      const snapped = Math.round(m / 5) * 5 % 60
      setMinute(snapped)
      emit(hour, snapped, ampm)
    }
  }

  const handleAmpm = (val) => {
    setAmpm(val)
    emit(hour, minute, val)
  }

  // Hand angle
  const handAngle = step === 'hour'
    ? ((hour % 12) / 12) * 360 - 90
    : (minute / 60) * 360 - 90

  const handX = CX + HAND_R * Math.cos((handAngle * Math.PI) / 180)
  const handY = CY + HAND_R * Math.sin((handAngle * Math.PI) / 180)

  // Hour numbers 1–12
  const hourNums = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1
    const pos = polarToXY(i + 1, 12, NUM_R)
    return { num, ...pos }
  })

  // Minute marks — only show 5-min labels (00,05,10...55)
  const minuteNums = Array.from({ length: 12 }, (_, i) => {
    const num = i * 5
    const pos = polarToXY(i, 12, NUM_R)
    return { num, ...pos }
  })

  const displayH = String(hour).padStart(2, '0')
  const displayM = String(minute).padStart(2, '0')

  return (
    <div className="flex items-center gap-3">

      {/* ── Clock face ── */}
      <div className="flex flex-col items-center gap-2">

        {/* Digital readout + step indicator */}
        <div className="flex items-center gap-1 text-sm font-mono font-medium">
          <button onClick={() => setStep('hour')}
            className={`px-1.5 py-0.5 rounded-lg transition-all ${
              step === 'hour'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {displayH}
          </button>
          <span className="text-gray-400">:</span>
          <button onClick={() => setStep('minute')}
            className={`px-1.5 py-0.5 rounded-lg transition-all ${
              step === 'minute'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {displayM}
          </button>
        </div>

        {/* SVG clock */}
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          width="180"
          height="180"
          onClick={handleClockClick}
          className="cursor-pointer select-none"
        >
          {/* Clock face background */}
          <circle cx={CX} cy={CY} r={CLOCK_R}
            className="fill-gray-50 dark:fill-gray-700"
            stroke="currentColor"
            strokeWidth="0.5"
            style={{ color: 'var(--color-border-secondary)' }}
          />

          {/* Tick marks */}
          {Array.from({ length: 60 }, (_, i) => {
            const angle  = (i / 60) * 2 * Math.PI - Math.PI / 2
            const isMaj  = i % 5 === 0
            const r1     = CLOCK_R - (isMaj ? 10 : 5)
            const r2     = CLOCK_R - 2
            return (
              <line key={i}
                x1={CX + r1 * Math.cos(angle)} y1={CY + r1 * Math.sin(angle)}
                x2={CX + r2 * Math.cos(angle)} y2={CY + r2 * Math.sin(angle)}
                stroke="currentColor" strokeWidth={isMaj ? 1 : 0.5}
                style={{ color: 'var(--color-border-secondary)' }}
              />
            )
          })}

          {/* Hour / minute numbers */}
          {(step === 'hour' ? hourNums : minuteNums).map(({ num, x, y }) => {
            const active = step === 'hour' ? num === hour : num === minute
            return (
              <g key={num}>
                {active && <circle cx={x} cy={y} r="13"
                  className="fill-gray-900 dark:fill-white"/>}
                <text x={x} y={y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="11" fontWeight={active ? '600' : '400'}
                  fill={active
                    ? 'var(--color-background-primary)'
                    : 'var(--color-text-secondary)'}
                >
                  {step === 'minute' ? String(num).padStart(2,'0') : num}
                </text>
              </g>
            )
          })}

          {/* Clock hand */}
          <line
            x1={CX} y1={CY}
            x2={handX} y2={handY}
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ color: 'var(--color-text-primary)' }}
          />

          {/* Centre dot */}
          <circle cx={CX} cy={CY} r="3"
            className="fill-gray-900 dark:fill-white"/>

          {/* Hand tip dot */}
          <circle cx={handX} cy={handY} r="4"
            className="fill-gray-900 dark:fill-white"/>
        </svg>

        {/* Step hint */}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {step === 'hour' ? 'Tap to set hour' : 'Tap to set minute'}
        </p>
      </div>

      {/* ── AM / PM buttons ── */}
      <div className="flex flex-col gap-2">
        {['AM', 'PM'].map(val => (
          <button
            key={val}
            type="button"
            onClick={() => handleAmpm(val)}
            className={`
              w-12 py-3 rounded-xl text-sm font-semibold transition-all
              ${ampm === val
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {val}
          </button>
        ))}

        {/* Clear time button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="w-12 py-2 rounded-xl text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all border border-gray-200 dark:border-gray-600 mt-1"
          >
            clear
          </button>
        )}
      </div>
    </div>
  )
}
