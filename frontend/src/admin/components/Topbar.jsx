import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api.js'
import Avatar from './Avatar.jsx'
import Icon from './Icons.jsx'
import Modal from './Modal.jsx'
import NotificationBell from './NotificationBell.jsx'
import UserMenu from './UserMenu.jsx'

export default function Topbar({ title, admin, onMenu }) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    setLoggingOut(true)
    await adminApi.logout().catch(() => {})
    navigate('/admin/login', { replace: true })
  }

  const displayName = admin.name || admin.username

  return (
    <header className="admin-topbar">
      <button className="admin-menu-btn" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" size={24} />
      </button>
      <h1 className="admin-topbar-title">{title}</h1>

      <div className="admin-user">
        <NotificationBell />
        <UserMenu admin={admin} onLogout={() => setConfirming(true)} />
      </div>

      {confirming && (
        <Modal title="Log out?" onClose={() => !loggingOut && setConfirming(false)}>
          <div className="logout-hero">
            <span className="logout-icon" aria-hidden="true">
              <Icon name="logout" size={30} />
            </span>
            <p className="logout-text">
              You'll be signed out of the Worilo admin panel and will need to log in again to make changes.
            </p>
            <div className="logout-user">
              <Avatar admin={admin} />
              <span>
                <strong>{displayName}</strong>
                <small>{admin.is_super ? 'Super Admin' : 'Admin'} · {admin.email}</small>
              </span>
            </div>
          </div>
          <div className="form-actions logout-actions">
            <button type="button" className="btn btn-danger" onClick={logout} disabled={loggingOut}>
              <Icon name={loggingOut ? 'spinner' : 'logout'} size={18} /> {loggingOut ? 'Logging out…' : 'Yes, log out'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setConfirming(false)} disabled={loggingOut}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </header>
  )
}
