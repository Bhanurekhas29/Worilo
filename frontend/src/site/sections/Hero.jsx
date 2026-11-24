import { ArrowRight } from 'lucide-react'
import { HighlightIcon } from '../../admin/components/Icons.jsx'
import SmartLink from '../components/SmartLink.jsx'

export default function Hero({ data }) {
  const bg = data.background_image
  return (
    <section id="home" className="s-hero" style={bg ? { '--hero-bg': `url(${bg})` } : undefined}>
      {bg && data.image_alt && <div className="s-bg-alt" role="img" aria-label={data.image_alt} />}
      <div className="s-container s-hero-inner">
        <p className="s-eyebrow s-rise" style={{ animationDelay: '0.1s' }}>
          <span className="s-eyebrow-line" /> {data.eyebrow}
        </p>
        <h1 className="s-hero-title s-rise" style={{ animationDelay: '0.2s' }}>
          {data.heading}
        </h1>
        <p className="s-hero-sub s-rise" style={{ animationDelay: '0.35s' }}>
          {data.subheading}
        </p>
        <p className="s-hero-desc s-rise" style={{ animationDelay: '0.45s' }}>
          {data.description}
        </p>
        <div className="s-hero-btns s-rise" style={{ animationDelay: '0.55s' }}>
          <SmartLink href={data.primary_url} className="s-btn s-btn-green">
            {data.primary_label} <ArrowRight size={18} />
          </SmartLink>
          {data.secondary_label && (
            <SmartLink href={data.secondary_url} className="s-btn s-btn-outline-light">
              {data.secondary_label}
            </SmartLink>
          )}
        </div>
        {data.highlights.length > 0 && (
          <ul className="s-hero-highlights s-rise" style={{ animationDelay: '0.7s' }}>
            {data.highlights.map((h, i) => (
              <li key={i}>
                <HighlightIcon name={h.icon} size={20} /> {h.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
