import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'

export default function Faq({ data }) {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="s-section s-faq">
      <div className="s-container s-faq-wrap">
        <Reveal className="s-center">
          <p className="s-eyebrow-green">{data.eyebrow}</p>
          <h2 className="s-title">{data.heading}</h2>
          <p className="s-lead">{data.description}</p>
        </Reveal>

        <div className="s-faq-list">
          {data.items.map((q, i) => {
            const isOpen = open === i
            return (
              <Reveal className={`s-faq-item${isOpen ? ' open' : ''}`} delay={i * 60} key={i}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{q.question}</span>
                  <ChevronDown size={22} />
                </button>
                <div className="s-faq-answer" id={`faq-${i}`} role="region">
                  <div>
                    <p>{q.answer}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
