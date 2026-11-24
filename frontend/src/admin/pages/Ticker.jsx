import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const MAX_ITEMS = 30

// Speed levels. `seconds` = time each item takes to scroll past; the website uses the same map.
export const TICKER_SPEEDS = [
  { level: 1, label: 'Very slow', seconds: 5 },
  { level: 2, label: 'Slow', seconds: 4 },
  { level: 3, label: 'Normal', seconds: 3 },
  { level: 4, label: 'Fast', seconds: 2 },
  { level: 5, label: 'Very fast', seconds: 1.2 },
]

function validate(v) {
  const e = {}
  const seen = new Set()
  for (let i = 0; i < v.items.length; i++) {
    const t = v.items[i].trim().replace(/\s+/g, ' ')
    if (t.length < 2 || t.length > 40) {
      e.items = `Item ${i + 1} must be 2-40 characters`
      break
    }
    if (seen.has(t.toLowerCase())) {
      e.items = `"${t}" is listed twice`
      break
    }
    seen.add(t.toLowerCase())
  }
  if (!e.items && v.items.length === 0) e.items = 'Add at least one item'
  return e
}

function Preview({ items, speed, pause, show }) {
  const clean = items.map((t) => t.trim()).filter(Boolean)
  const seconds = (TICKER_SPEEDS.find((s) => s.level === speed)?.seconds ?? 3) * Math.max(clean.length, 1)
  const loop = [...clean, ...clean]
  return (
    <div className={`ticker-preview${pause ? ' pause' : ''}`} style={{ opacity: show ? 1 : 0.4 }}>
      {clean.length === 0 ? (
        <div className="ticker-empty">No items yet</div>
      ) : (
        <div className="ticker-track" key={`${speed}-${clean.length}`} style={{ animationDuration: `${seconds}s` }}>
          {loop.map((t, i) => (
            <span className="ticker-item" key={i}>
              {t}
              <i aria-hidden="true" />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Ticker() {
  const form = useSettingsForm('/settings/ticker', { items: [], speed: 3, pause_on_hover: true, show: true })
  const { values } = form

  const setItem = (i, text) => form.set('items', values.items.map((t, idx) => (idx === i ? text : t)))
  const move = (i, dir) => {
    const next = [...values.items]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    form.set('items', next)
  }

  return (
    <SettingsPage
      title="Scrolling Ticker"
      subtitle="The strip of text that scrolls from right to left across the website."
      form={form}
      validate={validate}
    >
      <FormSection icon="ticker" title="Display" description="Show or hide the ticker and choose how fast it moves.">
        <label className="check" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={!!values.show} onChange={(e) => form.set('show', e.target.checked)} />
          Show the ticker on the website
        </label>

        <div className="field">
          <span className="field-label">Speed</span>
          <div className="speed-seg" role="radiogroup" aria-label="Scroll speed">
            {TICKER_SPEEDS.map((s) => (
              <button
                key={s.level}
                type="button"
                role="radio"
                aria-checked={values.speed === s.level}
                className={values.speed === s.level ? 'on' : ''}
                onClick={() => form.set('speed', s.level)}
              >
                <strong>{s.level}</strong>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          {form.errors.speed && <div className="field-error">{form.errors.speed}</div>}
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={!!values.pause_on_hover}
            onChange={(e) => form.set('pause_on_hover', e.target.checked)}
          />
          Pause when a visitor hovers over it
        </label>
      </FormSection>

      <FormSection
        icon="tags"
        title="Items"
        description={`Words shown in the ticker, in order (up to ${MAX_ITEMS}).`}
        tone="blue"
      >
        {values.items.map((t, i) => (
          <div className="ticker-row" key={i}>
            <span className="ticker-num">{i + 1}</span>
            <input
              type="text"
              value={t}
              maxLength={40}
              placeholder="e.g. Basmati Rice"
              onChange={(e) => setItem(i, e.target.value)}
              aria-label={`Item ${i + 1}`}
            />
            <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move item ${i + 1} up`}>
              <Icon name="up" size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              disabled={i === values.items.length - 1}
              onClick={() => move(i, 1)}
              aria-label={`Move item ${i + 1} down`}
            >
              <Icon name="down" size={16} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              aria-label={`Remove item ${i + 1}`}
              onClick={() => form.set('items', values.items.filter((_, idx) => idx !== i))}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
        {form.errors.items && <div className="field-error" style={{ marginBottom: 10 }}>{form.errors.items}</div>}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={values.items.length >= MAX_ITEMS}
          onClick={() => form.set('items', [...values.items, ''])}
        >
          <Icon name="plus" size={16} /> Add item
        </button>
      </FormSection>

      <FormSection icon="eye" title="Preview" description="Live preview at the chosen speed." tone="navy">
        <Preview items={values.items} speed={values.speed} pause={values.pause_on_hover} show={values.show} />
      </FormSection>
    </SettingsPage>
  )
}
