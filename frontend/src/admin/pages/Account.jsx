import { useEffect, useRef, useState } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import { adminApi } from '../api.js'
import Avatar from '../components/Avatar.jsx'
import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import { getNotifySettings, playChime, saveNotifySettings } from '../notifySettings.js'
import { isEmail } from '../useSettingsForm.js'

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

// Crop to a centred square and shrink to 256px so the picture stays small (~20 KB).
function resizeToAvatar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 256
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 256, 256)
      ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 256, 256)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file could not be read as an image'))
    }
    img.src = url
  })
}

const fmtDate = (s) => (s ? new Date(s.replace(' ', 'T')).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—')

function ProfileCard({ admin, setAdmin }) {
  const fileRef = useRef(null)
  const [values, setValues] = useState({ name: admin.name, email: admin.email, avatar: admin.avatar || '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)

  const dirty = values.name !== admin.name || values.email !== admin.email || values.avatar !== (admin.avatar || '')

  const bind = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (e) => {
      setValues((v) => ({ ...v, [name]: e.target.value }))
      setErrors((er) => ({ ...er, [name]: undefined }))
      setStatus({ type: '', message: '' })
    },
  })

  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setErrors((er) => ({ ...er, avatar: 'Choose a JPG, PNG or WebP image' }))
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrors((er) => ({ ...er, avatar: 'Choose an image under 8 MB' }))
      return
    }
    try {
      const data = await resizeToAvatar(file)
      setValues((v) => ({ ...v, avatar: data }))
      setErrors((er) => ({ ...er, avatar: undefined }))
      setStatus({ type: '', message: '' })
    } catch (err) {
      setErrors((er) => ({ ...er, avatar: err.message }))
    }
  }

  async function save(e) {
    e.preventDefault()
    const v = {}
    if (values.name.trim().length < 2 || values.name.trim().length > 60) v.name = 'Full name must be 2-60 characters'
    if (!isEmail(values.email.trim())) v.email = 'Enter a valid email'
    if (Object.keys(v).length) {
      setErrors(v)
      setStatus({ type: 'error', message: 'Please fix the highlighted fields' })
      return
    }
    setSaving(true)
    try {
      const { admin: updated } = await adminApi.put('/account', { ...values, name: values.name.trim(), email: values.email.trim() })
      setAdmin((a) => ({ ...a, ...updated }))
      setValues({ name: updated.name, email: updated.email, avatar: updated.avatar || '' })
      setErrors({})
      setStatus({ type: 'success', message: 'Profile updated' })
    } catch (err) {
      setErrors(err.errors || {})
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card form-card" id="profile" onSubmit={save} noValidate>
      {status.message && <div className={`alert alert-${status.type}`}>{status.message}</div>}
      <FormSection icon="account" title="Profile" description="Your name, email and picture shown in the top bar.">
        <div className="avatar-edit">
          <Avatar admin={{ ...admin, avatar: values.avatar, name: values.name }} size={92} />
          <div>
            <div className="avatar-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                <Icon name="camera" size={16} /> {values.avatar ? 'Change picture' : 'Upload picture'}
              </button>
              {values.avatar && (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setValues((v) => ({ ...v, avatar: '' }))}>
                  Remove
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
            <p className="field-hint" style={{ margin: '8px 0 0' }}>JPG, PNG or WebP. It's cropped to a square and shrunk automatically.</p>
            {errors.avatar && <div className="field-error">{errors.avatar}</div>}
          </div>
        </div>

        <Field label="Full name" required maxLength={60} icon="user" {...bind('name')} />
        <Field label="Email" required type="email" icon="mail" {...bind('email')} />
        <div className="field-row">
          <Field label="Username" value={admin.username} disabled readOnly onChange={() => {}} hint="Usernames can't be changed." />
          <Field label="Role" value={admin.is_super ? 'Super Admin' : 'Admin'} disabled readOnly onChange={() => {}} />
        </div>
        <div className="info-note">
          <Icon name="clock" size={14} /> Last login: {fmtDate(admin.last_login_at)} · Account created {fmtDate(admin.created_at)}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {dirty && <span className="unsaved">Unsaved changes</span>}
        </div>
      </FormSection>
    </form>
  )
}

function PasswordCard({ admin }) {
  const empty = { current_password: '', new_password: '', confirm_password: '' }
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)

  const bind = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (e) => {
      setValues((v) => ({ ...v, [name]: e.target.value }))
      setErrors((er) => ({ ...er, [name]: undefined }))
      setStatus({ type: '', message: '' })
    },
  })

  async function save(e) {
    e.preventDefault()
    const v = {}
    if (!values.current_password) v.current_password = 'Enter your current password'
    const problem = passwordProblem(values.new_password, admin.username)
    if (!values.new_password) v.new_password = 'Enter a new password'
    else if (problem) v.new_password = problem
    else if (values.new_password === values.current_password) v.new_password = 'The new password must be different from the current one'
    else if (values.new_password !== values.confirm_password) v.confirm_password = 'Passwords do not match'
    if (Object.keys(v).length) {
      setErrors(v)
      setStatus({ type: 'error', message: 'Please fix the highlighted fields' })
      return
    }
    setSaving(true)
    try {
      await adminApi.post('/account/password', values)
      setValues(empty)
      setErrors({})
      setStatus({ type: 'success', message: 'Password changed. Use it the next time you log in.' })
    } catch (err) {
      setErrors(err.errors || {})
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card form-card" id="password" onSubmit={save} noValidate>
      {status.message && <div className={`alert alert-${status.type}`}>{status.message}</div>}
      <FormSection icon="lock" title="Change password" description="Choose a strong password you don't use anywhere else." tone="blue">
        <Field
          label="Current password"
          required
          icon="lock"
          type="password"
          autoComplete="current-password"
          {...bind('current_password')}
        />
        <Field
          label="New password"
          required
          icon="key"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters with upper and lower case, a number and a special character."
          {...bind('new_password')}
        />
        <Field
          label="Confirm new password"
          required
          icon="key"
          type="password"
          autoComplete="new-password"
          {...bind('confirm_password')}
        />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </FormSection>
    </form>
  )
}

