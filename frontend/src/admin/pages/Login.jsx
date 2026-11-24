import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api.js'
import Icon from '../components/Icons.jsx'
import './Login.css'

const LOGO = '/images/logo.png'

const FEATURES = [
  'Edit every section of the website',
  'Manage menus, SEO and branding',
  'Review and export quote enquiries',
]

export default function Login() {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Worilo | Admin Panel'
    // Already signed in? Skip the form.
    adminApi
      .me()
      .then(() => navigate('/admin', { replace: true }))
      .catch(() => {})
  }, [navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminApi.login(login.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
      setShake(true)
      setLoading(false)
    }
  }

  return (
    <main className="lg-page">
      <section className="lg-side">
        <span className="lg-blob lg-blob-1" />
        <span className="lg-blob lg-blob-2" />
        <span className="lg-ring" />
        <span className="lg-ring lg-ring-2" />
        <span className="lg-dots" />

        <div className="lg-side-inner">
          <div className="lg-brand">
            <span className="lg-logo-tile">
              <img src={LOGO} alt="Worilo logo" />
            </span>
            <span className="lg-brand-name">Worilo</span>
          </div>
          <h2>
            Run your sourcing website <em>with ease.</em>
          </h2>
          <p className="lg-tagline">Direct sourcing. Better value. Global reach.</p>
          <ul className="lg-features">
            {FEATURES.map((f, i) => (
              <li key={f} style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
                <Icon name="check" size={20} /> {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lg-main">
        <span className="lg-blob lg-blob-m1" />
        <span className="lg-blob lg-blob-m2" />
        <form
          className={`lg-card${shake ? ' shake' : ''}`}
          onSubmit={onSubmit}
          onAnimationEnd={(e) => e.animationName === 'lg-shake' && setShake(false)}
          noValidate
        >
          <div className="lg-card-head">
            <span className="lg-mobile-logo">
              <img src={LOGO} alt="Worilo logo" />
            </span>
            <h1>Welcome back</h1>
            <p>Sign in to the Worilo admin panel</p>
          </div>

          {error && (
            <div className="lg-error" role="alert">
              <Icon name="alert" size={18} /> {error}
            </div>
          )}

          <div className="lg-field" style={{ animationDelay: '0.45s' }}>
            <label htmlFor="login">Username or email</label>
            <div className="lg-input">
              <Icon name="user" size={18} />
              <input
                id="login"
                type="text"
                autoComplete="username"
                placeholder="admin"
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value)
                  setError('')
                }}
                autoFocus
              />
            </div>
          </div>

          <div className="lg-field" style={{ animationDelay: '0.55s' }}>
            <label htmlFor="password">Password</label>
            <div className="lg-input">
              <Icon name="lock" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
              />
              <button
                type="button"
                className="lg-eye"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'eyeoff' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          <button type="submit" className="lg-submit" disabled={loading || !login || !password} style={{ animationDelay: '0.65s' }}>
            {loading ? (
              <>
                <Icon name="spinner" size={20} /> Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>

          <p className="lg-foot">© {new Date().getFullYear()} Worilo. Authorised users only.</p>
        </form>
      </section>
    </main>
  )
}
