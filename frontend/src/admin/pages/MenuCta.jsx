import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api.js'
import Field from '../components/Field.jsx'
import Icon from '../components/Icons.jsx'
import Modal from '../components/Modal.jsx'
import useSettingsForm from '../useSettingsForm.js'

const linkRe = /^(\/[A-Za-z0-9\-._~/#?=&%]*|#[A-Za-z0-9_-]+|https?:\/\/\S+)$/
const LINK_ERROR = 'Link must be a page path like /about, an anchor like #contact, or a full http(s) URL'
const LINK_HINT = 'Page path (/about), anchor (#contact) or full URL (https://…)'

function validateLink(url) {
  const v = url.trim()
  if (!v) return 'Link is required'
  if (v.includes('//') && !/^https?:\/\//i.test(v)) return LINK_ERROR
  return linkRe.test(v) ? null : LINK_ERROR
}

function MenuItemForm({ item, onClose, onSaved }) {
  const editing = !!item
  const [values, setValues] = useState(item || { label: '', url: '', is_active: true })
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

  async function submit(ev) {
    ev.preventDefault()
    const e = {}
    const label = values.label.trim()
    if (label.length < 2 || label.length > 30) e.label = 'Label must be 2-30 characters'
    const linkErr = validateLink(values.url)
    if (linkErr) e.url = linkErr
    if (Object.keys(e).length) {
      setErrors(e)
      setMessage('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const payload = { ...values, label, url: values.url.trim() }
      if (editing) await adminApi.put(`/menu?id=${item.id}`, payload)
      else await adminApi.post('/menu', payload)
      onSaved()
    } catch (err) {
      setErrors(err.errors || {})
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={editing ? 'Edit menu item' : 'Add menu item'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {message && <div className="alert alert-error">{message}</div>}
        <Field label="Label" required maxLength={30} placeholder="About Us" {...bind('label')} />
        <Field label="Link" required placeholder="/about" hint={LINK_HINT} {...bind('url')} />
        <label className="check" style={{ marginBottom: 18 }}>
          <input
            type="checkbox"
            checked={!!values.is_active}
            onChange={(e) => setValues((v) => ({ ...v, is_active: e.target.checked }))}
          />
          Show in the menu
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add item'}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CtaCard() {
  const form = useSettingsForm('/settings/cta', { label: '', url: '', show: true })
  const { values } = form

  function validate(v) {
    const e = {}
    const label = v.label.trim()
    if (label.length < 2 || label.length > 30) e.label = 'Button label must be 2-30 characters'
    const linkErr = validateLink(v.url)
    if (linkErr) e.url = linkErr.replace('Link', 'Button link')
    return e
  }

  return (
    <form
      className="card form-card"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        form.save(validate)
      }}
    >
      <h3 style={{ fontSize: 20, marginBottom: 4 }}>CTA button</h3>
      <p style={{ margin: '0 0 20px' }}>The highlighted button at the right end of the navbar.</p>

      {form.status.message && <div className={`alert alert-${form.status.type}`}>{form.status.message}</div>}

      {form.loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <label className="check" style={{ marginBottom: 18 }}>
            <input type="checkbox" checked={!!values.show} onChange={(e) => form.set('show', e.target.checked)} />
            Show the CTA button
          </label>
          <div className="field-row">
            <Field label="Button label" required maxLength={30} {...form.bind('label')} />
            <Field label="Button link" required placeholder="/contact" {...form.bind('url')} />
          </div>

          <div className="field">
            <span className="field-label">Preview</span>
            <div className="logo-preview" style={{ opacity: values.show ? 1 : 0.4 }}>
              <span className="cta-preview">
                {values.label || 'Request a Quote'} <span aria-hidden="true">→</span>
              </span>
            </div>
            {!values.show && <div className="field-hint">Hidden — the button will not appear in the navbar.</div>}
          </div>
        </>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={form.saving || form.loading}>
          {form.saving ? 'Saving…' : 'Save CTA'}
        </button>
      </div>
    </form>
  )
}

export default function MenuCta() {
  const [items, setItems] = useState([])
  const [max, setMax] = useState(8)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const load = useCallback(() => {
    adminApi
      .get('/menu')
      .then((d) => {
        setItems(d.items)
        setMax(d.max)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  async function move(index, dir) {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next) // optimistic
    try {
      await adminApi.post('/menu/reorder', { ids: next.map((i) => i.id) })
      setError('')
    } catch (e) {
      setError(e.message)
      load()
    }
  }

  async function toggleActive(item) {
    try {
      await adminApi.put(`/menu?id=${item.id}`, { ...item, is_active: !item.is_active })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function confirmDelete() {
    try {
      await adminApi.del(`/menu?id=${toDelete.id}`)
      setNotice(`“${toDelete.label}” was removed`)
      load()
    } catch (e) {
      setError(e.message)
    }
    setToDelete(null)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Menu &amp; CTA</h2>
          <p>Manage the website navbar links and the call-to-action button.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 24 }}>
        <div className="page-head" style={{ margin: '12px 14px 8px' }}>
          <div>
            <h3 style={{ fontSize: 20 }}>Navigation menu</h3>
            <p>
              {items.length} of {max} items · use the arrows to change the order
            </p>
          </div>
          <button className="btn btn-primary btn-sm" disabled={items.length >= max} onClick={() => setForm({})}>
            <Icon name="plus" size={16} /> Add item
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ margin: '0 14px 12px' }}>{error}</div>}
        {notice && <div className="alert alert-success" style={{ margin: '0 14px 12px' }}>{notice}</div>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Order</th>
                <th>Label</th>
                <th>Link</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="empty">
                    Loading…
                  </td>
                </tr>
              )}
              {items.map((it, i) => (
                <tr key={it.id}>
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-start' }}>
                      <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${it.label} up`}>
                        <Icon name="up" size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        disabled={i === items.length - 1}
                        onClick={() => move(i, 1)}
                        aria-label={`Move ${it.label} down`}
                      >
                        <Icon name="down" size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="strong">{it.label}</td>
                  <td>{it.url}</td>
                  <td>
                    <button
                      className={`badge ${it.is_active ? 'badge-green' : 'badge-red'}`}
                      style={{ border: 0, cursor: 'pointer' }}
                      onClick={() => toggleActive(it)}
                      title="Click to toggle"
                    >
                      {it.is_active ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn edit" aria-label={`Edit ${it.label}`} onClick={() => setForm({ item: it })}>
                        <Icon name="edit" size={17} />
                      </button>
                      <button className="icon-btn danger" aria-label={`Delete ${it.label}`} onClick={() => setToDelete(it)}>
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

      <CtaCard />

      {form && (
        <MenuItemForm
          item={form.item}
          onClose={() => setForm(null)}
          onSaved={() => {
            setNotice(form.item ? 'Menu item updated' : 'Menu item added')
            setError('')
            setForm(null)
            load()
          }}
        />
      )}

      {toDelete && (
        <Modal title="Remove menu item" onClose={() => setToDelete(null)}>
          <p style={{ marginTop: 0 }}>
            Remove <strong>{toDelete.label}</strong> from the menu?
          </p>
          <div className="form-actions">
            <button className="btn btn-danger" onClick={confirmDelete}>
              Remove
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
