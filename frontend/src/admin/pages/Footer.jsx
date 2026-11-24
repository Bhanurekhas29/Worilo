import { Link } from 'react-router-dom'
import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const MAX_COLUMNS = 3
const MAX_LINKS = 10
const linkRe = /^(\/[A-Za-z0-9\-._~/#?=&%]*|#[A-Za-z0-9_-]+|https?:\/\/\S+)$/

function validate(v) {
  const e = {}
  const range = (key, label, min, max, required = true) => {
    const n = v[key].trim().length
    if (!n) {
      if (required) e[key] = `${label} is required`
    } else if (n < min || n > max) e[key] = `${label} must be ${min}-${max} characters`
  }
  range('tagline', 'Tagline', 5, 80)
  range('description', 'Description', 20, 300)
  if (v.chat_show) range('chat_label', 'WhatsApp button label', 2, 40)
  range('copyright', 'Copyright text', 3, 80)
  range('bottom_text', 'Bottom line text', 5, 100, false)

  v.columns.forEach((col, i) => {
    const t = col.title.trim().length
    if (t < 2 || t > 30) e[`columns.${i}.title`] = 'Column title must be 2-30 characters'
    if (col.links.length < 1) e[`columns.${i}.links`] = 'Add at least one link'
    col.links.forEach((l, j) => {
      const n = l.label.trim().length
      if (n < 2 || n > 40) e[`columns.${i}.links.${j}.label`] = 'Label must be 2-40 characters'
      const url = l.url.trim()
      if (!url) e[`columns.${i}.links.${j}.url`] = 'Link is required'
      else if (!linkRe.test(url) || (url.includes('//') && !/^https?:\/\//i.test(url))) {
        e[`columns.${i}.links.${j}.url`] = 'Use a page path (/about), anchor (#contact) or full URL'
      }
    })
  })
  return e
}

export default function Footer() {
  const form = useSettingsForm('/settings/footer', {
    tagline: '',
    description: '',
    chat_show: true,
    chat_label: '',
    columns: [],
    copyright: '',
    bottom_text: '',
  })
  const { values, errors } = form
  const cols = values.columns

  const setCols = (next) => form.set('columns', next)
  const patchCol = (i, p) => setCols(cols.map((c, idx) => (idx === i ? { ...c, ...p } : c)))
  const moveCol = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= cols.length) return
    const next = [...cols]
    ;[next[i], next[j]] = [next[j], next[i]]
    setCols(next)
  }
  const setLinks = (i, links) => patchCol(i, { links })
  const moveLink = (i, j, dir) => {
    const links = [...cols[i].links]
    const k = j + dir
    if (k < 0 || k >= links.length) return
    ;[links[j], links[k]] = [links[k], links[j]]
    setLinks(i, links)
  }

  return (
    <SettingsPage
      title="Footer"
      subtitle="The dark footer at the bottom of every page."
      form={form}
      validate={validate}
    >
      <FormSection icon="text" title="Brand text" description="Shown beside the footer logo.">
        <Field label="Tagline" required maxLength={80} hint="Line under the company name." {...form.bind('tagline')} />
        <Field label="Description" required as="textarea" rows={3} counter={300} {...form.bind('description')} />
        <label className="check" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={!!values.chat_show} onChange={(e) => form.set('chat_show', e.target.checked)} />
          Show the WhatsApp button
        </label>
        {values.chat_show && <Field label="WhatsApp button label" required maxLength={40} {...form.bind('chat_label')} />}
        <div className="info-note">
          The footer logo comes from <Link to="/admin/brand">Brand</Link>, and the WhatsApp number from{' '}
          <Link to="/admin/floating-icons">Floating Icons</Link>.
        </div>
      </FormSection>

      <FormSection
        icon="footer"
        title="Link columns"
        description={`${cols.length} of ${MAX_COLUMNS}. A “Contact Us” column is added automatically.`}
        tone="blue"
      >
        {errors.columns && <div className="field-error" style={{ marginBottom: 10 }}>{errors.columns}</div>}
        {cols.map((col, i) => (
          <div className="cat-panel" key={i} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span className="cat-no">{i + 1}</span>
              <strong className="cat-title">{col.title || 'Untitled column'}</strong>
              <span className="cat-actions">
                <button type="button" className="icon-btn" disabled={i === 0} onClick={() => moveCol(i, -1)} aria-label="Move column up">
                  <Icon name="up" size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={i === cols.length - 1}
                  onClick={() => moveCol(i, 1)}
                  aria-label="Move column down"
                >
                  <Icon name="down" size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => setCols(cols.filter((_, idx) => idx !== i))}
                  aria-label="Delete column"
                >
                  <Icon name="trash" size={16} />
                </button>
              </span>
            </div>

            <Field
              label="Column title"
              required
              maxLength={30}
              value={col.title}
              error={errors[`columns.${i}.title`]}
              onChange={(e) => patchCol(i, { title: e.target.value })}
            />

            <div className="field">
              <span className="field-label">
                Links <span className="label-note">{col.links.length} of {MAX_LINKS}</span>
              </span>
              {col.links.map((l, j) => (
                <div key={j} style={{ marginBottom: 8 }}>
                  <div className="link-row">
                    <input
                      type="text"
                      value={l.label}
                      maxLength={40}
                      placeholder="Label"
                      aria-label={`Link ${j + 1} label`}
                      onChange={(e) => setLinks(i, col.links.map((x, k) => (k === j ? { ...x, label: e.target.value } : x)))}
                    />
                    <input
                      type="text"
                      value={l.url}
                      placeholder="/about"
                      aria-label={`Link ${j + 1} address`}
                      onChange={(e) => setLinks(i, col.links.map((x, k) => (k === j ? { ...x, url: e.target.value } : x)))}
                    />
                    <button type="button" className="icon-btn" disabled={j === 0} onClick={() => moveLink(i, j, -1)} aria-label="Move link up">
                      <Icon name="up" size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={j === col.links.length - 1}
                      onClick={() => moveLink(i, j, 1)}
                      aria-label="Move link down"
                    >
                      <Icon name="down" size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => setLinks(i, col.links.filter((_, k) => k !== j))}
                      aria-label="Remove link"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                  {(errors[`columns.${i}.links.${j}.label`] || errors[`columns.${i}.links.${j}.url`]) && (
                    <div className="field-error">
                      {errors[`columns.${i}.links.${j}.label`] || errors[`columns.${i}.links.${j}.url`]}
                    </div>
                  )}
                </div>
              ))}
              {errors[`columns.${i}.links`] && <div className="field-error" style={{ marginBottom: 8 }}>{errors[`columns.${i}.links`]}</div>}
              <div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={col.links.length >= MAX_LINKS}
                  onClick={() => setLinks(i, [...col.links, { label: '', url: '' }])}
                >
                  <Icon name="plus" size={16} /> Add link
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={cols.length >= MAX_COLUMNS}
          onClick={() => setCols([...cols, { title: '', links: [{ label: '', url: '' }] }])}
        >
          <Icon name="plus" size={16} /> Add column
        </button>
        <div className="info-note" style={{ marginTop: 16 }}>
          The “Contact Us” column (email, phone, country) is taken from <Link to="/admin/quote-form">Quote Form</Link>.
        </div>
      </FormSection>

      <FormSection icon="text" title="Bottom bar" description="The copyright line and the text on the right." tone="navy">
        <div className="field-row">
          <Field
            label="Copyright text"
            required
            maxLength={80}
            hint="“©” and the current year are added automatically."
            {...form.bind('copyright')}
          />
          <Field label="Right-hand text" maxLength={100} hint="Optional." {...form.bind('bottom_text')} />
        </div>
        <div className="info-note">
          The credits line “Designed and Developed by …” is shown as its own last row under the bottom bar. Turn it on or off in{' '}
          <Link to="/admin/credits">Credits</Link>.
        </div>
      </FormSection>
    </SettingsPage>
  )
}
