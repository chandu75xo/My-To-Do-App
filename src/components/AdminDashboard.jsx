// AdminDashboard.jsx
// Accessible only at /admin — not linked anywhere in the main app.
// Has its own login screen. Credentials are set via environment variable.
// Auto-refreshes every 30 seconds. All backend calls use ADMIN_SECRET.

import { useState, useEffect, useCallback, useRef } from 'react'

const API       = import.meta.env.VITE_API_URL    || 'http://localhost:5000'
const ADMIN_PWD = import.meta.env.VITE_ADMIN_PWD  || 'done-admin-2026'
const SECRET    = import.meta.env.VITE_ADMIN_SECRET || ''

// ── Helpers ────────────────────────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const sep = path.includes('?') ? '&' : '?'
  const url = `${API}${path}${sep}secret=${SECRET}`
  const r   = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) } })
  if (!r.ok) throw new Error(`${r.status}`)
  if (r.status === 204) return null
  return r.json()
}

const fmt = (n) => n?.toLocaleString() ?? '—'
const pct = (a, b) => b > 0 ? `${Math.round((a/b)*100)}%` : '0%'

function RelativeTime({ ts }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const update = () => {
      if (!ts) return setLabel('—')
      const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
      if (diff < 60)  return setLabel(`${diff}s ago`)
      if (diff < 3600) return setLabel(`${Math.floor(diff/60)}m ago`)
      setLabel(`${Math.floor(diff/3600)}h ago`)
    }
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [ts])
  return <span>{label}</span>
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Stat({ label, value, sub, accent }) {
  const accentMap = {
    green:  'border-l-emerald-400 text-emerald-300',
    amber:  'border-l-amber-400  text-amber-300',
    blue:   'border-l-sky-400    text-sky-300',
    red:    'border-l-rose-400   text-rose-300',
    purple: 'border-l-violet-400 text-violet-300',
    gray:   'border-l-zinc-500   text-zinc-300',
  }
  const cls = accentMap[accent] || accentMap.gray
  return (
    <div className={`border-l-2 pl-4 py-1 ${cls.split(' ')[0]}`}>
      <div className={`text-3xl font-bold font-mono tracking-tight ${cls.split(' ')[1]}`}>{fmt(value)}</div>
      <div className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest">{label}</div>
      {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  )
}

function StatusPill({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      ok ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}/>
      {label}
    </span>
  )
}

function Section({ title, icon, children, action }) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-base">{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{title}</span>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function ActionBtn({ label, onClick, loading, variant = 'default' }) {
  const base = 'px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 border'
  const v = {
    default: 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white',
    amber:   'bg-amber-950 border-amber-800 text-amber-300 hover:bg-amber-900',
    red:     'bg-rose-950  border-rose-800  text-rose-300  hover:bg-rose-900',
    green:   'bg-emerald-950 border-emerald-800 text-emerald-300 hover:bg-emerald-900',
  }
  return (
    <button className={`${base} ${v[variant]}`} onClick={onClick} disabled={loading}>
      {loading ? '…' : label}
    </button>
  )
}

// ── Login ──────────────────────────────────────────────────────────────────

