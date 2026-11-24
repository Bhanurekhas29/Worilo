import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon, { PartnerIcon, partnerIcons } from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const MAX_CARDS = 8
const pad = (n) => String(n).padStart(2, '0')
const imgRe = /^(\/[A-Za-z0-9_./-]+|https?:\/\/\S+)\.(png|jpe?g|svg|webp|avif|gif)(\?\S*)?$/i

function validate(v) {
  const e = {}
  const h = v.heading.trim().length
  if (!h) e.heading = 'Heading is required'
  else if (h < 5 || h > 80) e.heading = 'Heading must be 5-80 characters'
  const s = v.subtext.trim().length
  if (!s) e.subtext = 'Sub-text is required'
  else if (s < 20 || s > 250) e.subtext = 'Sub-text must be 20-250 characters'
  if (v.background_image.trim() && !imgRe.test(v.background_image.trim())) {
    e.background_image = 'Background image must be a path like /images/port.jpg or an image URL'
  }
  { const a = (v.background_alt || '').trim(); if (a && (a.length < 5 || a.length > 180)) e['background_alt'] = 'Image description must be 5-180 characters' }

  if (v.cards.length < 1) e.cards = 'Add at least one card'
  v.cards.forEach((c, i) => {
    const t = c.title.trim().length
    if (t < 2 || t > 50) e[`cards.${i}.title`] = 'Title must be 2-50 characters'
    const d = c.description.trim().length
    if (d < 10 || d > 160) e[`cards.${i}.description`] = 'Description must be 10-160 characters'
    if (c.image.trim() && !imgRe.test(c.image.trim())) e[`cards.${i}.image`] = 'Image must be a path like /images/card.jpg or an image URL'
  { const a = (c.image_alt || '').trim(); if (a && (a.length < 5 || a.length > 180)) e[`cards.${i}.image_alt`] = 'Image description must be 5-180 characters' }
  })
  return e
}

export default function Partner() {
  const form = useSettingsForm('/settings/partner', { heading: '', subtext: '', background_image: '', background_alt: '', cards: [] })
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
      title="Sourcing Partner"
      subtitle="“Your Sourcing Partner in India”: reason cards over a background photo."
      form={form}
      validate={validate}
    >
      <FormSection icon="text" title="Section heading" description="Heading and intro text above the cards.">
        <Field label="Heading" required maxLength={80} {...form.bind('heading')} />
        <Field label="Sub-text" required as="textarea" rows={3} counter={250} {...form.bind('subtext')} />
        <Field
          label="Background image"
          icon="image"
          placeholder="/images/port-background.jpg"
          hint="Faded photo behind the section. Put the file in frontend/public/images and enter its path."
          {...form.bind('background_image')}
        />
        <Field label="Background description (alt text)" maxLength={180} hint="Describes the photo for search engines and screen readers (5-180 characters). Optional." {...form.bind('background_alt')} />
      </FormSection>

      <FormSection
        icon="handshake"
        title="Reason cards"
        description={`${cards.length} of ${MAX_CARDS}. Image sides alternate automatically; a card without an image shows as a text-only card.`}
        tone="blue"
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
                <button
                  type="button"
                  className="icon-btn"
                  disabled={i === cards.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move card down"
                >
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
              <label htmlFor={`icon-${i}`}>Icon</label>
              <div className="icon-pick">
                <span className="fs-tile blue">
                  <PartnerIcon name={c.icon} size={20} />
                </span>
                <select id={`icon-${i}`} value={c.icon} onChange={(e) => patch(i, { icon: e.target.value })}>
                  {Object.entries(partnerIcons).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Field
              label="Title"
              required
              maxLength={50}
              value={c.title}
              error={errors[`cards.${i}.title`]}
              onChange={(e) => patch(i, { title: e.target.value })}
            />
            <Field
              label="Description"
              required
              as="textarea"
              rows={3}
              counter={160}
              value={c.description}
              error={errors[`cards.${i}.description`]}
              onChange={(e) => patch(i, { description: e.target.value })}
            />
            <Field
              label="Image"
              icon="image"
              placeholder="/images/direct-sourcing.jpg"
              hint="Optional. Leave empty for a text-only card."
              value={c.image}
              error={errors[`cards.${i}.image`]}
              onChange={(e) => patch(i, { image: e.target.value })}
            />
            <Field
              label="Image description (alt text)"
              maxLength={180}
              hint="Describes the photo for search engines and screen readers (5-180 characters). Optional."
              value={c.image_alt || ''}
              error={errors[`cards.${i}.image_alt`]}
              onChange={(e) => patch(i, { image_alt: e.target.value })}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={cards.length >= MAX_CARDS}
          onClick={() => setCards([...cards, { icon: 'handshake', title: '', description: '', image: '', image_alt: '' }])}
        >
          <Icon name="plus" size={16} /> Add card
        </button>
      </FormSection>
    </SettingsPage>
  )
}
