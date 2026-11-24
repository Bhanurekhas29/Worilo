import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon, { HighlightIcon, highlightIcons } from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const MAX_HIGHLIGHTS = 4
const linkRe = /^(\/[A-Za-z0-9\-._~/#?=&%]*|#[A-Za-z0-9_-]+|https?:\/\/\S+)$/
const imgRe = /^(\/[A-Za-z0-9_./-]+|https?:\/\/\S+)\.(png|jpe?g|svg|webp|avif|gif)(\?\S*)?$/i
const LINK_ERROR = 'must be a page path like /products, an anchor like #contact, or a full http(s) URL'

const len = (s) => s.trim().length

function validate(v) {
  const e = {}
  const range = (key, label, min, max) => {
    const n = len(v[key])
    if (!n) e[key] = `${label} is required`
    else if (n < min || n > max) e[key] = `${label} must be ${min}-${max} characters`
  }
  range('eyebrow', 'Eyebrow text', 2, 60)
  range('heading', 'Heading', 10, 120)
  range('subheading', 'Sub-heading', 5, 120)
  range('description', 'Description', 20, 400)
  range('primary_label', 'Primary button label', 2, 30)

  const link = (key, label) => {
    const val = v[key].trim()
    if (!val) e[key] = `${label} is required`
    else if (!linkRe.test(val) || (val.includes('//') && !/^https?:\/\//i.test(val))) e[key] = `${label} ${LINK_ERROR}`
  }
  link('primary_url', 'Primary button link')

  if (v.secondary_label.trim() || v.secondary_url.trim()) {
    range('secondary_label', 'Secondary button label', 2, 30)
    link('secondary_url', 'Secondary button link')
  }

  const bg = v.background_image.trim()
  if (bg && !imgRe.test(bg)) e.background_image = 'Background image must be a path like /images/hero.jpg or an image URL'
  { const a = (v.image_alt || '').trim(); if (a && (a.length < 5 || a.length > 180)) e['image_alt'] = 'Image description must be 5-180 characters' }

  for (let i = 0; i < v.highlights.length; i++) {
    const n = len(v.highlights[i].text)
    if (n < 2 || n > 40) {
      e.highlights = `Highlight ${i + 1}: text must be 2-40 characters`
      break
    }
  }
  return e
}

function Preview({ v }) {
  const bg = v.background_image && imgRe.test(v.background_image.trim()) ? v.background_image.trim() : ''
  return (
    <div className="hero-preview" style={bg ? { backgroundImage: `linear-gradient(rgba(10,31,60,.82), rgba(10,31,60,.82)), url(${bg})` } : undefined}>
      <div className="hero-preview-eyebrow">
        <span /> {v.eyebrow}
      </div>
      <div className="hero-preview-heading">{v.heading}</div>
      <div className="hero-preview-sub">{v.subheading}</div>
      <p>{v.description}</p>
      <div className="hero-preview-btns">
        <span className="hp-primary">{v.primary_label || 'Primary'} →</span>
        {v.secondary_label && <span className="hp-secondary">{v.secondary_label}</span>}
      </div>
      {v.highlights.length > 0 && (
        <div className="hero-preview-highlights">
          {v.highlights.map((h, i) => (
            <span key={i}>
              <HighlightIcon name={h.icon} size={16} /> {h.text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Hero() {
  const form = useSettingsForm('/settings/hero', {
    eyebrow: '',
    heading: '',
    subheading: '',
    description: '',
    primary_label: '',
    primary_url: '',
    secondary_label: '',
    secondary_url: '',
    background_image: '',
    image_alt: '',
    highlights: [],
  })
  const { values } = form

  function setHighlight(i, patch) {
    form.set(
      'highlights',
      values.highlights.map((h, idx) => (idx === i ? { ...h, ...patch } : h)),
    )
  }

  return (
    <SettingsPage
      title="Hero Section"
      subtitle="The first banner visitors see on the home page."
      form={form}
      validate={validate}
    >
      <FormSection icon="text" title="Content" description="Headline text shown over the banner.">
      <Field label="Eyebrow text" required maxLength={60} hint="Small line above the heading." {...form.bind('eyebrow')} />
      <Field label="Heading" required as="textarea" rows={2} counter={120} {...form.bind('heading')} />
      <Field label="Sub-heading" required counter={120} hint="Shown in green below the heading." {...form.bind('subheading')} />
      <Field label="Description" required as="textarea" rows={4} counter={400} {...form.bind('description')} />

      </FormSection>

      <FormSection icon="buttons" title="Buttons" description="Primary and optional secondary call to action." tone="blue">
      <div className="field-row">
        <Field label="Primary button label" required maxLength={30} {...form.bind('primary_label')} />
        <Field label="Primary button link" required placeholder="/products" {...form.bind('primary_url')} />
      </div>
      <div className="field-row">
        <Field
          label="Secondary button label"
          maxLength={30}
          hint="Leave both secondary fields empty to hide this button."
          {...form.bind('secondary_label')}
        />
        <Field label="Secondary button link" placeholder="/contact" {...form.bind('secondary_url')} />
      </div>

      </FormSection>

      <FormSection icon="image" title="Background" description="Image behind the hero text.">
      <Field
        label="Background image"
        placeholder="/images/hero-banner.jpg"
        hint="Put the file in frontend/public/images and enter its path. Leave empty for a plain navy background."
        {...form.bind('background_image')}
      />
      <Field label="Image description (alt text)" maxLength={180} hint="Describes the photo for search engines and screen readers (5-180 characters). Optional." {...form.bind('image_alt')} />

      </FormSection>

      <FormSection
        icon="highlights"
        title="Highlights"
        description={`Short points shown under the buttons (up to ${MAX_HIGHLIGHTS}).`}
        tone="blue"
      >
      {values.highlights.map((h, i) => (
        <div className="highlight-row" key={i}>
          <select value={h.icon} onChange={(e) => setHighlight(i, { icon: e.target.value })} aria-label={`Highlight ${i + 1} icon`}>
            {Object.entries(highlightIcons).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={h.text}
            maxLength={40}
            placeholder="e.g. India-Based Sourcing"
            onChange={(e) => setHighlight(i, { text: e.target.value })}
            aria-label={`Highlight ${i + 1} text`}
          />
          <button
            type="button"
            className="icon-btn danger"
            aria-label={`Remove highlight ${i + 1}`}
            onClick={() => form.set('highlights', values.highlights.filter((_, idx) => idx !== i))}
          >
            <Icon name="trash" size={17} />
          </button>
        </div>
      ))}
      {form.errors.highlights && <div className="field-error" style={{ marginBottom: 10 }}>{form.errors.highlights}</div>}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={values.highlights.length >= MAX_HIGHLIGHTS}
        onClick={() => form.set('highlights', [...values.highlights, { icon: 'badge-check', text: '' }])}
      >
        <Icon name="plus" size={16} /> Add highlight
      </button>

      </FormSection>

      <FormSection icon="eye" title="Preview" description="How the hero will look." tone="navy">
        <Preview v={values} />
      </FormSection>
    </SettingsPage>
  )
}
