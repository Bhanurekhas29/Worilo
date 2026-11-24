import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'
import { AgriIcon, agriIcons } from '../../agriIcons.jsx'

const MAX_CARDS = 16
const pad = (n) => String(n).padStart(2, '0')
const linkRe = /^(\/[A-Za-z0-9\-._~/#?=&%]*|#[A-Za-z0-9_-]+|https?:\/\/\S+)$/
const imgRe = /^(\/[A-Za-z0-9_./-]+|https?:\/\/\S+)\.(png|jpe?g|svg|webp|avif|gif)(\?\S*)?$/i
const ALT_HINT = 'Describes the photo for search engines and screen readers (5-180 characters). Optional.'

function validate(v) {
  const e = {}
  const range = (key, label, min, max, required = true) => {
    const n = (v[key] || '').trim().length
    if (!n) {
      if (required) e[key] = `${label} is required`
    } else if (n < min || n > max) e[key] = `${label} must be ${min}-${max} characters`
  }
  range('seo_title', 'Page title', 10, 70)
  range('seo_description', 'Page description', 50, 160)
  range('eyebrow', 'Eyebrow text', 2, 40, false)
  range('heading', 'Heading', 5, 100)
  range('intro', 'Intro text', 20, 300, false)
  range('banner_alt', 'Banner description', 5, 180, false)
  if (v.banner_image.trim() && !imgRe.test(v.banner_image.trim())) e.banner_image = 'Banner image must be a path like /images/banner.webp or an image URL'

  if (v.cards.length < 1) e.cards = 'Add at least one card'
  v.cards.forEach((c, i) => {
    const t = c.title.trim().length
    if (t < 2 || t > 40) e[`cards.${i}.title`] = 'Title must be 2-40 characters'
    if (c.image.trim() && !imgRe.test(c.image.trim())) e[`cards.${i}.image`] = 'Image must be a path like /images/rice.webp or an image URL'
    const a = (c.image_alt || '').trim()
    if (a && (a.length < 5 || a.length > 180)) e[`cards.${i}.image_alt`] = 'Image description must be 5-180 characters'
    const u = (c.url || '').trim()
    if (u && (!linkRe.test(u) || (u.includes('//') && !/^https?:\/\//i.test(u)))) {
      e[`cards.${i}.url`] = 'Link must be a page path like /about, an anchor like #contact, or a full http(s) URL'
    }
  })
  return e
}

export default function AgriPage() {
  const form = useSettingsForm('/settings/agripage', {
    seo_title: '',
    seo_description: '',
    eyebrow: '',
    heading: '',
    intro: '',
    banner_image: '',
    banner_alt: '',
    cards: [],
  })
  const { values, errors } = form
  const cards = values.cards

  const setCards = (next) => form.set('cards', next)
  const patch = (i, p) => setCards(cards.map((c, idx) => (idx === i ? { ...c, ...p } : c)))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= cards.length) return
    const next = [...cards]
    ;[next[i], next[j]] = [next[j], next[i]]
    setCards(next)
  }

  return (
    <SettingsPage
      title="Agricultural Page"
      subtitle="The page opened by “Explore Agricultural Products” (/agricultural-products): banner and category cards."
      form={form}
      validate={validate}
    >
      <FormSection icon="search" title="Search engine details" description="Title and description shown in Google results for this page.">
        <Field label="Page title" required maxLength={70} counter={70} hint="Browser tab title and search result title." {...form.bind('seo_title')} />
        <Field label="Page description" required as="textarea" rows={3} counter={160} {...form.bind('seo_description')} />
      </FormSection>

      <FormSection icon="text" title="Banner" description="Photo and heading at the top of the page." tone="blue">
        <Field label="Eyebrow text" maxLength={40} hint="Small green line above the heading. Optional." {...form.bind('eyebrow')} />
        <Field label="Heading" required maxLength={100} {...form.bind('heading')} />
        <Field label="Intro text" as="textarea" rows={3} counter={300} hint="Optional line under the heading." {...form.bind('intro')} />
        <Field
          label="Banner image"
          icon="image"
          placeholder="/images/agricultural-harvest.webp"
          hint="Put the file in frontend/public/images and enter its path."
          {...form.bind('banner_image')}
        />
        <Field label="Banner description (alt text)" maxLength={180} hint={ALT_HINT} {...form.bind('banner_alt')} />
      </FormSection>

      <FormSection
        icon="products"
        title="Category cards"
        description={`${cards.length} of ${MAX_CARDS}. Cards flow three to a row; a short last row stretches to fill the width.`}
        tone="navy"
      >
        {errors.cards && <div className="field-error" style={{ marginBottom: 10 }}>{errors.cards}</div>}
        {cards.map((c, i) => (
          <div className="cat-panel" key={i} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span className="cat-no">{pad(i + 1)}</span>
              <strong className="cat-title">{c.title || 'Untitled card'}</strong>
              <span className="cat-actions">
                <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move card up">
                  <Icon name="up" size={16} />
                </button>
                <button type="button" className="icon-btn" disabled={i === cards.length - 1} onClick={() => move(i, 1)} aria-label="Move card down">
                  <Icon name="down" size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  disabled={cards.length <= 1}
                  onClick={() => setCards(cards.filter((_, idx) => idx !== i))}
                  aria-label="Delete card"
                >
                  <Icon name="trash" size={16} />
                </button>
              </span>
            </div>

            <div className="field">
              <label htmlFor={`agri-icon-${i}`}>Icon</label>
              <div className="icon-pick">
                <span className="fs-tile blue">
                  <AgriIcon name={c.icon} size={20} />
                </span>
                <select id={`agri-icon-${i}`} value={c.icon} onChange={(e) => patch(i, { icon: e.target.value })}>
                  {Object.entries(agriIcons).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Field label="Title" required maxLength={40} value={c.title} error={errors[`cards.${i}.title`]} onChange={(e) => patch(i, { title: e.target.value })} />
            <Field
              label="Image"
              icon="image"
              placeholder="/images/rice.webp"
              hint="Put the file in frontend/public/images and enter its path."
              value={c.image}
              error={errors[`cards.${i}.image`]}
              onChange={(e) => patch(i, { image: e.target.value })}
            />
            <Field
              label="Image description (alt text)"
              maxLength={180}
              hint={ALT_HINT}
              value={c.image_alt || ''}
              error={errors[`cards.${i}.image_alt`]}
              onChange={(e) => patch(i, { image_alt: e.target.value })}
            />
            <Field
              label="Card link"
              placeholder="/#contact"
              hint="Where the arrow goes: a page like /rice, a section like /#contact, or a full URL. Leave empty for no link."
              value={c.url || ''}
              error={errors[`cards.${i}.url`]}
              onChange={(e) => patch(i, { url: e.target.value })}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={cards.length >= MAX_CARDS}
          onClick={() => setCards([...cards, { title: '', icon: 'wheat', image: '', image_alt: '', url: '/#contact' }])}
        >
          <Icon name="plus" size={16} /> Add card
        </button>
      </FormSection>
    </SettingsPage>
  )
}
