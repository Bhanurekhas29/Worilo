import { useEffect } from 'react'
import useSite from './useSite.js'
import { setFavicon } from '../favicon.js'
import Navbar from './sections/Navbar.jsx'
import Hero from './sections/Hero.jsx'
import Ticker from './sections/Ticker.jsx'
import Products from './sections/Products.jsx'
import Farmgate from './sections/Farmgate.jsx'
import Partner from './sections/Partner.jsx'
import Process from './sections/Process.jsx'
import Markets from './sections/Markets.jsx'
import Faq from './sections/Faq.jsx'
import Quote from './sections/Quote.jsx'
import Footer from './sections/Footer.jsx'
import FloatingIcons from './sections/FloatingIcons.jsx'
import AgriModal from './sections/AgriModal.jsx'
import ScrollEffects from './components/ScrollEffects.jsx'
import './site.css'

function setMeta(name, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function SitePage() {
  const { site, error } = useSite()

  // SEO settings from the admin panel
  useEffect(() => {
    if (!site) return
    const { seo, brand } = site
    document.title = seo.meta_title || `${brand.company_name} | Direct sourcing from India`
    setMeta('description', seo.meta_description)
    setMeta('keywords', [seo.primary_keywords, seo.secondary_keywords].filter(Boolean).join(', '))
    setFavicon(brand.favicon || brand.header_logo)
  }, [site])

  // Jump to #section links on first load
  useEffect(() => {
    if (!site || !window.location.hash) return
    const el = document.getElementById(window.location.hash.slice(1))
    if (el) setTimeout(() => el.scrollIntoView(), 50)
  }, [site])

  if (error) {
    return (
      <div className="s-state">
        <h1>We couldn't load the website</h1>
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

  return (
    <div className="site">
      <Navbar site={site} />
      <main>
        <Hero data={site.hero} />
        <Ticker data={site.ticker} />
        <Products data={site.products} />
        <Farmgate data={site.farmgate} />
        <Partner data={site.partner} />
        <Process data={site.process} />
        <Markets data={site.markets} />
        <Faq data={site.faq} />
        <Quote data={site.quote} waMessage={site.floating?.whatsapp?.message} />
      </main>
      <Footer site={site} />
      <FloatingIcons data={site.floating} />
      <AgriModal data={site.agripage} waMessage={site.floating?.whatsapp?.message} />
      <ScrollEffects />
    </div>
  )
}
