// AdminDashboard.jsx — fixed to match current API shape
// Endpoints used:
//   GET /api/health            (no secret needed)
//   GET /api/admin/stats       → { users:{total,verified,unverified,new_7d,new_30d}, tasks:{active,done,archived,overdue,completed_7d,completed_30d}, push_subscriptions, pending_otps, generated_at }
//   GET /api/admin/users       → { count, users:[{id,name,email,verified,task_count,push_subs,created_at}] }
//   GET /api/admin/health      → { db, scheduler, checked_at }

import { useState, useEffect, useCallback, useRef } from 'react'

const API       = import.meta.env.VITE_API_URL     || 'http://localhost:5000'
const ADMIN_PWD = import.meta.env.VITE_ADMIN_PWD   || 'done-admin-2026'
const SECRET    = import.meta.env.VITE_ADMIN_SECRET || ''

async function apiFetch(path) {
  const sep = path.includes('?') ? '&' : '?'
  const url = `${API}${path}${sep}secret=${SECRET}`
  const r   = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

const fmt = (n) => (n ?? '—').toLocaleString?.() ?? '—'
const pct = (a, b) => b > 0 ? `${Math.round((a / b) * 100)}%` : '—'

function RelativeTime({ ts }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const update = () => {
      if (!ts) return setLabel('—')
      const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
      if (diff < 60)   return setLabel(`${diff}s ago`)
      if (diff < 3600) return setLabel(`${Math.floor(diff / 60)}m ago`)
      setLabel(`${Math.floor(diff / 3600)}h ago`)
    }
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [ts])
  return <span>{label}</span>
}

