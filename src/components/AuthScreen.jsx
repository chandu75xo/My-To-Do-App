// AuthScreen.jsx — UPDATED for v2.2
// Flow:
//   SIGN UP:   form → OTP email sent → enter 6-digit code → logged in
//   LOGIN:     email + password → logged in
//   FORGOT PW: enter email → OTP sent → enter code → enter new password → logged in

import { useState } from 'react'
import { authApi, saveToken } from '../services/api'

// ── Reusable input component ────────────────────────────────────────────────
const Input = ({ label, type='text', value, onChange, placeholder, hint }) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"/>
    {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
  </div>
)

// ── OTP input — 6 big digit boxes ───────────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6)

  const handleChange = (i, v) => {
    if (!/^\d*$/.test(v)) return
    const arr = digits.map((d, idx) => idx === i ? v.slice(-1) : d)
    onChange(arr.join(''))
    // Auto-focus next box
    if (v && i < 5) document.getElementById(`otp-${i+1}`)?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0)
      document.getElementById(`otp-${i-1}`)?.focus()
  }

  return (
    <div className="flex gap-2 justify-center mb-5">
      {digits.map((d, i) => (
        <input
          key={i} id={`otp-${i}`}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-11 h-12 text-center text-xl font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all"
        />
      ))}
    </div>
  )
}

// ── Error message ───────────────────────────────────────────────────────────
const ErrorMsg = ({ msg }) => msg ? (
  <p className="text-xs text-red-500 mb-4 flex items-center gap-1.5">
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 018 5zm0 6a1 1 0 110-2 1 1 0 010 2z"/>
    </svg>
    {msg}
  </p>
) : null

// ── Submit button ────────────────────────────────────────────────────────────
const SubmitBtn = ({ label, loading, disabled, onClick }) => (
  <button onClick={onClick} disabled={loading || disabled}
    className="w-full py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all">
    {loading ? 'Please wait…' : label}
  </button>
)

