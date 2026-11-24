import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const MAX_CARDS = 8
const pad = (n) => String(n).padStart(2, '0')
const linkRe = /^(\/[A-Za-z0-9\-._~/#?=&%]*|#[A-Za-z0-9_-]+|https?:\/\/\S+)$/
const imgRe = /^(\/[A-Za-z0-9_./-]+|https?:\/\/\S+)\.(png|jpe?g|svg|webp|avif|gif)(\?\S*)?$/i

function validate(v) {
  const e = {}
  const range = (key, label, min, max, required = true) => {
    const n = v[key].trim().length
    if (!n) {
      if (required) e[key] = `${label} is required`
    } else if (n < min || n > max) e[key] = `${label} must be ${min}-${max} characters`
  }
  range('eyebrow', 'Eyebrow text', 2, 40)
  range('heading', 'Heading', 10, 100)
  range('subheading', 'Sub-heading', 5, 100)
  range('description', 'Description', 20, 400)
  range('image_caption', 'Image caption', 5, 120, false)
  range('note', 'Note', 10, 250, false)

  if (v.image.trim() && !imgRe.test(v.image.trim())) e.image = 'Image must be a path like /images/farmgate.jpg or an image URL'
  { const a = (v.image_alt || '').trim(); if (a && (a.length < 5 || a.length > 180)) e['image_alt'] = 'Image description must be 5-180 characters' }

  if (v.button_label.trim() || v.button_url.trim()) {
    range('button_label', 'Button label', 2, 30)
    const url = v.button_url.trim()
    if (!url) e.button_url = 'Button link is required'
    else if (!linkRe.test(url) || (url.includes('//') && !/^https?:\/\//i.test(url))) {
      e.button_url = 'Button link must be a page path like /contact, an anchor like #contact, or a full http(s) URL'
    }
  }

  if (v.cards.length < 1) e.cards = 'Add at least one card'
  v.cards.forEach((c, i) => {
    const t = c.title.trim().length
    if (t < 2 || t > 50) e[`cards.${i}.title`] = 'Title must be 2-50 characters'
    const d = c.description.trim().length
    if (d < 10 || d > 200) e[`cards.${i}.description`] = 'Description must be 10-200 characters'
  })
  return e
}

export default function Farmgate() {
  const form = useSettingsForm('/settings/farmgate', {
    eyebrow: '',
    heading: '',
    subheading: '',
    description: '',
    image: '',
    image_alt: '',
    image_caption: '',
    cards: [],
    button_label: '',
    button_url: '',
    note: '',
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
      title="Farmgate Sourcing"
      subtitle="The dark section explaining direct sourcing, with feature cards."
      form={form}
      validate={validate}
    >
      <FormSection icon="text" title="Content" description="Text shown beside the image.">
        <Field label="Eyebrow text" required maxLength={40} hint="Small green line above the heading." {...form.bind('eyebrow')} />
        <Field label="Heading" required as="textarea" rows={2} counter={100} {...form.bind('heading')} />
        <Field label="Sub-heading" required counter={100} {...form.bind('subheading')} />
        <Field label="Description" required as="textarea" rows={4} counter={400} {...form.bind('description')} />
      </FormSection>

      <FormSection icon="image" title="Image" description="Photo on the left with a caption underneath." tone="blue">
        <Field
          label="Image"
          icon="image"
          placeholder="/images/farmgate-sourcing.jpg"
          hint="Put the file in frontend/public/images and enter its path."
          {...form.bind('image')}
        />
        <Field label="Image description (alt text)" maxLength={180} hint="Describes the photo for search engines and screen readers (5-180 characters). Optional." {...form.bind('image_alt')} />
        <Field
          label="Image caption"
          as="textarea"
          rows={2}
          counter={120}
          hint="Shown in the dark box under the image. Leave empty to hide it."
          {...form.bind('image_caption')}
        />
      </FormSection>

      <FormSection
        icon="products"
        title="Feature cards"
        description={`${cards.length} of ${MAX_CARDS}. Numbers (01, 02…) are automatic.`}
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
              counter={200}
              value={c.description}
              error={errors[`cards.${i}.description`]}
              onChange={(e) => patch(i, { description: e.target.value })}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={cards.length >= MAX_CARDS}
          onClick={() => setCards([...cards, { title: '', description: '' }])}
        >
          <Icon name="plus" size={16} /> Add card
        </button>
      </FormSection>

      <FormSection icon="buttons" title="Button and note" description="Call to action and the small print under the cards." tone="navy">
        <div className="field-row">
          <Field
            label="Button label"
            maxLength={30}
            hint="Leave both button fields empty to hide the button."
            {...form.bind('button_label')}
          />
          <Field label="Button link" placeholder="/contact" {...form.bind('button_url')} />
        </div>
        <Field label="Note" as="textarea" rows={2} counter={250} hint="Small text beside the button. Optional." {...form.bind('note')} />
      </FormSection>
    </SettingsPage>
  )
}
