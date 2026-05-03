const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const getToken   = ()      => localStorage.getItem('done-token')
export const saveToken  = (token) => localStorage.setItem('done-token', token)
export const clearToken = ()      => localStorage.removeItem('done-token')

async function request(path, options = {}) {
  const token = getToken()
  const res   = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed ${res.status}`)
  return data
}

export const authApi = {
  register:       (p)                    => request('/api/auth/register',        { method: 'POST', body: JSON.stringify(p) }),
  login:          (p)                    => request('/api/auth/login',           { method: 'POST', body: JSON.stringify(p) }),
  getMe:          ()                     => request('/api/auth/me'),
  updateProfile:  (p)                    => request('/api/auth/profile',         { method: 'PUT',  body: JSON.stringify(p) }),
  changePassword: (p)                    => request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(p) }),
  sendOtp:        (email, purpose)       => request('/api/auth/send-otp',        { method: 'POST', body: JSON.stringify({ email, purpose }) }),
  verifyOtp:      (email, code, purpose) => request('/api/auth/verify-otp',      { method: 'POST', body: JSON.stringify({ email, code, purpose }) }),
  resetPassword:  (newPassword, resetToken) => request('/api/auth/reset-password', {
    method:  'POST',
    body:    JSON.stringify({ newPassword }),
    headers: { Authorization: `Bearer ${resetToken}` },
  }),
}

export const tasksApi = {
  getAll:         ()                 => request('/api/tasks/'),
  getArchived:    ()                 => request('/api/tasks/archived'),
  create:         (p)                => request('/api/tasks/',                        { method: 'POST',   body: JSON.stringify(p) }),
  update:         (id, p)            => request(`/api/tasks/${id}`,                   { method: 'PUT',    body: JSON.stringify(p) }),
  delete:         (id)               => request(`/api/tasks/${id}`,                   { method: 'DELETE' }),
  clearCompleted: ()                 => request('/api/tasks/clear-completed',          { method: 'DELETE' }),
  addSubtask:     (taskId, title)    => request(`/api/tasks/${taskId}/subtasks`,       { method: 'POST',   body: JSON.stringify({ title }) }),
  updateSubtask:  (taskId, subId, p) => request(`/api/tasks/${taskId}/subtasks/${subId}`, { method: 'PUT', body: JSON.stringify(p) }),
  deleteSubtask:  (taskId, subId)    => request(`/api/tasks/${taskId}/subtasks/${subId}`, { method: 'DELETE' }),
}