function NotificationCard() {
  const [prefs, setPrefs] = useState(getNotifySettings)
  const [permission, setPermission] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

  const update = (patch) => setPrefs(saveNotifySettings(patch))

  async function toggleDesktop(on) {
    if (on && permission !== 'granted') {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') return
    }
    update({ desktop: on })
  }

  return (
    <section className="card form-card" id="notifications">
      <FormSection icon="bell" title="Notifications" description="How you're alerted about new quote requests. Saved on this device." tone="navy">
        <label className="check" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={prefs.sound} onChange={(e) => update({ sound: e.target.checked })} />
          Play a sound when a new enquiry arrives
        </label>

        <div className="field">
          <label htmlFor="notify-volume">
            Volume <span className="label-note">{Math.round(prefs.volume * 100)}%</span>
          </label>
          <div className="volume-row">
            <Icon name="volume" size={20} />
            <input
              id="notify-volume"
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={prefs.volume}
              disabled={!prefs.sound}
              onChange={(e) => update({ volume: Number(e.target.value) })}
            />
            <button type="button" className="btn btn-outline btn-sm" onClick={() => playChime(prefs.volume)}>
              Play test sound
            </button>
          </div>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={prefs.desktop && permission === 'granted'}
            disabled={permission === 'unsupported' || permission === 'denied'}
            onChange={(e) => toggleDesktop(e.target.checked)}
          />
          Show a desktop notification when this tab is in the background
        </label>
        {permission === 'denied' && (
          <div className="field-hint" style={{ marginTop: 8 }}>
            Notifications are blocked for this site. Allow them in your browser's site settings to turn this on.
          </div>
        )}
        {permission === 'unsupported' && <div className="field-hint" style={{ marginTop: 8 }}>This browser doesn't support desktop notifications.</div>}
      </FormSection>
    </section>
  )
}

export default function Account() {
  const { admin, setAdmin } = useOutletContext()
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [hash])

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Account settings</h2>
          <p>Manage your profile, password and notification preferences.</p>
        </div>
      </div>
      <div className="account-stack">
        <ProfileCard admin={admin} setAdmin={setAdmin} />
        <PasswordCard admin={admin} />
        <NotificationCard />
      </div>
    </>
  )
}
