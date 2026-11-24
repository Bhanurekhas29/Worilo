import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const MAX_MARKETS = 12
const linkRe = /^(\/[A-Za-z0-9\-._~/#?=&%]*|#[A-Za-z0-9_-]+|https?:\/\/\S+)$/
const imgRe = /^(\/[A-Za-z0-9_./-]+|https?:\/\/\S+)\.(png|jpe?g|svg|webp|avif|gif)(\?\S*)?$/i

function validate(v) {
  const e = {}
  const range = (key, label, min, max) => {
    const n = v[key].trim().length
    if (!n) e[key] = `${label} is required`
    else if (n < min || n > max) e[key] = `${label} must be ${min}-${max} characters`
  }
  range('eyebrow', 'Eyebrow text', 2, 40)
  range('heading', 'Heading', 10, 100)
  range('description', 'Description', 20, 400)

  { const a = (v.image_alt || '').trim(); if (a && (a.length < 5 || a.length > 180)) e.image_alt = 'Image description must be 5-180 characters' }
  if (v.image.trim() && !imgRe.test(v.image.trim())) e.image = 'Map image must be a path like /images/world-map.png or an image URL'

  if (v.button_label.trim() || v.button_url.trim()) {
    range('button_label', 'Button label', 2, 40)
    const url = v.button_url.trim()
    if (!url) e.button_url = 'Button link is required'
    else if (!linkRe.test(url) || (url.includes('//') && !/^https?:\/\//i.test(url))) {
      e.button_url = 'Button link must be a page path like /global-markets, an anchor like #contact, or a full http(s) URL'
    }
  }

  const seen = new Set()
  for (let i = 0; i < v.markets.length; i++) {
    const t = v.markets[i].name.trim().replace(/\s+/g, ' ')
    if ((v.markets[i].tooltip || '').trim().length > 100) {
      e.markets = `Tooltip for market ${i + 1} must be at most 100 characters`
      break
    }
    if (t.length < 2 || t.length > 40) {
      e.markets = `Market ${i + 1} must be 2-40 characters`
      break
    }
    if (seen.has(t.toLowerCase())) {
      e.markets = `"${t}" is listed twice`
      break
    }
    seen.add(t.toLowerCase())
  }
  if (!e.markets && v.markets.length === 0) e.markets = 'Add at least one market'
  return e
}

export default function GlobalMarkets() {
  const form = useSettingsForm('/settings/markets', {
    eyebrow: '',
    heading: '',
    description: '',
    markets: [],
    button_label: '',
    button_url: '',
    image: '',
    image_alt: '',
  })
  const { values } = form

  const setMarket = (i, patch) => form.set('markets', values.markets.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
  const move = (i, dir) => {
    const next = [...values.markets]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    form.set('markets', next)
  }

  return (
    <SettingsPage
      title="Global Markets"
      subtitle="The dark section with the world map and the regions you serve."
      form={form}
      validate={validate}
    >
      <FormSection icon="text" title="Content" description="Text shown beside the map.">
        <Field label="Eyebrow text" required maxLength={40} hint="Small green line above the heading." {...form.bind('eyebrow')} />
        <Field label="Heading" required as="textarea" rows={2} counter={100} {...form.bind('heading')} />
        <Field label="Description" required as="textarea" rows={4} counter={400} {...form.bind('description')} />
      </FormSection>

      <FormSection
        icon="markets"
        title="Markets"
        description={`Regions shown as chips, in order (${values.markets.length} of ${MAX_MARKETS}).`}
        tone="blue"
      >
        {values.markets.map((m, i) => (
          <div className="ticker-row" key={i}>
            <span className="ticker-num">{i + 1}</span>
            <input
              type="text"
              value={m.name}
              maxLength={40}
              placeholder="e.g. United Kingdom"
              onChange={(e) => setMarket(i, { name: e.target.value })}
              aria-label={`Market ${i + 1}`}
            />
            <input
              type="text"
              value={m.tooltip || ''}
              maxLength={100}
              placeholder="Tooltip shown on hover"
              onChange={(e) => setMarket(i, { tooltip: e.target.value })}
              aria-label={`Tooltip for market ${i + 1}`}
            />
            <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move market ${i + 1} up`}>
              <Icon name="up" size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              disabled={i === values.markets.length - 1}
              onClick={() => move(i, 1)}
              aria-label={`Move market ${i + 1} down`}
            >
              <Icon name="down" size={16} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              aria-label={`Remove market ${i + 1}`}
              onClick={() => form.set('markets', values.markets.filter((_, idx) => idx !== i))}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
        {form.errors.markets && <div className="field-error" style={{ marginBottom: 10 }}>{form.errors.markets}</div>}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={values.markets.length >= MAX_MARKETS}
          onClick={() => form.set('markets', [...values.markets, { name: '', tooltip: '' }])}
        >
          <Icon name="plus" size={16} /> Add market
        </button>
      </FormSection>

      <FormSection icon="buttons" title="Button and map" description="Call to action and the world map image." tone="navy">
        <div className="field-row">
          <Field
            label="Button label"
            maxLength={40}
            hint="Leave both button fields empty to hide the button."
            {...form.bind('button_label')}
          />
          <Field label="Button link" placeholder="/global-markets" {...form.bind('button_url')} />
        </div>
        <Field
          label="Map image"
          icon="image"
          placeholder="/images/global-network-map.png"
          hint="Put the file in frontend/public/images and enter its path."
          {...form.bind('image')}
        />
        <Field label="Map description (alt text)" maxLength={180} hint="Describes the photo for search engines and screen readers (5-180 characters). Optional." {...form.bind('image_alt')} />
      </FormSection>
    </SettingsPage>
  )
}
