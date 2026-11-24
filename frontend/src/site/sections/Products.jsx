import { ArrowRight, CircleCheck, FlaskConical } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import SmartLink from '../components/SmartLink.jsx'

const pad = (n) => String(n).padStart(2, '0')

export default function Products({ data }) {
  return (
    <section id="products" className="s-section s-products">
      <div className="s-container">
        <Reveal as="h2" className="s-title s-center">
          {data.heading_line1}
          {data.heading_line2 && (
            <>
              <br />
              {data.heading_line2}
            </>
          )}
        </Reveal>

        <div className="s-cats">
          {data.categories.map((c, i) => (
            <article className={`s-cat${i % 2 === 1 ? ' flip' : ''}`} key={i}>
              <Reveal direction={i % 2 === 1 ? 'right' : 'left'} className="s-cat-media">
                <div className="s-cat-img">
                  {c.image && <img src={c.image} alt={c.image_alt || c.title} loading="lazy" />}
                  <div className="s-cat-caption">
                    <span>{c.items.length} Sourcing categories</span>
                    <FlaskConical size={18} />
                  </div>
                </div>
              </Reveal>
              <Reveal direction={i % 2 === 1 ? 'left' : 'right'} delay={120} className="s-cat-body">
                <p className="s-cat-no">
                  {pad(i + 1)} — {c.title}
                </p>
                <h3>{c.title}</h3>
                <p className="s-cat-desc">{c.description}</p>
                <ul className="s-checks s-stagger">
                  {c.items.map((t, n) => (
                    <li key={t} style={{ '--i': n }}>
                      <CircleCheck size={22} /> {t}
                    </li>
                  ))}
                </ul>
                <SmartLink href={c.button_url} className="s-btn s-btn-green">
                  {c.button_label} <ArrowRight size={18} />
                </SmartLink>
              </Reveal>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
