import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import useSite from './useSite.js'
import { setFavicon } from '../favicon.js'
import { AgriIcon } from '../agriIcons.jsx'
import Navbar from './sections/Navbar.jsx'
import Quote from './sections/Quote.jsx'
import Footer from './sections/Footer.jsx'
import FloatingIcons from './sections/FloatingIcons.jsx'
import Reveal from './components/Reveal.jsx'
import SmartLink from './components/SmartLink.jsx'
import ScrollEffects from './components/ScrollEffects.jsx'
import { setMeta } from './SitePage.jsx'
import './site.css'

// Rows of three cards; a short last row (1 or 2 cards) stretches to fill the width.
function spanFor(i, total) {
  const rest = total % 3
  const lastRowStart = total - rest
  if (rest !== 0 && i >= lastRowStart) return rest === 2 ? 'span-3' : 'span-6'
  return 'span-2'
}

export default function AgriProductsPage() {
  const { site, error } = useSite()

  useEffect(() => {
    if (!site) return
    const { agripage: p, brand } = site
    document.title = p.seo_title
    setMeta('description', p.seo_description)
    setFavicon(brand.favicon || brand.header_logo)
    window.scrollTo(0, 0)
  }, [site])

  if (error) {
    return (
      <div className="s-state">
        <h1>We couldn't load the page</h1>
        <p>{error}. Please refresh the page.</p>
      </div>
    )
  }
  if (!site) {
    return (
      <div className="s-state" aria-busy="true">
        <span className="s-spinner" />
      </div>
    )
  }

  const p = site.agripage
  return (
    <div className="site">
      <Navbar site={site} />
      <main>
        <section className="s-agri-banner" style={p.banner_image ? { '--agri-bg': `url(${p.banner_image})` } : undefined}>
          {p.banner_image && p.banner_alt && <div className="s-bg-alt" role="img" aria-label={p.banner_alt} />}
          <div className="s-container s-agri-banner-inner">
            {p.eyebrow && (
              <p className="s-eyebrow s-rise">
                <span className="s-eyebrow-line" /> {p.eyebrow}
              </p>
            )}
            <h1 className="s-hero-title s-rise" style={{ animationDelay: '0.1s' }}>
              {p.heading}
            </h1>
            {p.intro && (
              <p className="s-hero-desc s-rise" style={{ animationDelay: '0.2s' }}>
                {p.intro}
              </p>
            )}
          </div>
        </section>

        <section className="s-agri" id="agri-products">
          <div className="s-container">
            <ul className="s-agri-grid">
              {p.cards.map((c, i) => (
                <Reveal as="li" key={i} delay={(i % 3) * 90} className={`s-agri-cell ${spanFor(i, p.cards.length)}`}>
                  <SmartLink href={c.url || '#'} className="s-agri-card" aria-label={c.title}>
                    <span className="s-agri-photo">
                      {c.image && <img src={c.image} alt={c.image_alt || c.title} loading="lazy" />}
                    </span>
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
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <Quote data={site.quote} waMessage={site.floating?.whatsapp?.message} />
      </main>
      <Footer site={site} />
      <FloatingIcons data={site.floating} />
      <ScrollEffects />
    </div>
  )
}
