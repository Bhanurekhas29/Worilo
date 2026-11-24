import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { adminApi } from '../api.js'
import Icon from '../components/Icons.jsx'
import { navItems } from '../navigation.js'
import './Dashboard.css'

const PALETTE = ['#22c55e', '#0a1f3c', '#185fa5', '#d9a93a', '#94a3b8', '#a32d2d']
// Icon + colour for each kind of activity
const ACTIVITY = {
  login: ['account', 'navy'],
  content: ['edit', 'green'],
  user: ['users', 'blue'],
  enquiry: ['inbox', 'gold'],
  account: ['account', 'navy'],
  security: ['shield', 'red'],
}

const QUICK = ['/admin/hero', '/admin/products', '/admin/menu-cta', '/admin/brand', '/admin/seo', '/admin/quote-form', '/admin/footer', '/admin/users']

const parse = (s) => new Date(s.replace(' ', 'T'))
const dayLabel = (iso) => parse(`${iso} 00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

function timeAgo(s) {
  const secs = Math.max(0, (Date.now() - parse(s).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)} h ago`
  return `${Math.floor(secs / 86400)} d ago`
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/* ---------- Stat card ---------- */
function Stat({ to, icon, tone, label, value, children }) {
  return (
    <Link to={to} className="stat-card">
      <span className={`stat-icon ${tone}`}>
        <Icon name={icon} size={24} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <div className="stat-sub">{children}</div>
      </div>
    </Link>
  )
}

/* ---------- Bar chart (plain SVG, no library) ---------- */
function BarChart({ data }) {
  const W = 640
  const H = 300
  const L = 34
  const B = 30
  const T = 12
  const max = Math.max(...data.map((d) => d.count), 1)
  const top = max <= 4 ? 4 : Math.ceil(max / 4) * 4
  const plotH = H - B - T
  const slot = (W - L - 8) / data.length
  const barW = Math.min(26, slot * 0.62)
  const y = (v) => T + plotH - (v / top) * plotH
  const ticks = [0, top / 2, top]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Enquiries per day over the last 14 days" className="bar-chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - 8} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? '0' : '4 4'} />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = L + i * slot + (slot - barW) / 2
        const h = (d.count / top) * plotH
        const isToday = i === data.length - 1
        return (
          <g key={d.date} className="bar">
            <rect x={L + i * slot} y={T} width={slot} height={plotH} fill="transparent" />
            <rect x={x} y={y(d.count)} width={barW} height={Math.max(h, d.count ? 3 : 0)} rx="6" fill={isToday ? '#0a1f3c' : '#22c55e'}>
              <title>{`${dayLabel(d.date)}: ${d.count} enquir${d.count === 1 ? 'y' : 'ies'}`}</title>
            </rect>
            {d.count > 0 && (
              <text x={x + barW / 2} y={y(d.count) - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0a1f3c">
                {d.count}
              </text>
            )}
            {(i % 2 === 1 || i === data.length - 1) && (
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">
                {dayLabel(d.date)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* ---------- Donut ---------- */
function Donut({ items }) {
  const total = items.reduce((s, i) => s + i.count, 0)
  let acc = 0
  const stops = items.map((it, i) => {
    const from = (acc / total) * 100
    acc += it.count
    return `${PALETTE[i % PALETTE.length]} ${from}% ${(acc / total) * 100}%`
  })
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops.join(', ')})` }} role="img" aria-label="Enquiries by category">
        <div>
          <strong>{total}</strong>
          <small>total</small>
        </div>
      </div>
      <ul className="legend">
        {items.map((it, i) => (
          <li key={it.label}>
            <i style={{ background: PALETTE[i % PALETTE.length] }} />
            <span>{it.label}</span>
            <b>{it.count}</b>
            <em>{Math.round((it.count / total) * 100)}%</em>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Empty({ icon = 'inbox', children }) {
  return (
    <div className="dash-empty">
      <Icon name={icon} size={30} />
      <p>{children}</p>
    </div>
  )
}

export default function Dashboard() {
  const { admin } = useOutletContext()
  const [d, setD] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi
      .get('/dashboard')
      .then(setD)
      .catch((e) => setError(e.message))
  }, [])

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const quick = QUICK.map((to) => navItems.find((n) => n.to === to)).filter((n) => n && (!n.superOnly || admin.is_super))
  const c = d?.counts
  const doneCount = d?.checklist.filter((i) => i.done).length ?? 0

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h2>
            {greeting()}, {admin.name || admin.username} <span aria-hidden="true">👋</span>
          </h2>
          <p>{today} · Here's what's happening on your website.</p>
        </div>
        <div className="dash-actions">
          <a className="btn btn-outline btn-sm" href="/" target="_blank" rel="noreferrer">
            <Icon name="external" size={16} /> View website
          </a>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!d && !error && <p>Loading…</p>}

      {d && (
        <>
          <div className="dash-stats">
            <Stat to="/admin/enquiries" icon="inbox" tone="navy" label="Total enquiries" value={c.total}>
              <span>{c.last30} in the last 30 days</span>
            </Stat>
            <Stat to="/admin/enquiries" icon="bell" tone="green" label="Unread" value={c.unread}>
              <span>{c.unread ? 'Waiting for a reply' : "You're all caught up"}</span>
            </Stat>
            <Stat to="/admin/enquiries" icon="calendar" tone="blue" label="Last 7 days" value={c.last7}>
              {c.trend === null ? (
                <span>No earlier week to compare</span>
              ) : (
                <span className={`trend ${c.trend >= 0 ? 'up' : 'down'}`}>
                  <Icon name={c.trend >= 0 ? 'trendup' : 'trenddown'} size={14} /> {Math.abs(c.trend)}% vs previous week
                </span>
              )}
            </Stat>
            <Stat to="/admin/enquiries" icon="clock" tone="gold" label="Today" value={c.today}>
              <span>{c.today ? 'New today' : 'Nothing yet today'}</span>
            </Stat>
          </div>

          <div className="dash-grid wide-narrow">
            <section className="card dash-card">
              <header>
                <div>
                  <h3>Enquiries</h3>
                  <p>Last 14 days</p>
                </div>
              </header>
              {c.total === 0 ? <Empty>No enquiries yet. They'll appear here once visitors use the quote form.</Empty> : <BarChart data={d.daily} />}
            </section>

            <section className="card dash-card">
              <header>
                <div>
                  <h3>By category</h3>
                  <p>All time</p>
                </div>
              </header>
              {d.by_category.length === 0 ? <Empty icon="tags">No data yet.</Empty> : <Donut items={d.by_category} />}
            </section>
          </div>

          <div className="dash-grid wide-narrow">
            <section className="card dash-card">
              <header>
                <div>
                  <h3>Recent activities</h3>
                  <p>Logins, edits and new enquiries</p>
                </div>
              </header>
              {d.activities.length === 0 ? (
                <Empty icon="clock">No activity yet. Changes you and your team make will show up here.</Empty>
              ) : (
                <ul className="activity">
                  {d.activities.map((a) => {
                    const [icon, tone] = ACTIVITY[a.type] || ['edit', 'navy']
                    return (
                      <li key={a.id}>
                        <span className={`stat-icon ${tone}`}>
                          <Icon name={icon} size={18} />
                        </span>
                        <span className="activity-main">
                          <strong>{a.actor}</strong>
                          <small>{a.text}</small>
                        </span>
                        <span className="recent-time" title={parse(a.created_at).toLocaleString()}>
                          {timeAgo(a.created_at)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="card dash-card">
              <header>
                <div>
                  <h3>Quick links</h3>
                  <p>Jump to what you edit most</p>
                </div>
              </header>
              <div className="quick">
                {quick.map((n) => (
                  <Link key={n.to} to={n.to}>
                    <Icon name={n.icon} size={22} />
                    <span>{n.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="dash-grid three">
            <section className="card dash-card">
              <header>
                <div>
                  <h3>Setup checklist</h3>
                  <p>
                    {doneCount} of {d.checklist.length} done
                  </p>
                </div>
              </header>
              <div className="progress" aria-hidden="true">
                <span style={{ width: `${(doneCount / d.checklist.length) * 100}%` }} />
              </div>
              <ul className="checklist">
                {d.checklist.map((i) => (
                  <li key={i.key} className={i.done ? 'done' : ''}>
                    <Link to={i.to}>
                      <Icon name={i.done ? 'check' : 'circle'} size={20} />
                      <span>{i.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card dash-card">
              <header>
                <div>
                  <h3>Top destinations</h3>
                  <p>Where buyers want goods shipped</p>
                </div>
              </header>
              {d.destinations.length === 0 ? (
                <Empty icon="markets">No destinations yet.</Empty>
              ) : (
                <ul className="hbars">
                  {d.destinations.map((x) => (
                    <li key={x.label}>
                      <span>{x.label}</span>
                      <div>
                        <i style={{ width: `${(x.count / d.destinations[0].count) * 100}%` }} />
                      </div>
                      <b>{x.count}</b>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card dash-card">
              <header>
                <div>
                  <h3>At a glance</h3>
                  <p>Website and team</p>
                </div>
              </header>
              <ul className="glance">
                <li>
                  <span className="stat-icon green">
                    <Icon name="hero" size={20} />
                  </span>
                  <div>
                    <strong>
                      {d.sections_saved} of {d.sections_total}
                    </strong>
                    <small>sections customised (the rest use defaults)</small>
                  </div>
                </li>
                <li>
                  <span className="stat-icon blue">
                    <Icon name="users" size={20} />
                  </span>
                  <div>
                    <strong>
                      {d.admins.active} of {d.admins.total}
                    </strong>
                    <small>admin accounts active</small>
                  </div>
                </li>
                <li>
                  <span className="stat-icon navy">
                    <Icon name="clock" size={20} />
                  </span>
                  <div>
                    <strong>
                      {admin.last_login_at
                        ? parse(admin.last_login_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                        : '—'}
                    </strong>
                    <small>your last login</small>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
