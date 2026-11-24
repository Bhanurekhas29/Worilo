import { ArrowRight, Globe } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import SmartLink from '../components/SmartLink.jsx'

export default function Markets({ data }) {
  return (
    <section id="markets" className="s-section s-dark s-markets">
      <div className="s-container s-markets-grid">
        <div>
          <Reveal>
            <p className="s-eyebrow-plain">{data.eyebrow}</p>
            <h2 className="s-title s-title-light">{data.heading}</h2>
            <p className="s-lead-light">{data.description}</p>
          </Reveal>
          <ul className="s-chips">
            {data.markets.map((m, i) => (
              <Reveal as="li" delay={i * 70} key={m.name} title={m.tooltip || undefined}>
                <Globe size={20} /> {m.name}
              </Reveal>
            ))}
          </ul>
          {data.button_label && (
            <Reveal>
              <SmartLink href={data.button_url} className="s-btn s-btn-green">
                {data.button_label} <ArrowRight size={18} />
              </SmartLink>
            </Reveal>
          )}
        </div>
        <Reveal direction="right" className="s-map">
          {data.image && <img src={data.image} alt={data.image_alt || 'World map showing global sourcing routes'} loading="lazy" />}
        </Reveal>
      </div>
    </section>
  )
}
