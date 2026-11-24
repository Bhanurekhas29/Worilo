import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { adminApi } from '../api.js'
import { setFavicon } from '../../favicon.js'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { pageTitle } from '../navigation.js'
import './AdminLayout.css'
import '../admin-ui.css'

export const ADMIN_TAB_TITLE = 'Worilo | Admin Panel'

export default function AdminLayout() {
  const { pathname } = useLocation()
  const [admin, setAdmin] = useState(null)
  const [state, setState] = useState('loading') // loading | ok | denied
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = ADMIN_TAB_TITLE
    adminApi
      .me()
      .then((data) => {
        setAdmin(data.admin)
        setState('ok')
        // Use the brand favicon on the admin tab too
        adminApi
          .get('/settings/brand')
          .then(({ data: brand }) => setFavicon(brand.favicon || brand.header_logo))
          .catch(() => {})
      })
      .catch(() => setState('denied'))
  }, [])

  useEffect(() => setMenuOpen(false), [pathname])

  if (state === 'loading') return null
  if (state === 'denied') return <Navigate to="/admin/login" replace />

  return (
    <div className="admin-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} admin={admin} />
      <div className="admin-main">
        <Topbar title={pageTitle(pathname)} admin={admin} onMenu={() => setMenuOpen(true)} />
        <main className="admin-content">
          <Outlet context={{ admin, setAdmin }} />
        </main>
      </div>
    </div>
  )
}
