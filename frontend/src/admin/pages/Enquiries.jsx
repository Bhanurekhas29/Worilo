import { useCallback, useEffect, useState } from 'react'
import { adminApi, apiUrl } from '../api.js'
import Icon from '../components/Icons.jsx'
import Modal from '../components/Modal.jsx'

const fmtDate = (s) =>
  new Date(s.replace(' ', 'T')).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function Enquiries() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, pages: 1, unread: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  // Debounce search typing
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    const params = new URLSearchParams({ page, per_page: 10, status })
    if (query) params.set('search', query)
    adminApi
      .get(`/enquiries?${params}`)
      .then((d) => {
        setData(d)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, query, status])

  useEffect(load, [load])

  async function open(item) {
    setSelected(item)
    if (!item.is_read) {
      await adminApi.put(`/enquiries?id=${item.id}`, { is_read: true }).catch(() => {})
      load()
    }
  }

  async function toggleRead(item) {
    await adminApi.put(`/enquiries?id=${item.id}`, { is_read: !item.is_read }).catch((e) => setError(e.message))
    load()
  }

  async function confirmDelete() {
    try {
      await adminApi.del(`/enquiries?id=${toDelete.id}`)
      load()
    } catch (e) {
      setError(e.message)
    }
    setToDelete(null)
  }

  const exportParams = new URLSearchParams({ status })
  if (query) exportParams.set('search', query)

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Enquiries</h2>
          <p>
            {data.total} {data.total === 1 ? 'enquiry' : 'enquiries'} · {data.unread} unread
          </p>
        </div>
        <a className="btn btn-primary" href={apiUrl(`/enquiries/export?${exportParams}`)}>
          <Icon name="download" size={18} /> Export to Excel
        </a>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search name, email, company, product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search enquiries"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by status"
        >
          <option value="all">All</option>
          <option value="unread">Unread only</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 12 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Category</th>
                <th>Received</th>
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
              {!loading && data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    No enquiries found.
                  </td>
                </tr>
              )}
              {data.items.map((q) => (
                <tr key={q.id} className={q.is_read ? '' : 'unread'}>
                  <td className="strong">
                    {q.name} {!q.is_read && <span className="badge badge-green">New</span>}
                  </td>
                  <td>{q.email}</td>
                  <td>{q.company || '—'}</td>
                  <td>{q.category || q.product || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(q.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn view" aria-label="View enquiry" onClick={() => open(q)}>
                        <Icon name="eye" size={17} />
                      </button>
                      <button className="icon-btn danger" aria-label="Delete enquiry" onClick={() => setToDelete(q)}>
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <span>
            Page {data.page || 1} of {data.pages}
          </span>
          <div className="pager-btns">
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn btn-outline btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <Modal title="Enquiry details" onClose={() => setSelected(null)}>
          <dl className="detail-grid">
            <dt>Name</dt>
            <dd>{selected.name}</dd>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${selected.email}`}>{selected.email}</a>
            </dd>
            <dt>Phone</dt>
            <dd>{selected.phone || '—'}</dd>
            <dt>Company</dt>
            <dd>{selected.company || '—'}</dd>
            <dt>Category</dt>
            <dd>{selected.category || '—'}</dd>
            <dt>Products</dt>
            <dd>{selected.product || '—'}</dd>
            <dt>Quantity</dt>
            <dd>{selected.quantity || '—'}</dd>
            <dt>Destination</dt>
            <dd>{selected.country || '—'}</dd>
            <dt>Delivery terms</dt>
            <dd>{selected.delivery_terms || '—'}</dd>
            <dt>Received</dt>
            <dd>{fmtDate(selected.created_at)}</dd>
            <dt>Message</dt>
            <dd>{selected.message}</dd>
          </dl>
          <div className="form-actions" style={{ marginTop: 20 }}>
            <button
              className="btn btn-outline"
              onClick={async () => {
                await toggleRead({ ...selected, is_read: true })
                setSelected(null)
              }}
            >
              Mark as unread
            </button>
            <button className="btn btn-primary" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {toDelete && (
        <Modal title="Delete enquiry" onClose={() => setToDelete(null)}>
          <p style={{ marginTop: 0 }}>
            Delete the enquiry from <strong>{toDelete.name}</strong>? This cannot be undone.
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