// ── Main AuthScreen component ────────────────────────────────────────────────
export default function AuthScreen({ onSave, onLogin }) {
  // mode: 'welcome' | 'signup' | 'login' | 'otp-verify' | 'forgot' | 'otp-reset' | 'new-password'
  const [mode,      setMode]      = useState('welcome')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [otpCode,   setOtpCode]   = useState('')
  const [resetToken,setResetToken]= useState('')

  // Form fields
  const [name,      setName]      = useState('')
  const [preferred, setPreferred] = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const clearError = () => setError('')

  const go = (m) => { setError(''); setOtpCode(''); setMode(m) }

  // ── Sign up ───────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    clearError()
    if (!name.trim())             return setError('Please enter your name.')
    if (!email.includes('@'))     return setError('Please enter a valid email.')
    if (password.length < 6)     return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      const data = await authApi.register({ name, preferredName: preferred, email, password })
      // Dev mode: no email configured → auto-verified, returns token directly
      if (data.devMode) {
        saveToken(data.token)
        onSave({ ...data.user, password: null })
        return
      }
      // Production: OTP sent, move to verification step
      go('otp-verify')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Verify OTP (signup) ───────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    clearError()
    if (otpCode.length !== 6) return setError('Please enter the full 6-digit code.')
    setLoading(true)
    try {
      const data = await authApi.verifyOtp(email, otpCode, 'verify')
      saveToken(data.token)
      onSave(data.user)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    clearError()
    if (!email.includes('@')) return setError('Please enter a valid email.')
    if (!password)            return setError('Please enter your password.')
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      // If unverified, send OTP and jump to verify step
      if (err.message?.includes('verify')) {
        try { await authApi.sendOtp(email, 'verify') } catch {}
        go('otp-verify')
      } else {
        setError(err.message)
      }
    }
    finally { setLoading(false) }
  }

  // ── Forgot password — send OTP ────────────────────────────────────────────
  const handleForgotSend = async () => {
    clearError()
    if (!email.includes('@')) return setError('Please enter a valid email.')
    setLoading(true)
    try {
      await authApi.sendOtp(email, 'reset')
      go('otp-reset')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Verify OTP (password reset) ───────────────────────────────────────────
  const handleVerifyReset = async () => {
    clearError()
    if (otpCode.length !== 6) return setError('Please enter the full 6-digit code.')
    setLoading(true)
    try {
      const data = await authApi.verifyOtp(email, otpCode, 'reset')
      setResetToken(data.resetToken)
      go('new-password')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Set new password ──────────────────────────────────────────────────────
  const handleNewPassword = async () => {
    clearError()
    if (newPw.length < 6)    return setError('Password must be at least 6 characters.')
    if (newPw !== confirmPw) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await authApi.resetPassword(newPw, resetToken)
      // Auto login after reset
      await onLogin(email, newPw)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    const purpose = mode === 'otp-verify' ? 'verify' : 'reset'
    try {
      await authApi.sendOtp(email, purpose)
      setError('')
    } catch (err) { setError('Failed to resend. Try again.') }
  }

  // ── Shared wrapper ────────────────────────────────────────────────────────
  const Wrapper = ({ children, title, subtitle, back }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {back && (
          <button onClick={back}
            className="mb-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1.5 text-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        )}
        <h2 className="font-serif text-3xl text-gray-900 dark:text-white mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">{subtitle}</p>}
        {children}
      </div>
    </div>
  )

  // ── Welcome ───────────────────────────────────────────────────────────────
  if (mode === 'welcome') return (
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
      <button onClick={() => go('signup')}
        className="w-full max-w-xs py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all mb-3">
        Create account →
      </button>
      <button onClick={() => go('login')}
        className="w-full max-w-xs py-3 rounded-2xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
        I already have an account
      </button>
    </div>
  )

  // ── Sign up ───────────────────────────────────────────────────────────────
  if (mode === 'signup') return (
    <Wrapper title="Create your profile" subtitle="We'll use this to personalise your experience."
      back={() => go('welcome')}>
      <Input label="Full name *" value={name} onChange={setName} placeholder="e.g. Ravi Kumar"/>
      <Input label="Preferred name" value={preferred} onChange={setPreferred}
        placeholder="Leave blank to use first name" hint="Used in greetings — 'Hi, Good morning Ravi'"/>
      <Input label="Email *" type="email" value={email} onChange={setEmail} placeholder="you@example.com"/>
      <Input label="Password * (min 6 characters)" type="password" value={password}
        onChange={setPassword} placeholder="••••••••"/>
      <ErrorMsg msg={error}/>
      <SubmitBtn label="Send verification code →" loading={loading} onClick={handleSignup}/>
      <button onClick={() => go('login')}
        className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
        Already have an account? Sign in
      </button>
    </Wrapper>
  )

  // ── OTP verify (signup) ───────────────────────────────────────────────────
  if (mode === 'otp-verify') return (
    <Wrapper title="Check your email" back={() => go('signup')}
      subtitle={`We sent a 6-digit code to ${email}. Enter it below to verify your account.`}>
      <OtpInput value={otpCode} onChange={setOtpCode}/>
      <ErrorMsg msg={error}/>
      <SubmitBtn label="Verify email →" loading={loading} onClick={handleVerifyOtp}/>
      <button onClick={handleResend}
        className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
        Didn't receive a code? Resend
      </button>
    </Wrapper>
  )

  // ── Login ─────────────────────────────────────────────────────────────────
  if (mode === 'login') return (
    <Wrapper title="Welcome back" subtitle="Sign in to your account." back={() => go('welcome')}>
      <Input label="Email *" type="email" value={email} onChange={setEmail} placeholder="you@example.com"/>
      <Input label="Password *" type="password" value={password} onChange={setPassword} placeholder="••••••••"/>
      <button onClick={() => go('forgot')}
        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-4 block">
        Forgot password?
      </button>
      <ErrorMsg msg={error}/>
      <SubmitBtn label="Sign in →" loading={loading} onClick={handleLogin}/>
      <button onClick={() => go('signup')}
        className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
        Don't have an account? Sign up
      </button>
    </Wrapper>
  )

  // ── Forgot password — enter email ─────────────────────────────────────────
  if (mode === 'forgot') return (
    <Wrapper title="Forgot password" subtitle="Enter your email and we'll send you a reset code."
      back={() => go('login')}>
      <Input label="Email *" type="email" value={email} onChange={setEmail} placeholder="you@example.com"/>
      <ErrorMsg msg={error}/>
      <SubmitBtn label="Send reset code →" loading={loading} onClick={handleForgotSend}/>
    </Wrapper>
  )

  // ── OTP verify (password reset) ───────────────────────────────────────────
  if (mode === 'otp-reset') return (
    <Wrapper title="Enter reset code" back={() => go('forgot')}
      subtitle={`We sent a 6-digit code to ${email}. Enter it to continue.`}>
      <OtpInput value={otpCode} onChange={setOtpCode}/>
      <ErrorMsg msg={error}/>
      <SubmitBtn label="Verify code →" loading={loading} onClick={handleVerifyReset}/>
      <button onClick={handleResend}
        className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
        Didn't receive a code? Resend
      </button>
    </Wrapper>
  )

  // ── New password ──────────────────────────────────────────────────────────
  if (mode === 'new-password') return (
    <Wrapper title="Set new password" subtitle="Choose a strong password for your account.">
      <Input label="New password *" type="password" value={newPw} onChange={setNewPw} placeholder="••••••••"/>
      <Input label="Confirm password *" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••"/>
      <ErrorMsg msg={error}/>
      <SubmitBtn label="Update password →" loading={loading} onClick={handleNewPassword}/>
    </Wrapper>
  )
}
