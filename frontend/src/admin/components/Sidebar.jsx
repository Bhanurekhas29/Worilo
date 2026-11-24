import { NavLink } from 'react-router-dom'
import Icon from './Icons.jsx'
import { navItems } from '../navigation.js'

export default function Sidebar({ open, onClose, admin }) {
  const items = navItems.filter((i) => !i.superOnly || admin.is_super)

  return (
    <>
      <div className={`admin-backdrop${open ? ' is-open' : ''}`} onClick={onClose} />
      <aside className={`admin-sidebar${open ? ' is-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-logo" aria-hidden="true">
            W
          </div>
          <div className="admin-brand-text">
            <strong>Worilo</strong>
            <span>Admin Panel</span>
          </div>
          <button className="admin-sidebar-close" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>

        <nav className="admin-nav">
          {items.map((item) => {
            if (item.group) {
              return (
                <div key={item.group} className="admin-nav-group">
                  {item.group}
                </div>
              )
            }
            if (item.href) {
              return (
                <a key={item.href} className="admin-nav-link" href={item.href} target="_blank" rel="noreferrer">
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </a>
              )
            }
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="admin-nav-link">
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
