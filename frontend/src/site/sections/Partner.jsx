import { PartnerIcon } from '../../admin/components/Icons.jsx'
import Reveal from '../components/Reveal.jsx'
import { PARTNER_SHAPE_PATH } from '../partnerShape.js'

// The four photo outlines (traced from the Figma). Shape "a" has its long diagonal at the
// bottom outer corner, shape "b" is the same shape flipped upside down; "r"/"l" = which
// side of the card the photo is on.
function ShapeDefs() {
  const variants = [
    ['a-r', undefined],
    ['a-l', 'translate(1 0) scale(-1 1)'],
    ['b-r', 'translate(0 1) scale(1 -1)'],
    ['b-l', 'translate(1 1) scale(-1 -1)'],
  ]
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {variants.map(([id, transform]) => (
          <clipPath key={id} id={`pshape-${id}`} clipPathUnits="objectBoundingBox">
            <path d={PARTNER_SHAPE_PATH} transform={transform} />
          </clipPath>
        ))}
      </defs>
    </svg>
  )
}

export default function Partner({ data }) {
  // Cards with a photo alternate sides (right, left, right, left...) and shapes (a, a, b, b, a, a...);
  // text-only cards span the full row.
  let photoCount = 0
  return (
    <section id="services" className="s-section s-partner" style={data.background_image ? { '--partner-bg': `url(${data.background_image})` } : undefined}>
      {data.background_image && data.background_alt && <div className="s-bg-alt" role="img" aria-label={data.background_alt} />}
      <ShapeDefs />
      <div className="s-container">
        <Reveal className="s-center s-partner-head">
          <h2 className="s-title">{data.heading}</h2>
          <p className="s-lead">{data.subtext}</p>
        </Reveal>

        <div className="s-partner-grid">
          {data.cards.map((c, i) => {
            const hasImage = !!c.image
            const n = hasImage ? photoCount++ : -1
            const imageRight = hasImage ? n % 2 === 0 : false
            const shape = hasImage && Math.floor(n / 2) % 2 === 1 ? 'shape-b' : 'shape-a'
            return (
              <Reveal
                key={i}
                delay={(i % 2) * 120}
                direction={hasImage ? (imageRight ? 'left' : 'right') : 'up'}
                className={`s-pcard${hasImage ? ` ${shape}` : ' solo'}${imageRight ? ' img-right' : ' img-left'}${c.title.length <= 16 ? ' roomy' : ''}`}
              >
                <div className="s-pcard-text">
                  <span className="s-pcard-icon">
                    <PartnerIcon name={c.icon} size={20} />
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                </div>
                {hasImage && (
                  <div className="s-pcard-img">
                    <div className="s-pcard-photo">
                      <img src={c.image} alt={c.image_alt || c.title} loading="lazy" />
                    </div>
                  </div>
                )}
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
