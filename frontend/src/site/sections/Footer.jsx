import { MessageSquare } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import SmartLink, { formatPhone } from '../components/SmartLink.jsx'

export default function Footer({ site }) {
  const { brand, footer, quote, credits } = site
  const phoneDigits = `${quote.phone.country_code}${quote.phone.number}`
  const logo = brand.footer_logo || brand.header_logo

  return (
    <footer className="s-footer">
      <div className="s-container">
        <div className="s-footer-grid">
          <Reveal className="s-footer-brand">
            <div className="s-footer-logo">
              {logo && (
                <span className="s-footer-logo-tile">
                  <img src={logo} alt={`${brand.company_name} logo, India sourcing agent for agricultural products, industrial chemicals and automotive components`} />
                </span>
              )}
              <span>
                <strong>{brand.company_name}</strong>
                <small>{footer.tagline}</small>
              </span>
            </div>
            <p>{footer.description}</p>
            {footer.chat_show && (
              <a className="s-btn s-btn-green" href={`https://wa.me/${phoneDigits}${site.floating?.whatsapp?.message ? `?text=${encodeURIComponent(site.floating.whatsapp.message)}` : ''}`} target="_blank" rel="noreferrer">
                <MessageSquare size={18} /> {footer.chat_label}
              </a>
            )}
          </Reveal>

          {footer.columns.map((col, ci) => (
            <Reveal as="nav" delay={(ci + 1) * 120} className="s-footer-col" key={col.title} aria-label={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <SmartLink href={l.url}>{l.label}</SmartLink>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}

          <Reveal className="s-footer-col" delay={(footer.columns.length + 1) * 120}>
            <h4>Contact Us</h4>
            <ul>
              <li>
                <a href={`mailto:${quote.email}`}>{quote.email}</a>
              </li>
              <li>
                <a href={`tel:+${phoneDigits}`}>
                  {formatPhone(quote.phone.country_code, quote.phone.number)} (Mobile / WhatsApp)
                </a>
              </li>
              <li className="muted">{quote.origin_country}</li>
            </ul>
          </Reveal>
        </div>

        <div className="s-footer-bottom">
          <span>
            © {new Date().getFullYear()} {footer.copyright}
          </span>
          {footer.bottom_text && <span>{footer.bottom_text}</span>}
        </div>

        {credits.show_credit && (
          <div className="s-footer-credit">
            {credits.credit_text}{' '}
            {credits.credit_url ? (
              <a href={credits.credit_url} target="_blank" rel="noreferrer">
                {credits.credit_name}
              </a>
            ) : (
              <strong>{credits.credit_name}</strong>
            )}
          </div>
        )}
      </div>
    </footer>
  )
}
