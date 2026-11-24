import { useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import SmartLink from '../components/SmartLink.jsx'

// Highlights the menu item whose section is currently on screen.
function useActiveSection(ids) {
  const [active, setActive] = useState('')
  useEffect(() => {
    const onScroll = () => {
      // The linked section nearest above the viewport top wins, whatever order the menu lists them in.
      const y = window.scrollY + 140
      let current = ''
      let best = -1
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= y && el.offsetTop > best) {
          best = el.offsetTop
          current = id
        }
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ids.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
  return active
}

export default function Navbar({ site }) {
  const { brand, menu, cta, footer } = site
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const ids = menu.filter((m) => m.url.startsWith('#')).map((m) => m.url.slice(1))
  const active = useActiveSection(ids)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isActive = (url) => (url === '/' ? active === '' : url === `#${active}`)

  return (
    <header className={`s-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="s-nav-inner">
        <SmartLink href="/" className="s-logo" onClick={() => setOpen(false)}>
          {brand.header_logo && <img src={brand.header_logo} alt={`${brand.company_name} logo, India sourcing agent for agricultural products, industrial chemicals and automotive components`} />}
          <span>
            <strong>{brand.company_name}</strong>
            <small>{footer.tagline}</small>
          </span>
        </SmartLink>

        <nav className={`s-menu${open ? ' open' : ''}`} aria-label="Main">
          {menu.map((m) => (
            <SmartLink key={m.id} href={m.url} className={isActive(m.url) ? 'active' : ''} onClick={() => setOpen(false)}>
              {m.label}
            </SmartLink>
          ))}
          {cta.show && (
            <SmartLink href={cta.url} className="s-btn s-btn-navy s-menu-cta" onClick={() => setOpen(false)}>
              {cta.label} <ArrowRight size={18} />
            </SmartLink>
          )}
        </nav>

        {cta.show && (
          <SmartLink href={cta.url} className="s-btn s-btn-navy s-nav-cta">
            {cta.label} <ArrowRight size={18} />
          </SmartLink>
        )}

        <button className="s-burger" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
    </header>
  )
}
