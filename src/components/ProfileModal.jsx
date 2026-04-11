// ProfileModal.jsx — password change now works via /api/auth/change-password

import { useState, useEffect } from 'react'
import { authApi } from '../services/api'

const Field = ({ label, type = 'text', value, onChange, placeholder, autoFocus }) => (
  <div className="mb-4">
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} autoFocus={autoFocus}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"/>
  </div>
)

export default function ProfileModal({ isOpen, onClose, user, onSave }) {
  const [preferredName, setPreferred] = useState('')
  const [email,         setEmail]     = useState('')
  const [currentPw,     setCurrentPw] = useState('')
  const [newPw,         setNewPw]     = useState('')
  const [confirmPw,     setConfirmPw] = useState('')
  const [tab,           setTab]       = useState('profile')
  const [status,        setStatus]    = useState(null)  // null | 'saving' | 'saved' | 'error'
  const [errorMsg,      setErrorMsg]  = useState('')

  useEffect(() => {
    if (!isOpen) return
    setPreferred(user?.preferredName || '')
    setEmail(user?.email || '')
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setStatus(null); setErrorMsg(''); setTab('profile')
  }, [user, isOpen])

  if (!isOpen) return null

  const handleSaveProfile = async () => {
    if (!email.trim() || !email.includes('@')) {
      return setErrorMsg('Please enter a valid email.')
    }
    setErrorMsg(''); setStatus('saving')
    try {
      const data = await authApi.updateProfile({
        preferredName: preferredName.trim() || user.name.split(' ')[0],
        email:         email.trim().toLowerCase(),
      })
      onSave(data.user)
      setStatus('saved')
      setTimeout(() => { setStatus(null); onClose() }, 800)
    } catch (err) {
      setErrorMsg(err.message); setStatus(null)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPw)        return setErrorMsg('Enter your current password.')
    if (newPw.length < 6)  return setErrorMsg('New password must be at least 6 characters.')
    if (newPw !== confirmPw) return setErrorMsg('New passwords do not match.')
    setErrorMsg(''); setStatus('saving')
    try {
      await authApi.changePassword({
        currentPassword: currentPw,
        newPassword:     newPw,
      })
      setStatus('saved')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setStatus(null), 2000)
    } catch (err) {
      // err.message will be 'Current password is incorrect' or similar
      setErrorMsg(err.message); setStatus(null)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"/>

      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-10">

        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <p className="font-serif text-lg text-gray-900 dark:text-white">Profile</p>
            <button onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15"/>
              </svg>
            </button>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
            <div className="w-11 h-11 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-base font-semibold text-white dark:text-gray-900">
                {user?.preferredName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-5">
            {['profile', 'password'].map(t => (
              <button key={t} onClick={() => { setTab(t); setErrorMsg(''); setStatus(null) }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  tab === t ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          {tab === 'profile' ? (
            <>
              <Field label="Preferred name" value={preferredName} onChange={setPreferred}
                placeholder="How should we greet you?" autoFocus/>
              <Field label="Email address" type="email" value={email}
                onChange={v => { setEmail(v); setErrorMsg('') }}
                placeholder="you@example.com"/>
            </>
          ) : (
            <>
              <Field label="Current password" type="password" value={currentPw}
                onChange={setCurrentPw} placeholder="Your current password" autoFocus/>
              <Field label="New password" type="password" value={newPw}
                onChange={setNewPw} placeholder="Min 6 characters"/>
              <Field label="Confirm new password" type="password" value={confirmPw}
                onChange={setConfirmPw} placeholder="Repeat new password"/>
              {status === 'saved' && (
                <p className="text-xs text-green-600 dark:text-green-400 mb-4 flex items-center gap-1.5">
                  ✓ Password changed successfully
                </p>
              )}
            </>
          )}

          {errorMsg && (
            <p className="text-xs text-red-500 mb-4">{errorMsg}</p>
          )}

          <button
            onClick={tab === 'profile' ? handleSaveProfile : handleChangePassword}
            disabled={status === 'saving' || status === 'saved'}
            className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all ${
              status === 'saved'  ? 'bg-green-500 text-white' :
              status === 'saving' ? 'bg-gray-400 text-white cursor-not-allowed' :
              'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 active:scale-95'}`}>
            {status === 'saving' ? 'Saving…' :
             status === 'saved' && tab === 'password' ? 'Changed!' :
             status === 'saved' ? 'Saved!' :
             tab === 'profile' ? 'Save changes' : 'Change password'}
          </button>
        </div>
      </div>
    </div>
  )
}