function Login({ onAuth }) {
  const [pw, setPw]   = useState('')
  const [err, setErr] = useState('')
  const [shake, setShake] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PWD) {
      onAuth()
    } else {
      setErr('Invalid password')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPw('')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className={`w-full max-w-sm ${shake ? 'animate-shake' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-10">
          <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest mb-3">done. system</p>
          <p className="text-4xl font-bold text-white" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>
            admin
          </p>
          <div className="mt-2 flex justify-center">
            <div className="h-px w-12 bg-zinc-700"/>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <input
              autoFocus
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setErr('') }}
              placeholder="Enter admin password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono tracking-wider"
            />
            {err && <p className="text-rose-400 text-xs mt-2 ml-1">{err}</p>}
          </div>
          <button type="submit"
            className="w-full bg-white text-zinc-950 font-bold py-3.5 rounded-xl text-sm hover:bg-zinc-100 active:scale-95 transition-all">
            Access dashboard
          </button>
        </form>

        <p className="text-center text-zinc-700 text-xs mt-8 font-mono">
          done. v5d · internal tools
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
        .animate-shake { animation: shake 0.4s ease-in-out }
      `}</style>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

function Dashboard({ onLogout }) {
  const [health,    setHealth]    = useState(null)
  const [stats,     setStats]     = useState(null)
  const [scheduler, setScheduler] = useState(null)
  const [users,     setUsers]     = useState(null)
  const [tasks,     setTasks]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [lastFetch, setLastFetch] = useState(null)
  const [countdown, setCountdown] = useState(30)
  const [actionLog, setActionLog] = useState([])
  const [actionLoading, setActionLoading] = useState({})
  const countRef = useRef(30)

  const log = (msg, type = 'info') => {
    const entry = { msg, type, time: new Date().toLocaleTimeString() }
    setActionLog(prev => [entry, ...prev].slice(0, 20))
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [h, s, sch, u, t] = await Promise.allSettled([
        fetch(`${API}/api/health`).then(r => r.json()),
        apiFetch('/api/admin/stats'),
        apiFetch('/api/debug/scheduler'),
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/tasks'),
      ])
      if (h.status === 'fulfilled')   setHealth(h.value)
      if (s.status === 'fulfilled')   setStats(s.value)
      if (sch.status === 'fulfilled') setScheduler(sch.value)
      if (u.status === 'fulfilled')   setUsers(u.value)
      if (t.status === 'fulfilled')   setTasks(t.value)
      setLastFetch(new Date().toISOString())
      countRef.current = 30
    } catch (e) {
      log(`Fetch error: ${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    fetchAll()
    const refreshId = setInterval(fetchAll, 30000)
    const countId   = setInterval(() => {
      countRef.current = Math.max(0, countRef.current - 1)
      setCountdown(countRef.current)
    }, 1000)
    return () => { clearInterval(refreshId); clearInterval(countId) }
  }, [fetchAll])

  const action = async (key, label, fn) => {
    setActionLoading(p => ({ ...p, [key]: true }))
    try {
      const r = await fn()
      log(`✓ ${label}: ${r?.message || 'Done'}`, 'success')
    } catch (e) {
      log(`✗ ${label}: ${e.message}`, 'error')
    } finally {
      setActionLoading(p => ({ ...p, [key]: false }))
      fetchAll()
    }
  }

  // Derived data
  const apiOk         = health?.status === 'ok'
  const schedulerOk   = scheduler?.running === true
  const totalUsers    = stats?.users ?? 0
  const verifiedUsers = stats?.verified_users ?? 0
  const totalTasks    = stats?.tasks ?? 0
  const doneTasks     = stats?.completed_tasks ?? 0
  const activeTasks   = totalTasks - doneTasks
  const pushSubs      = stats?.push_subscriptions ?? 0
  const pendingOtps   = stats?.pending_otps ?? 0

  // Tag breakdown from tasks
  const tagCounts = {}
  ;(tasks?.tasks || []).forEach(t => {
    tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1
  })

  // Important tasks with due time not yet fired
  const pendingNotifs = (tasks?.tasks || []).filter(t =>
    !t.done && t.due_time && !t.push_due_sent
  ).length

  const nextRun = scheduler?.jobs?.[0]?.next_run

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* Top bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-white" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>
              done.
            </span>
            <span className="text-zinc-600 text-sm">admin</span>
            <div className="flex items-center gap-2">
              <StatusPill ok={apiOk}       label={apiOk ? 'API online' : 'API offline'} />
              <StatusPill ok={schedulerOk} label={schedulerOk ? 'Scheduler running' : 'Scheduler stopped'} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-zinc-600 font-mono flex items-center gap-2">
              <span>refresh in</span>
              <span className="text-zinc-400 tabular-nums w-5 text-right">{countdown}s</span>
              <button onClick={fetchAll}
                className="text-zinc-500 hover:text-white transition-colors ml-1 text-base" title="Refresh now">
                ↺
              </button>
            </div>
            <div className="text-xs text-zinc-600 font-mono">
              updated <RelativeTime ts={lastFetch}/>
            </div>
            <button onClick={onLogout}
              className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600">
              sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8 space-y-6">

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Stat label="Total users"    value={totalUsers}    accent="blue"   sub={`${verifiedUsers} verified · ${totalUsers - verifiedUsers} pending`}/>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Stat label="Total tasks"    value={totalTasks}    accent="green"  sub={`${activeTasks} active · ${doneTasks} done (${pct(doneTasks,totalTasks)})`}/>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Stat label="Push devices"   value={pushSubs}      accent="purple" sub={`${pendingNotifs} tasks pending notification`}/>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Stat label="Pending OTPs"   value={pendingOtps}   accent={pendingOtps > 5 ? 'amber' : 'gray'} sub="expire in 10 min"/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="md:col-span-2 space-y-6">

            {/* Scheduler */}
            <Section title="Scheduler" icon="⚙">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Status</span>
                  <StatusPill ok={schedulerOk} label={schedulerOk ? 'Running — every 30s' : 'Stopped'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Next fire</span>
                  <span className="text-sm text-zinc-300 font-mono">
                    {nextRun ? new Date(nextRun).toLocaleTimeString() : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Active jobs</span>
                  <span className="text-sm text-zinc-300 font-mono">{scheduler?.jobs?.length ?? 0}</span>
                </div>
                {scheduler?.jobs?.map(j => (
                  <div key={j.id} className="bg-zinc-800/50 rounded-lg px-4 py-2.5 font-mono text-xs text-zinc-400">
                    <span className="text-emerald-400">{j.id}</span>
                    <span className="ml-3 text-zinc-600">next: {j.next_run ? new Date(j.next_run).toLocaleString() : '?'}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Users table */}
            <Section title="Users" icon="👤"
              action={<span className="text-xs text-zinc-600 font-mono">{totalUsers} total</span>}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left pb-2 text-xs text-zinc-600 font-semibold uppercase tracking-wider">Name</th>
                      <th className="text-left pb-2 text-xs text-zinc-600 font-semibold uppercase tracking-wider">Email</th>
                      <th className="text-left pb-2 text-xs text-zinc-600 font-semibold uppercase tracking-wider">Status</th>
                      <th className="text-left pb-2 text-xs text-zinc-600 font-semibold uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(users?.users || []).slice(0, 10).map(u => (
                      <tr key={u.id} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2.5 pr-4 text-zinc-200 font-medium">{u.name}</td>
                        <td className="py-2.5 pr-4 text-zinc-400 font-mono text-xs">{u.email}</td>
                        <td className="py-2.5 pr-4">
                          {u.verified
                            ? <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900">verified</span>
                            : <span className="text-xs text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-900">pending</span>
                          }
                        </td>
                        <td className="py-2.5 text-zinc-600 text-xs font-mono">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {(!users?.users || users.users.length === 0) && (
                      <tr><td colSpan={4} className="py-8 text-center text-zinc-700 text-sm">No users yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Recent tasks */}
            <Section title="Recent tasks" icon="✓"
              action={<span className="text-xs text-zinc-600 font-mono">{totalTasks} total</span>}>
              <div className="space-y-2">
                {(tasks?.tasks || []).slice(0, 8).map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b border-zinc-900 last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      t.done ? 'bg-emerald-500' : t.due_date < new Date().toISOString().split('T')[0] ? 'bg-rose-500' : 'bg-sky-500'
                    }`}/>
                    <span className={`flex-1 text-sm ${t.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                      {t.title}
                    </span>
                    <span className="text-xs text-zinc-600 font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {t.tag}
                    </span>
                    {t.due_time && (
                      <span className="text-xs text-zinc-600 font-mono">{t.due_date} {t.due_time}</span>
                    )}
                  </div>
                ))}
                {(!tasks?.tasks || tasks.tasks.length === 0) && (
                  <p className="text-center text-zinc-700 text-sm py-6">No tasks yet</p>
                )}
              </div>
            </Section>

          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Task breakdown */}
            <Section title="Tasks by tag" icon="🏷">
              <div className="space-y-3">
                {Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).map(([tag, count]) => {
                  const tagColors = {
                    work: 'bg-sky-500', home: 'bg-amber-500', health: 'bg-emerald-500',
                    shopping: 'bg-rose-500', personal: 'bg-violet-500',
                  }
                  const pctVal = Math.round((count / totalTasks) * 100)
                  return (
                    <div key={tag}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400 capitalize">{tag}</span>
                        <span className="text-xs text-zinc-500 font-mono">{count} · {pctVal}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${tagColors[tag] || 'bg-zinc-500'}`}
                          style={{ width: `${pctVal}%` }}/>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(tagCounts).length === 0 && (
                  <p className="text-zinc-700 text-xs text-center py-4">No task data</p>
                )}
              </div>
            </Section>

            {/* Quick actions */}
            <Section title="Actions" icon="⚡">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-600 mb-2">Scheduler</p>
                  <div className="space-y-2">
                    <ActionBtn label="Trigger reminders now" variant="green"
                      loading={actionLoading.trigger}
                      onClick={() => action('trigger', 'Trigger', () =>
                        apiFetch('/api/debug/trigger', { method: 'POST' }))}/>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-600 mb-2">Notification flags</p>
                  <div className="space-y-2">
                    <ActionBtn label="Reset all notif flags" variant="amber"
                      loading={actionLoading.resetFlags}
                      onClick={() => action('resetFlags', 'Reset flags', () =>
                        apiFetch('/api/debug/reset-flags', { method: 'POST' }))}/>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-600 mb-2">Timezone</p>
                  <div className="space-y-2">
                    <ActionBtn label="Fix IST offsets (330)" variant="default"
                      loading={actionLoading.fixIST}
                      onClick={() => action('fixIST', 'Fix IST offsets', () =>
                        apiFetch('/api/debug/fix-offsets?offset=330', { method: 'POST' }))}/>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-600 mb-2">Danger zone</p>
                  <ActionBtn label="Force refresh data" variant="red"
                    loading={loading}
                    onClick={fetchAll}/>
                </div>
              </div>
            </Section>

            {/* Action log */}
            <Section title="Activity log" icon="📋">
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {actionLog.length === 0 && (
                  <p className="text-zinc-700 text-xs text-center py-4">No actions yet</p>
                )}
                {actionLog.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-zinc-900 last:border-0">
                    <span className="text-zinc-700 font-mono text-xs flex-shrink-0">{e.time}</span>
                    <span className={`text-xs font-mono break-all ${
                      e.type === 'error' ? 'text-rose-400' :
                      e.type === 'success' ? 'text-emerald-400' : 'text-zinc-400'
                    }`}>{e.msg}</span>
                  </div>
                ))}
              </div>
            </Section>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Root export ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() =>
    sessionStorage.getItem('admin-auth') === 'true'
  )

  const onAuth = () => {
    sessionStorage.setItem('admin-auth', 'true')
    setAuthed(true)
  }

  const onLogout = () => {
    sessionStorage.removeItem('admin-auth')
    setAuthed(false)
  }

  if (!authed) return <Login onAuth={onAuth}/>
  return <Dashboard onLogout={onLogout}/>
}
