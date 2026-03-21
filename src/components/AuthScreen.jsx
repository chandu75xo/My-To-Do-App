// AuthScreen.jsx — UPDATED for v2
// Now has two modes: Sign Up (new user) and Log In (returning user).
// Calls Flask /api/auth/register or /api/auth/login.

import { useState } from 'react'

export default function AuthScreen({ onSave, onLogin }) {
  const [step,          setStep]         = useState(1)           // 1=welcome, 2=form
  const [mode,          setMode]         = useState('signup')    // 'signup' or 'login'
  const [name,          setName]         = useState('')
  const [preferredName, setPreferred]    = useState('')
  const [email,         setEmail]        = useState('')
  const [password,      setPassword]     = useState('')
  const [error,         setError]        = useState('')
  const [loading,       setLoading]      = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (mode === 'signup' && !name.trim()) return setError('Please enter your name.')
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    try {
      if (mode === 'signup') {
        await onSave({
          name:          name.trim(),
          preferredName: preferredName.trim() || name.trim().split(' ')[0],
          email:         email.trim(),
          password,
        })
      } else {
        await onLogin(email.trim(), password)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-6xl text-gray-900 dark:text-white tracking-tight mb-3">done.</h1>
        <p className="text-gray-500 dark:text-gray-400 text-base max-w-xs mx-auto leading-relaxed mb-10">
          Your personal todo app. For you, your friends, and your family.
        </p>
        <div className="flex gap-2 mb-10">
          {['bg-blue-400','bg-amber-400','bg-green-400','bg-red-400'].map((c,i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${c}`} />
          ))}
        </div>
        <button onClick={() => { setMode('signup'); setStep(2) }}
          className="w-full max-w-xs py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all mb-3">
          Create account →
        </button>
        <button onClick={() => { setMode('login'); setStep(2) }}
          className="w-full max-w-xs py-3 rounded-2xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
          I already have an account
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <button onClick={() => setStep(1)}
          className="mb-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1.5 text-sm transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        <h2 className="font-serif text-3xl text-gray-900 dark:text-white mb-1">
          {mode === 'signup' ? 'Create your profile' : 'Welcome back'}
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
          {mode === 'signup' ? "We'll use this to personalise your experience." : 'Sign in to your account.'}
        </p>

        {mode === 'signup' && (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Full name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ravi Kumar"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"/>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Preferred name <span className="font-normal">(for greetings)</span></label>
              <input type="text" value={preferredName} onChange={e => setPreferred(e.target.value)} placeholder="Leave blank to use first name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"/>
            </div>
          </>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"/>
        </div>
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Password * <span className="font-normal">(min 6 characters)</span></label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"/>
        </div>

        {error && (
          <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 018 5zm0 6a1 1 0 110-2 1 1 0 010 2z"/>
            </svg>
            {error}
          </p>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all">
          {loading ? 'Please wait…' : mode === 'signup' ? "Let's go →" : 'Sign in →'}
        </button>

        <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}
