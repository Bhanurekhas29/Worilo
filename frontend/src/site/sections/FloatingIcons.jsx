import { Mail, PhoneCall } from 'lucide-react'

// WhatsApp-style mark: speech bubble with a handset inside.
function WhatsAppGlyph({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 21l1.65-4.9A9 9 0 1 1 8 19.5L3 21z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M9.2 7.4c-.55.5-.75 1.3-.45 2.2.9 2.5 3.2 4.5 5.8 5.2.8.2 1.5-.1 2-.6l.25-.85-2.05-1-.9.8c-1.1-.4-2.2-1.5-2.7-2.6l.8-.9-.9-2.1z" fill="currentColor" />
    </svg>
  )
}

export default function FloatingIcons({ data }) {
  const wa = data.whatsapp
  const ph = data.phone
  const em = data.email
  if (!wa.show && !ph.show && !em.show) return null

  const waNumber = `${wa.phone.country_code}${wa.phone.number}`
  const waText = wa.message ? `?text=${encodeURIComponent(wa.message)}` : ''

  return (
    <div className={`s-floating ${data.side === 'left' ? 'left' : 'right'}`}>
      {wa.show && wa.phone.number && (
        <a className="s-float whatsapp" href={`https://wa.me/${waNumber}${waText}`} target="_blank" rel="noreferrer" aria-label="Chat with WORILO on WhatsApp">
          <WhatsAppGlyph size={32} />
        </a>
      )}
      {ph.show && ph.phone.number && (
        <a className="s-float phone" href={`tel:+${ph.phone.country_code}${ph.phone.number}`} aria-label="Call WORILO">
          <PhoneCall size={26} />
        </a>
      )}
      {em.show && em.address && (
        <a className="s-float mail" href={`mailto:${em.address}`} aria-label="Email WORILO">
          <Mail size={24} />
        </a>
      )}
    </div>
  )
}
