import { ArrowRight } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import SmartLink from '../components/SmartLink.jsx'

const pad = (n) => String(n).padStart(2, '0')

export default function Process({ data }) {
  return (
    <section id="process" className="s-section s-dark s-process">
      <div className="s-container">
        <Reveal className="s-process-head">
          <div>
            <p className="s-eyebrow-plain">{data.eyebrow}</p>
            <h2 className="s-title s-title-light">{data.heading}</h2>
            <p className="s-lead-light">{data.description}</p>
          </div>
          {data.button_label && (
            <SmartLink href={data.button_url} className="s-btn s-btn-green">
              {data.button_label} <ArrowRight size={18} />
            </SmartLink>
          )}
        </Reveal>

        <div className="s-steps">
          {data.steps.map((s, i) => (
            <Reveal className="s-step" delay={(i % 2) * 120} key={i}>
              <span>{pad(i + 1)}</span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
