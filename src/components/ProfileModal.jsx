// ProfileModal.jsx
//
// Opens when the user taps their profile avatar in the top-right header.
// Lets them edit: preferred name and email.
// Full name is shown but not editable here (will require re-auth in v2).

import { useState, useEffect } from 'react'

export default function ProfileModal({ isOpen, onClose, user, onSave }) {
  // Pre-fill the form with the current user data
  const [preferredName, setPreferred] = useState(user?.preferredName || '')
  const [email,         setEmail]     = useState(user?.email || '')
  const [saved,         setSaved]     = useState(false)

  // useEffect with [user] dependency: re-fills the form if user data changes
  // (e.g. after signing out and back in)
  useEffect(() => {
    setPreferred(user?.preferredName || '')
    setEmail(user?.email || '')
  }, [user])

  const handleSave = () => {
    if (!email.trim() || !email.includes('@')) return
    onSave({
      ...user,                                  // keep all existing fields
      preferredName: preferredName.trim() || user.name.split(' ')[0],
      email:         email.trim().toLowerCase(),
    })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 900)
  }

  if (!isOpen) return null

  return (
    // Same backdrop pattern as TaskForm
    <div
      className="fixed inset-0 z-20 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Your profile</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Avatar + full name (read-only) */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700">
          <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-base font-semibold text-white dark:text-gray-900">
              {user?.preferredName?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Full name · not editable here</p>
          </div>
        </div>

        {/* Preferred name */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Preferred name
          </label>
          <input
            type="text"
            value={preferredName}
            onChange={e => setPreferred(e.target.value)}
            placeholder="How should we greet you?"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Used in "Hi, Good morning <span className="font-medium">{preferredName || 'you'}</span>"
          </p>
        </div>

        {/* Email */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Email reminders for important tasks activate in v2
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`
            w-full py-3 rounded-2xl font-semibold text-sm transition-all
            ${saved
              ? 'bg-green-500 text-white'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 active:scale-95'
            }
          `}
        >
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
