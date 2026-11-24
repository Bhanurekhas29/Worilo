import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { adminApi } from '../api.js'
import Avatar from '../components/Avatar.jsx'
import Field from '../components/Field.jsx'
import Icon from '../components/Icons.jsx'
import Modal from '../components/Modal.jsx'
import { isEmail } from '../useSettingsForm.js'

const EMPTY = { name: '', username: '', email: '', password: '', password_confirm: '', is_active: true }

function passwordProblem(pw, username) {
  if (pw.length < 8) return 'Password must be at least 8 characters'
  if (pw.length > 72) return 'Password must be at most 72 characters'
  if (!/[a-z]/.test(pw)) return 'Password needs a lowercase letter'
  if (!/[A-Z]/.test(pw)) return 'Password needs an uppercase letter'
  if (!/\d/.test(pw)) return 'Password needs a number'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password needs a special character'
  if (username && pw.toLowerCase().includes(username.toLowerCase())) return 'Password must not contain the username'
  return null
}

function UserForm({ user, onClose, onSaved }) {
  const editing = !!user
  const [values, setValues] = useState(editing ? { ...EMPTY, ...user } : EMPTY)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    error: errors[name],
    onChange: (e) => {
      setValues((v) => ({ ...v, [name]: e.target.value }))
      setErrors((er) => ({ ...er, [name]: undefined }))
    },
  })

  function validate() {
    const e = {}
    const name = values.name.trim()
    if (name.length < 2 || name.length > 60) e.name = 'Full name must be 2-60 characters'
    if (!editing) {
      if (!/^[A-Za-z0-9_.]{3,30}$/.test(values.username)) {
        e.username = 'Username must be 3-30 characters: letters, numbers, dot or underscore'
      }
    }
    if (!isEmail(values.email.trim())) e.email = 'Enter a valid email'
    if (!editing || values.password) {
      const problem = passwordProblem(values.password, values.username)
      if (!values.password) e.password = 'Password is required'
      else if (problem) e.password = problem
      else if (values.password !== values.password_confirm) e.password_confirm = 'Passwords do not match'
    }
    return e
  }

  async function submit(ev) {
    ev.preventDefault()
    const clientErrors = validate()
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      setMessage('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const payload = { ...values, name: values.name.trim(), email: values.email.trim() }
      if (editing) await adminApi.put(`/users?id=${user.id}`, payload)
      else await adminApi.post('/users', payload)
      onSaved()
    } catch (err) {
      setErrors(err.errors || {})
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={editing ? 'Edit user' : 'Add user'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {message && <div className="alert alert-error">{message}</div>}
        <Field label="Full name" required maxLength={60} {...bind('name')} />
        <Field
          label="Username"
          required
          maxLength={30}
          autoComplete="off"
          disabled={editing}
          hint={editing ? 'Username cannot be changed.' : 'Letters, numbers, dot and underscore only.'}
          {...bind('username')}
        />
        <Field label="Email" required type="email" autoComplete="off" {...bind('email')} />
        <Field
          label={editing ? 'New password' : 'Password'}
          required={!editing}
          type="password"
          autoComplete="new-password"
          hint={
            editing
              ? 'Leave blank to keep the current password.'
              : 'Min 8 characters with upper & lower case, a number and a special character.'
          }
          {...bind('password')}
        />
        <Field
          label="Confirm password"
          required={!editing || !!values.password}
          type="password"
          autoComplete="new-password"
          {...bind('password_confirm')}
        />
        {editing && !user.is_super && (
          <label className="check" style={{ marginBottom: 18 }}>
            <input
              type="checkbox"
              checked={!!values.is_active}
              onChange={(e) => setValues((v) => ({ ...v, is_active: e.target.checked }))}
            />
            Active (can log in)
          </label>
        )}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add user'}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Users() {
  const { admin } = useOutletContext()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(null) // null | { user? }
  const [toDelete, setToDelete] = useState(null)

  const load = useCallback(() => {
    adminApi
      .get('/users')
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  async function confirmDelete() {
    try {
      await adminApi.del(`/users?id=${toDelete.id}`)
      setNotice(`${toDelete.name} was deleted`)
      load()
    } catch (e) {
      setError(e.message)
    }
    setToDelete(null)
  }

  if (!admin.is_super) return <div className="alert alert-error">Only the superuser can manage users.</div>

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Users</h2>
          <p>The superuser can add other admins who can manage the site content.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({})}>
          <Icon name="plus" size={18} /> Add user
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="card" style={{ padding: 12 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="empty">
                    Loading…
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="strong">
                    <span className="user-cell">
                      <Avatar admin={{ name: u.name }} size={36} />
                      {u.name}
                    </span>
                  </td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.is_super ? 'badge-navy' : ''}`}>{u.is_super ? 'Super Admin' : 'Admin'}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn edit" aria-label={`Edit ${u.name}`} onClick={() => setForm({ user: u })}>
                        <Icon name="edit" size={17} />
                      </button>
                      <button
                        className="icon-btn danger"
                        aria-label={`Delete ${u.name}`}
                        disabled={u.is_super || u.id === admin.id}
                        onClick={() => setToDelete(u)}
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <UserForm
          user={form.user}
          onClose={() => setForm(null)}
          onSaved={() => {
            setNotice(form.user ? 'User updated' : 'User added')
            setError('')
            setForm(null)
            load()
          }}
        />
      )}

      {toDelete && (
        <Modal title="Delete user" onClose={() => setToDelete(null)}>
          <p style={{ marginTop: 0 }}>
            Delete <strong>{toDelete.name}</strong> ({toDelete.username})? This cannot be undone.
          </p>
          <div className="form-actions">
            <button className="btn btn-danger" onClick={confirmDelete}>
              Delete
            </button>
            <button className="btn btn-outline" onClick={() => setToDelete(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
