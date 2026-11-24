import { Link } from 'react-router-dom'

// "+91 70109 45812" style: groups of 5 digits.
export function formatPhone(code, number) {
  return `+${code} ${String(number).replace(/(\d{5})(?=\d)/g, '$1 ')}`
}

export function scrollToSection(id) {
  if (window.location.pathname !== '/') {
    window.location.assign(id ? `/#${id}` : '/')
    return
  }
  if (!id) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    history.replaceState(null, '', window.location.pathname)
    return
  }
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
}

// Works for in-page anchors (#products), site paths (/privacy) and full URLs.
export default function SmartLink({ href = '#', children, onClick, ...rest }) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" onClick={onClick} {...rest}>
        {children}
      </a>
    )
  }
  if (href === '/' || href.startsWith('#')) {
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault()
          scrollToSection(href === '/' ? '' : href.slice(1))
          onClick?.()
        }}
        {...rest}
      >
        {children}
      </a>
    )
  }
  return (
    <Link to={href} onClick={onClick} {...rest}>
      {children}
    </Link>
  )
}