function Stat({ label, value, sub, accent }) {
  const colors = {
    green:  ['border-l-emerald-400', 'text-emerald-300'],
    amber:  ['border-l-amber-400',   'text-amber-300'],
    blue:   ['border-l-sky-400',     'text-sky-300'],
    red:    ['border-l-rose-400',     'text-rose-300'],
    purple: ['border-l-violet-400',  'text-violet-300'],
    gray:   ['border-l-zinc-500',    'text-zinc-300'],
  }
  const [border, text] = colors[accent] || colors.gray
  return (
    <div className={`border-l-2 pl-4 py-1 ${border}`}>
      <div className={`text-3xl font-bold font-mono tracking-tight ${text}`}>{fmt(value)}</div>
      <div className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest">{label}</div>
      {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  )
}

function StatusPill({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      ok
        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
        : 'bg-rose-950 text-rose-300 border border-rose-800'
    }`}>
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

// ── Login ──────────────────────────────────────────────────────────────────

function Login({ onAuth }) {
  const [pw, setPw]     = useState('')
  const [err, setErr]   = useState('')
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
        <div className="text-center mb-10">
          <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest mb-3">done. system</p>
          <p className="text-4xl font-bold text-white" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>admin</p>
          <div className="mt-2 flex justify-center"><div className="h-px w-12 bg-zinc-700"/></div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <input autoFocus type="password" value={pw}
              onChange={e => { setPw(e.target.value); setErr('') }}
              placeholder="Enter admin password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono tracking-wider"/>
            {err && <p className="text-rose-400 text-xs mt-2 ml-1">{err}</p>}
          </div>
          <button type="submit"
            className="w-full bg-white text-zinc-950 font-bold py-3.5 rounded-xl text-sm hover:bg-zinc-100 active:scale-95 transition-all">
            Access dashboard
          </button>
        </form>
        <p className="text-center text-zinc-700 text-xs mt-8 font-mono">done. · internal tools</p>
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

// ── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({ onLogout }) {
  const [apiHealth, setApiHealth] = useState(null)   // GET /api/health
  const [adminHealth, setAdminHealth] = useState(null) // GET /api/admin/health
  const [stats,     setStats]     = useState(null)   // GET /api/admin/stats
  const [users,     setUsers]     = useState(null)   // GET /api/admin/users
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const [countdown, setCountdown] = useState(30)
  const [actionLog, setActionLog] = useState([])
  const countRef = useRef(30)

  const log = (msg, type = 'info') =>
    setActionLog(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20))

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ah, adh, s, u] = await Promise.allSettled([
        fetch(`${API}/api/health`).then(r => r.json()),
        apiFetch('/api/admin/health'),
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/users'),
      ])
      if (ah.status  === 'fulfilled') setApiHealth(ah.value)
      if (adh.status === 'fulfilled') setAdminHealth(adh.value)
      if (s.status   === 'fulfilled') setStats(s.value)
      else { setError(`Stats: ${s.reason?.message}`); log(`Stats fetch failed: ${s.reason?.message}`, 'error') }
      if (u.status   === 'fulfilled') setUsers(u.value)
      else log(`Users fetch failed: ${u.reason?.message}`, 'error')
      setLastFetch(new Date().toISOString())
      countRef.current = 30
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const refreshId = setInterval(fetchAll, 30000)
    const countId   = setInterval(() => {
      countRef.current = Math.max(0, countRef.current - 1)
      setCountdown(countRef.current)
    }, 1000)
    return () => { clearInterval(refreshId); clearInterval(countId) }
  }, [fetchAll])

  // Derived from new API shape
  const apiOk        = apiHealth?.status === 'ok'
  const dbOk         = adminHealth?.db === 'ok'
  const schedulerOk  = adminHealth?.scheduler === 'running'

  const totalUsers    = stats?.users?.total        ?? 0
  const verifiedUsers = stats?.users?.verified     ?? 0
  const newUsers7d    = stats?.users?.new_7d        ?? 0
  const newUsers30d   = stats?.users?.new_30d       ?? 0

  const activeTasks   = stats?.tasks?.active       ?? 0
  const doneTasks     = stats?.tasks?.done         ?? 0
  const archivedTasks = stats?.tasks?.archived     ?? 0
  const overdueTasks  = stats?.tasks?.overdue      ?? 0
  const completed7d   = stats?.tasks?.completed_7d  ?? 0
  const completed30d  = stats?.tasks?.completed_30d ?? 0

  const pushSubs     = stats?.push_subscriptions   ?? 0
  const pendingOtps  = stats?.pending_otps         ?? 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* Top bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-white" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>done.</span>
            <span className="text-zinc-600 text-sm">admin</span>
            <StatusPill ok={apiOk}       label={apiOk ? 'API online' : 'API offline'} />
            <StatusPill ok={dbOk}        label={dbOk  ? 'DB ok'      : 'DB error'} />
            <StatusPill ok={schedulerOk} label={schedulerOk ? 'Scheduler running' : 'Scheduler stopped'} />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-zinc-600 font-mono flex items-center gap-2">
              <span>refresh in</span>
              <span className="text-zinc-400 tabular-nums w-5 text-right">{countdown}s</span>
              <button onClick={fetchAll} className="text-zinc-500 hover:text-white transition-colors ml-1 text-base" title="Refresh now">↺</button>
            </div>
            <div className="text-xs text-zinc-600 font-mono hidden sm:block">
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

        {error && (
          <div className="bg-rose-950 border border-rose-800 rounded-xl px-5 py-3 text-rose-300 text-sm font-mono">
            ⚠ {error} — check VITE_ADMIN_SECRET is set correctly
          </div>
        )}

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Stat label="Total users"  value={totalUsers}   accent="blue"
              sub={`${verifiedUsers} verified · ${totalUsers - verifiedUsers} pending`}/>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Stat label="Active tasks" value={activeTasks}  accent="green"
              sub={`${doneTasks} done · ${archivedTasks} archived`}/>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Stat label="Overdue"      value={overdueTasks} accent={overdueTasks > 0 ? 'red' : 'gray'}
              sub="incomplete past due date"/>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Stat label="Push devices" value={pushSubs}     accent="purple"
              sub={`${pendingOtps} pending OTPs`}/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left — 2/3 width */}
          <div className="md:col-span-2 space-y-6">

            {/* Activity */}
            <Section title="Activity" icon="📈">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Tasks completed</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Last 7 days</span>
                      <span className="text-sm font-mono text-emerald-300">{completed7d}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Last 30 days</span>
                      <span className="text-sm font-mono text-emerald-300">{completed30d}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Completion rate</span>
                      <span className="text-sm font-mono text-sky-300">{pct(doneTasks + archivedTasks, activeTasks + doneTasks + archivedTasks)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">New users</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Last 7 days</span>
                      <span className="text-sm font-mono text-sky-300">{newUsers7d}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Last 30 days</span>
                      <span className="text-sm font-mono text-sky-300">{newUsers30d}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400">Verification rate</span>
                      <span className="text-sm font-mono text-sky-300">{pct(verifiedUsers, totalUsers)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Users table */}
            <Section title="Users" icon="👤"
              action={<span className="text-xs text-zinc-600 font-mono">{totalUsers} total</span>}>
              {loading && !users ? (
                <p className="text-zinc-700 text-sm text-center py-6">Loading…</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {['Name', 'Email', 'Tasks', 'Push', 'Status', 'Joined'].map(h => (
                          <th key={h} className="text-left pb-2 text-xs text-zinc-600 font-semibold uppercase tracking-wider pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(users?.users || []).slice(0, 15).map(u => (
                        <tr key={u.id} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                          <td className="py-2.5 pr-4 text-zinc-200 font-medium">{u.name}</td>
                          <td className="py-2.5 pr-4 text-zinc-400 font-mono text-xs">{u.email}</td>
                          <td className="py-2.5 pr-4 text-zinc-300 font-mono text-xs text-center">{u.task_count}</td>
                          <td className="py-2.5 pr-4 text-zinc-500 font-mono text-xs text-center">{u.push_subs}</td>
                          <td className="py-2.5 pr-4">
                            {u.verified
                              ? <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900">verified</span>
                              : <span className="text-xs text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-900">pending</span>}
                          </td>
                          <td className="py-2.5 text-zinc-600 text-xs font-mono">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                      {(!users?.users || users.users.length === 0) && (
                        <tr><td colSpan={6} className="py-8 text-center text-zinc-700 text-sm">No users yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

          </div>

          {/* Right — 1/3 width */}
          <div className="space-y-6">

            {/* System health */}
            <Section title="System" icon="⚙">
              <div className="space-y-3">
                {[
                  { label: 'API',       ok: apiOk,       val: apiOk ? 'Online' : 'Offline' },
                  { label: 'Database',  ok: dbOk,        val: dbOk  ? 'Connected' : 'Error' },
                  { label: 'Scheduler', ok: schedulerOk, val: schedulerOk ? 'Running' : 'Stopped' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{row.label}</span>
                    <StatusPill ok={row.ok} label={row.val}/>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span className="text-sm text-zinc-400">Last checked</span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {adminHealth?.checked_at ? new Date(adminHealth.checked_at).toLocaleTimeString() : '—'}
                  </span>
                </div>
              </div>
            </Section>

            {/* DB footprint */}
            <Section title="DB Footprint" icon="🗄">
              <div className="space-y-2">
                {[
                  { label: 'Active tasks',   val: activeTasks,   color: 'text-sky-300' },
                  { label: 'Done tasks',     val: doneTasks,     color: 'text-emerald-300' },
                  { label: 'Archived tasks', val: archivedTasks, color: 'text-zinc-400' },
                  { label: 'Push subs',      val: pushSubs,      color: 'text-violet-300' },
                  { label: 'Pending OTPs',   val: pendingOtps,   color: pendingOtps > 10 ? 'text-amber-300' : 'text-zinc-500' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">{row.label}</span>
                    <span className={`text-xs font-mono ${row.color}`}>{fmt(row.val)}</span>
                  </div>
                ))}
                <p className="text-xs text-zinc-700 pt-2 border-t border-zinc-800">
                  Archived tasks &gt;90d are auto-purged daily at 02:00 UTC
                </p>
              </div>
            </Section>

            {/* Action log */}
            <Section title="Activity log" icon="📋">
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {actionLog.length === 0 && (
                  <p className="text-zinc-700 text-xs text-center py-4">No actions yet</p>
                )}
                {actionLog.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-zinc-900 last:border-0">
                    <span className="text-zinc-700 font-mono text-xs flex-shrink-0">{e.time}</span>
                    <span className={`text-xs font-mono break-all ${
                      e.type === 'error'   ? 'text-rose-400' :
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

// ── Root ───────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin-auth') === 'true')
  const onAuth   = () => { sessionStorage.setItem('admin-auth', 'true');  setAuthed(true)  }
  const onLogout = () => { sessionStorage.removeItem('admin-auth');        setAuthed(false) }
  if (!authed) return <Login onAuth={onAuth}/>
  return <Dashboard onLogout={onLogout}/>
}
