// hooks/useAuth.js — UPDATED for v2
//
// Now talks to Flask instead of only localStorage.
// localStorage still stores the JWT token and cached user profile
// so the app feels instant on load (no spinner waiting for the server).
//
// Flow on app load:
//   1. Read token from localStorage
//   2. If token exists → call GET /api/auth/me to verify it's still valid
//   3. If valid → show main app. If expired/invalid → show AuthScreen.

import { useState, useEffect } from 'react'
import { authApi, saveToken, clearToken, getToken } from '../services/api'

const USER_KEY = 'done-user'

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)  // true while we verify the token on load

  // On first mount: check if there's a saved token and verify it with Flask
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    // Token exists — verify it's still valid with the server
    authApi.getMe()
      .then(data => setUser(data.user))
      .catch(()  => {
        // Token is expired or invalid — clear everything, show login
        clearToken()
        localStorage.removeItem(USER_KEY)
      })
      .finally(() => setLoading(false))
  }, [])

  const saveUser = async (profile) => {
    // profile has: name, preferredName, email, password (on register)
    try {
      let data
      if (profile.password) {
        // New user — register
        data = await authApi.register(profile)
      } else {
        // Existing user updating profile
        data = await authApi.updateProfile(profile)
      }
      if (data.token) saveToken(data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
    } catch (err) {
      throw err  // let AuthScreen display the error
    }
  }

  const loginUser = async (email, password) => {
    const data = await authApi.login({ email, password })
    saveToken(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setUser(data.user)
  }

  const clearUser = () => {
    clearToken()
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('done-tasks')
    setUser(null)
  }

  return { user, loading, saveUser, loginUser, clearUser }
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
