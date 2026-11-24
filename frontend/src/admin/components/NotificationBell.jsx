import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../api.js'
import { getNotifySettings, playChime } from '../notifySettings.js'
import Icon from './Icons.jsx'

const POLL_MS = 20000
const SEEN_KEY = 'worilo_last_enquiry_id'

function timeAgo(s) {
  const secs = Math.max(0, (Date.now() - new Date(s.replace(' ', 'T')).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)} h ago`
  return `${Math.floor(secs / 86400)} d ago`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [data, setData] = useState({ items: [], unread: 0 })
  const [open, setOpen] = useState(false)
  const [ringing, setRinging] = useState(false)
  const wrap = useRef(null)
  const lastId = useRef(Number(sessionStorage.getItem(SEEN_KEY)) || null)

  const alertNew = useCallback((fresh) => {
    const prefs = getNotifySettings()
    setRinging(true)
    setTimeout(() => setRinging(false), 1600)
    if (prefs.sound) playChime(prefs.volume)
    if (prefs.desktop && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
      const first = fresh[0]
      const n = new Notification('New quote request', {
        body: fresh.length > 1 ? `${fresh.length} new enquiries received` : `${first.name}${first.category ? ` · ${first.category}` : ''}`,
        icon: '/images/favicon.png',
        tag: 'worilo-enquiry',
      })
      n.onclick = () => {
        window.focus()
        navigate('/admin/enquiries')
      }
    }
  }, [navigate])

  const poll = useCallback(async () => {
    try {
      const d = await adminApi.get('/enquiries?status=unread&per_page=5&page=1')
      setData({ items: d.items, unread: d.unread })
      const newest = d.items[0]?.id ?? 0
      if (lastId.current === null) {
        lastId.current = newest // first load: don't ring for what is already there
      } else if (newest > lastId.current) {
        alertNew(d.items.filter((i) => i.id > lastId.current))
        lastId.current = newest
      }
      sessionStorage.setItem(SEEN_KEY, String(lastId.current ?? 0))
    } catch {
      /* offline or session ended: try again on the next tick */
    }
  }, [alertNew])

  useEffect(() => {
    poll()
    const t = setInterval(() => !document.hidden && poll(), POLL_MS)
    const onVisible = () => !document.hidden && poll()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [poll])

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return
    const onDown = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function markAllRead() {
    await adminApi.put('/enquiries?all=1', { is_read: true }).catch(() => {})
    poll()
  }

  return (
    <div className="bell-wrap" ref={wrap}>
      <button
        type="button"
        className={`bell-btn${ringing ? ' ringing' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Icon name="bell" size={22} />
        {data.unread > 0 && <span className="bell-badge">{data.unread > 99 ? '99+' : data.unread}</span>}
      </button>

      {open && (
        <div className="bell-panel" role="dialog" aria-label="Notifications">
          <div className="bell-head">
            <strong>Notifications</strong>
            {data.unread > 0 && (
              <button type="button" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          {data.items.length === 0 ? (
            <div className="bell-empty">
              <Icon name="check" size={28} />
              <p>You're all caught up.</p>
            </div>
          ) : (
            <ul>
              {data.items.map((n) => (
                <li key={n.id}>
                  <Link to="/admin/enquiries" onClick={() => setOpen(false)}>
                    <span className="bell-dot" />
                    <span>
                      <strong>New quote request from {n.name}</strong>
                      <small>
                        {[n.category, n.product].filter(Boolean).join(' · ') || n.email} · {timeAgo(n.created_at)}
                      </small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="bell-foot">
            <Link to="/admin/enquiries" onClick={() => setOpen(false)}>
              View all enquiries
            </Link>
            <Link to="/admin/account#notifications" onClick={() => setOpen(false)} aria-label="Notification settings">
              <Icon name="settings" size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
