import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_URL || '/api'

// Loads all public website content (managed from the admin panel) once.
export default function useSite() {
  const [site, setSite] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`${BASE}/public/site`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load the website content'))))
      .then((data) => !cancelled && setSite(data))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  return { site, error }
}

export async function submitEnquiry(payload) {
  const res = await fetch(`${BASE}/public/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.')
    err.errors = data.errors || {}
    throw err
  }
  return data
}
