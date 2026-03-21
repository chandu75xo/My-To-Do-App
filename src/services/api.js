// src/services/api.js
//
// WHAT IS THIS FILE?
// All network requests to the Flask API live here.
// Components never call fetch() directly — they import from this file.
// This keeps all API logic in one place. If the URL changes, you update it once.
//
// BASE_URL: where Flask is running.
//   - Locally:     http://localhost:5000
//   - Production:  your Render.com URL (set as VITE_API_URL in Netlify env vars)
//
// VITE_ prefix is required for Vite to expose env variables to the browser.
// import.meta.env.VITE_API_URL reads from a .env file in the frontend root.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ── Token helpers ─────────────────────────────────────────────────────────────
// The JWT token is saved in localStorage after login.
// Every protected request sends it in the Authorization header.

export const getToken  = ()        => localStorage.getItem('done-token')
export const saveToken = (token)   => localStorage.setItem('done-token', token)
export const clearToken = ()       => localStorage.removeItem('done-token')

// ── Core fetch wrapper ────────────────────────────────────────────────────────
// All requests go through this function so we don't repeat headers everywhere.

async function request(path, options = {}) {
  const token = getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    // Spread the caller's options (method, body, etc.)
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // If we have a token, attach it. Flask's @jwt_required reads this.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Allow the caller to add extra headers
      ...(options.headers || {}),
    },
  })

  // 204 = No Content (DELETE responses) — no body to parse
  if (res.status === 204) return null

  const data = await res.json()

  // If Flask returned an error status, throw it so the caller can handle it
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`)
  }

  return data
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (payload) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () =>
    request('/api/auth/me'),

  updateProfile: (payload) =>
    request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
}

// ── Tasks API ─────────────────────────────────────────────────────────────────

export const tasksApi = {
  getAll: (tag) =>
    request(`/api/tasks/${tag && tag !== 'all' ? `?tag=${tag}` : ''}`),

  create: (payload) =>
    request('/api/tasks/', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id, payload) =>
    request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  delete: (id) =>
    request(`/api/tasks/${id}`, { method: 'DELETE' }),

  clearCompleted: () =>
    request('/api/tasks/clear-completed', { method: 'DELETE' }),
}
