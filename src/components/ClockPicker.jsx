// ClockPicker.jsx — v5 complete rewrite
// - Defaults to current time when first opened
// - Free minute selection: every single minute 0-59 (not just 5-min steps)
// - Hour hand on inner ring, minute hand on outer ring
// - AM/PM toggle
// - Smooth drag interaction on both rings

import { useState, useRef, useCallback, useEffect } from 'react'

const SIZE   = 220
const CX     = SIZE / 2
const CY     = SIZE / 2
const R_HOUR = 65   // hour numbers radius
const R_MIN  = 88   // minute numbers radius (outer)

function polarToXY(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function xyToAngle(x, y) {
  const dx  = x - CX
  const dy  = y - CY
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
  if (angle < 0) angle += 360
  return angle
}

function pad(n) { return String(n).padStart(2, '0') }

// Show minute labels every 5 mins, dots for others
const MINUTE_LABELS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export default function ClockPicker({ value, onChange }) {
  // Parse initial value or default to current time
  const parseValue = (v) => {
    if (v) {
      const [h, m] = v.split(':').map(Number)
      return { hour: h % 12 || 12, minute: m, ampm: h >= 12 ? 'PM' : 'AM' }
    }
    const now = new Date()
    const h   = now.getHours()
    return { hour: h % 12 || 12, minute: now.getMinutes(), ampm: h >= 12 ? 'PM' : 'AM' }
  }

  const initial = parseValue(value)
  const [hour,   setHour]   = useState(initial.hour)
  const [minute, setMinute] = useState(initial.minute)
  const [ampm,   setAmpm]   = useState(initial.ampm)
  const [mode,   setMode]   = useState('hour') // 'hour' | 'minute'
  const svgRef = useRef(null)
  const dragging = useRef(false)

  // Emit value whenever state changes
  useEffect(() => {
    let h = hour % 12
    if (ampm === 'PM') h += 12
    onChange(`${pad(h)}:${pad(minute)}`)
  }, [hour, minute, ampm])

  // If parent passes new value, sync (for edit modal pre-fill)
  useEffect(() => {
    if (value) {
      const p = parseValue(value)
      setHour(p.hour)
      setMinute(p.minute)
      setAmpm(p.ampm)
    }
  }, []) // only on mount

  const handlePointer = useCallback((e, isMove) => {
    if (isMove && !dragging.current) return
    const svg  = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const cx   = e.touches ? e.touches[0].clientX : e.clientX
    const cy   = e.touches ? e.touches[0].clientY : e.clientY
    const x    = ((cx - rect.left) / rect.width)  * SIZE
    const y    = ((cy - rect.top)  / rect.height) * SIZE
    const angle = xyToAngle(x, y)

    if (mode === 'hour') {
      const h = Math.round(angle / 30) % 12 || 12
      setHour(h)
    } else {
      const m = Math.round(angle / 6) % 60
      setMinute(m < 0 ? m + 60 : m)
    }
  }, [mode])

  const onPointerDown = (e) => { dragging.current = true; handlePointer(e, false) }
  const onPointerMove = (e) => { handlePointer(e, true) }
  const onPointerUp   = (e) => {
    handlePointer(e, false)
    dragging.current = false
    if (mode === 'hour') setMode('minute')
  }

  // Hour hand position
  const hourAngle  = (hour % 12) * 30
  const hourPos    = polarToXY(hourAngle, R_HOUR - 18)

  // Minute hand position
  const minuteAngle = minute * 6
  const minutePos   = polarToXY(minuteAngle, R_MIN - 18)

  const activePos = mode === 'hour' ? hourPos : minutePos

  return (
    <div className="select-none" style={{ userSelect: 'none' }}>
      {/* Time display + AM/PM */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="flex items-baseline gap-1">
          <button
            onClick={() => setMode('hour')}
            className={`text-3xl font-mono font-medium transition-colors ${mode === 'hour' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
            {pad(hour)}
          </button>
          <span className="text-3xl font-mono text-gray-300 dark:text-gray-600">:</span>
          <button
            onClick={() => setMode('minute')}
            className={`text-3xl font-mono font-medium transition-colors ${mode === 'minute' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
            {pad(minute)}
          </button>
        </div>
        {/* AM/PM */}
        <div className="flex flex-col gap-1">
          {['AM', 'PM'].map(a => (
            <button key={a} onClick={() => setAmpm(a)}
              className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-all ${
                ampm === a
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Mode indicator */}
      <div className="flex justify-center gap-3 mb-3">
        {['hour', 'minute'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
              mode === m
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-500'}`}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Clock face */}
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          width={SIZE} height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ touchAction: 'none', cursor: 'pointer' }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={() => { dragging.current = false }}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        >
          {/* Clock background */}
          <circle cx={CX} cy={CY} r={SIZE/2 - 4} fill="transparent" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"/>

          {/* Hour numbers */}
          {mode === 'hour' && Array.from({ length: 12 }, (_, i) => {
            const h   = i + 1
            const pos = polarToXY(h * 30, R_HOUR)
            const sel = hour === h
            return (
              <g key={h}>
                {sel && <circle cx={pos.x} cy={pos.y} r="14" fill="#111827" className="dark:fill-white"/>}
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                  fontSize="13" fontWeight={sel ? '500' : '400'}
                  fill={sel ? 'white' : 'currentColor'} fillOpacity={sel ? 1 : 0.7}
                  style={{ pointerEvents: 'none' }}>
                  {h}
                </text>
              </g>
            )
          })}

          {/* Minute markers — labels every 5, dots every 1 */}
          {mode === 'minute' && Array.from({ length: 60 }, (_, m) => {
            const pos  = polarToXY(m * 6, R_MIN)
            const sel  = minute === m
            const isLabel = MINUTE_LABELS.includes(m)
            if (isLabel) {
              return (
                <g key={m}>
                  {sel && <circle cx={pos.x} cy={pos.y} r="13" fill="#111827" className="dark:fill-white"/>}
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fontSize="11" fontWeight={sel ? '500' : '400'}
                    fill={sel ? 'white' : 'currentColor'} fillOpacity={sel ? 1 : 0.7}
                    style={{ pointerEvents: 'none' }}>
                    {pad(m)}
                  </text>
                </g>
              )
            }
            // Non-label minute: dot
            return (
              <g key={m}>
                {sel && <circle cx={pos.x} cy={pos.y} r="10" fill="#111827" className="dark:fill-white"/>}
                <circle cx={pos.x} cy={pos.y} r={sel ? 2 : 1.5}
                  fill={sel ? 'white' : 'currentColor'} fillOpacity={sel ? 1 : 0.3}
                  style={{ pointerEvents: 'none' }}/>
              </g>
            )
          })}

          {/* Hand line */}
          <line x1={CX} y1={CY} x2={activePos.x} y2={activePos.y}
            stroke="#111827" strokeWidth="1.5" strokeLinecap="round"
            className="dark:stroke-white" opacity="0.6"
            style={{ pointerEvents: 'none' }}/>

          {/* Center dot */}
          <circle cx={CX} cy={CY} r="3" fill="#111827" className="dark:fill-white" style={{ pointerEvents: 'none' }}/>
        </svg>
      </div>
    </div>
  )
}
