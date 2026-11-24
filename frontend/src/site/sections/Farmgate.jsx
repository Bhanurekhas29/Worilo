import { ArrowRight } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import SmartLink from '../components/SmartLink.jsx'

const pad = (n) => String(n).padStart(2, '0')

export default function Farmgate({ data }) {
  return (
    <section id="about" className="s-section s-dark s-farmgate">
      <div className="s-container s-farm-grid">
        <Reveal direction="zoom" className="s-farm-media">
          <div className="s-farm-card">
            {data.image && <img src={data.image} alt={data.image_alt || data.heading} loading="lazy" />}
            {data.image_caption && <p>{data.image_caption}</p>}
          </div>
        </Reveal>

        <div className="s-farm-body">
          <Reveal>
            <p className="s-eyebrow-plain">{data.eyebrow}</p>
            <h2 className="s-title s-title-light">{data.heading}</h2>
            <p className="s-farm-sub">{data.subheading}</p>
            <p className="s-lead-light">{data.description}</p>
          </Reveal>

          <div className="s-farm-cards">
            {data.cards.map((c, i) => (
              <Reveal className="s-farm-item" delay={i * 100} key={i}>
                <span>{pad(i + 1)}</span>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
              </Reveal>
            ))}
          </div>

          {(data.button_label || data.note) && (
            <Reveal className="s-farm-foot">
              {data.button_label && (
                <SmartLink href={data.button_url} className="s-btn s-btn-green">
                  {data.button_label} <ArrowRight size={18} />
                </SmartLink>
              )}
              {data.note && <p>{data.note}</p>}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
