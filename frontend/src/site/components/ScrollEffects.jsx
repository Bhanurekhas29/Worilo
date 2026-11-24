import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { scrollToSection } from './SmartLink.jsx'

// Thin green bar showing how far down the page you are + a "back to top" button.
// Also sets --py on the hero so its photo drifts slower than the page (parallax).
export default function ScrollEffects() {
  const bar = useRef(null)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      bar.current?.style.setProperty('--p', max > 0 ? Math.min(y / max, 1).toFixed(4) : '0')
      document.querySelector('.s-hero')?.style.setProperty('--py', `${Math.min(y, 1000) * 0.28}px`)
      setShowTop((s) => (y > 700 ? true : s && y > 500))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <div className="s-progress" aria-hidden="true">
        <span ref={bar} />
      </div>
      <button type="button" className={`s-totop${showTop ? ' show' : ''}`} onClick={() => scrollToSection('')} aria-label="Back to top">
        <ArrowUp size={22} />
      </button>
    </>
  )
}
