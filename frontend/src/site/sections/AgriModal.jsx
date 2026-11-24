import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { AgriIcon } from '../../agriIcons.jsx'
import SmartLink from '../components/SmartLink.jsx'

// Rows of three cards; a short last row (1 or 2 cards) stretches to fill the width.
function spanFor(i, total) {
  const rest = total % 3
  if (rest !== 0 && i >= total - rest) return rest === 2 ? 'span-3' : 'span-6'
  return 'span-2'
}

// Popup opened by any link to #agri-popup (e.g. the "Explore Agricultural Products" button).
export default function AgriModal({ data }) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef(null)
  const lastFocus = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onOpen = () => {
      lastFocus.current = document.activeElement
      setOpen(true)
    }
    window.addEventListener('open-agri-popup', onOpen)
    return () => window.removeEventListener('open-agri-popup', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lastFocus.current?.focus?.()
    }
  }, [open, close])

  if (!open || !data) return null

  return (
    <div className="s-modal" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="s-modal-panel" role="dialog" aria-modal="true" aria-labelledby="agri-popup-title">
        <button ref={closeRef} type="button" className="s-modal-close" onClick={close} aria-label="Close">
          <X size={20} />
        </button>

        <div className="s-modal-banner" style={data.banner_image ? { '--agri-bg': `url(${data.banner_image})` } : undefined}>
          {data.banner_image && data.banner_alt && <div className="s-bg-alt" role="img" aria-label={data.banner_alt} />}
          <div className="s-modal-banner-text">
            {data.eyebrow && <p className="s-modal-eyebrow">{data.eyebrow}</p>}
            <h2 id="agri-popup-title">{data.heading}</h2>
            {data.intro && <p>{data.intro}</p>}
          </div>
        </div>

        <ul className="s-agri-grid">
          {data.cards.map((c, i) => (
            <li key={i} className={`s-agri-cell ${spanFor(i, data.cards.length)}`}>
              <SmartLink href={c.url || '#'} className="s-agri-card" aria-label={c.title} onClick={close}>
                <span className="s-agri-photo">{c.image && <img src={c.image} alt={c.image_alt || c.title} loading="lazy" />}</span>
                <span className="s-agri-label">
                  <span className="s-agri-title">
                    <AgriIcon name={c.icon} size={15} />
                    {c.title}
                  </span>
                  <span className="s-agri-go" aria-hidden="true">
                    <ArrowRight size={14} />
                  </span>
                </span>
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
