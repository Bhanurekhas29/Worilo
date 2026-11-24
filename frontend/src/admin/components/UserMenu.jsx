import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import Icon from './Icons.jsx'

// Profile dropdown in the top bar: account links + log out.
export default function UserMenu({ admin, onLogout }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)
  const displayName = admin.name || admin.username
  const role = admin.is_super ? 'Super Admin' : 'Admin'

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

  const close = () => setOpen(false)

  return (
    <div className="user-wrap" ref={wrap}>
      <button type="button" className="user-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        <Avatar admin={admin} />
        <span className="admin-user-text">
          <strong>{displayName}</strong>
          <span>{role}</span>
        </span>
        <Icon name="down" size={18} />
      </button>

      {open && (
        <div className="user-panel" role="menu">
          <div className="user-card">
            <Avatar admin={admin} size={56} />
            <div>
              <strong>{displayName}</strong>
              <small>{admin.email}</small>
              <span className="badge badge-navy">{role}</span>
            </div>
          </div>

          <Link to="/admin/account" role="menuitem" onClick={close}>
            <Icon name="settings" size={18} /> Account settings
          </Link>
          <div className="user-sep" />
          <button
            type="button"
            role="menuitem"
            className="user-logout"
            onClick={() => {
              close()
              onLogout()
            }}
          >
            <Icon name="logout" size={18} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}
