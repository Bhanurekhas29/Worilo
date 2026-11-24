const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong')
    err.status = res.status
    err.errors = data.errors || {}
    throw err
  }
  return data
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export const adminApi = {
  login: (login, password) => request('/auth/login', json('POST', { login, password })),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Generic helpers
  get: (path) => request(path),
  post: (path, body) => request(path, json('POST', body)),
  put: (path, body) => request(path, json('PUT', body)),
  del: (path) => request(path, { method: 'DELETE' }),
}

export const apiUrl = (path) => `${BASE}${path}`
