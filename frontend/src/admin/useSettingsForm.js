import { useCallback, useEffect, useState } from 'react'
import { adminApi } from './api.js'

// Loads a settings group, tracks edits, and saves with per-field server errors.
// Server-only extras (has_password, password_updated) are kept in `meta`, not in `values`.
export default function useSettingsForm(endpoint, initial) {
  const [values, setValues] = useState(initial)
  const [snapshot, setSnapshot] = useState(JSON.stringify(initial))
  const [meta, setMeta] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const apply = useCallback(
    (data) => {
      const { has_password, password_updated, ...rest } = data
      setValues((v) => {
        const next = { ...v, ...rest }
        setSnapshot(JSON.stringify(next))
        return next
      })
      setMeta({ has_password, password_updated })
    },
    [],
  )

  const load = useCallback(() => {
    setLoading(true)
    adminApi
      .get(endpoint)
      .then(({ data }) => apply(data))
      .catch((e) => setStatus({ type: 'error', message: e.message }))
      .finally(() => setLoading(false))
  }, [endpoint, apply])

  useEffect(load, [load])

  const set = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e))
    setStatus({ type: '', message: '' })
  }, [])

  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    onChange: (e) => set(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value),
    error: errors[name],
  })

  // Throw away unsaved edits by reloading from the server.
  const reset = useCallback(() => {
    setErrors({})
    setStatus({ type: '', message: '' })
    load()
  }, [load])

  // `validate(values)` -> { field: message } for quick client-side checks before the request.
  // Resolves to true when saved.
  async function save(validate) {
    const clientErrors = validate ? validate(values) : {}
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      setStatus({ type: 'error', message: 'Please fix the highlighted fields' })
      return false
    }
    setSaving(true)
    setStatus({ type: '', message: '' })
    try {
      const { data } = await adminApi.put(endpoint, values)
      apply(data)
      setErrors({})
      setStatus({ type: 'success', message: 'Saved successfully' })
      return true
    } catch (e) {
      setErrors(e.errors || {})
      setStatus({ type: 'error', message: e.message })
      return false
    } finally {
      setSaving(false)
    }
  }

  const dirty = JSON.stringify(values) !== snapshot

  return { values, set, bind, save, reset, dirty, errors, status, loading, saving, meta }
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
