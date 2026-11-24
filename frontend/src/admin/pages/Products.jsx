import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const MAX_CATEGORIES = 8
const MAX_ITEMS = 12
const pad = (n) => String(n).padStart(2, '0')
const linkRe = /^(\/[A-Za-z0-9\-._~/#?=&%]*|#[A-Za-z0-9_-]+|https?:\/\/\S+)$/
const imgRe = /^(\/[A-Za-z0-9_./-]+|https?:\/\/\S+)\.(png|jpe?g|svg|webp|avif|gif)(\?\S*)?$/i

const blankCategory = () => ({
  title: '',
  description: '',
  image: '',
  image_alt: '',
  items: [''],
  button_label: '',
  button_url: '',
  is_active: true,
})

function validate(v) {
  const e = {}
  const l1 = v.heading_line1.trim()
  if (l1.length < 3 || l1.length > 60) e.heading_line1 = 'Heading line 1 must be 3-60 characters'
  const l2 = v.heading_line2.trim()
  if (l2 && (l2.length < 3 || l2.length > 60)) e.heading_line2 = 'Heading line 2 must be 3-60 characters'
  { const st = (v.subtext || '').trim(); if (st && (st.length < 20 || st.length > 250)) e.subtext = 'Intro text must be 20-250 characters' }
  if (v.categories.length < 1) e.categories = 'Add at least one category'

  v.categories.forEach((c, i) => {
    const k = (f) => `categories.${i}.${f}`
    const range = (f, label, min, max) => {
      const n = c[f].trim().length
      if (!n) e[k(f)] = `${label} is required`
      else if (n < min || n > max) e[k(f)] = `${label} must be ${min}-${max} characters`
    }
    range('title', 'Title', 2, 60)
    range('description', 'Description', 20, 500)
    { const a = (c.image_alt || '').trim(); if (a && (a.length < 5 || a.length > 180)) e[k('image_alt')] = 'Image description must be 5-180 characters' }
    range('button_label', 'Button label', 2, 40)
    const url = c.button_url.trim()
    if (!url) e[k('button_url')] = 'Button link is required'
    else if (!linkRe.test(url) || (url.includes('//') && !/^https?:\/\//i.test(url))) {
      e[k('button_url')] = 'Button link must be a page path like /products, an anchor like #contact, or a full http(s) URL'
    }
    if (c.image.trim() && !imgRe.test(c.image.trim())) e[k('image')] = 'Image must be a path like /images/rice.jpg or an image URL'

    const seen = new Set()
    for (let j = 0; j < c.items.length; j++) {
      const t = c.items[j].trim().replace(/\s+/g, ' ')
      if (t.length < 2 || t.length > 50) {
        e[k('items')] = `Checklist item ${j + 1} must be 2-50 characters`
        break
      }
      if (seen.has(t.toLowerCase())) {
        e[k('items')] = `"${t}" is listed twice`
        break
      }
      seen.add(t.toLowerCase())
    }
    if (!e[k('items')] && c.items.length === 0) e[k('items')] = 'Add at least one checklist item'
  })
  return e
}

export default function Products() {
  const form = useSettingsForm('/settings/products', { heading_line1: '', heading_line2: '', subtext: '', categories: [] })
  const { values, errors } = form
  const cats = values.categories

  const setCats = (next) => form.set('categories', next)
  const patch = (i, p) => setCats(cats.map((c, idx) => (idx === i ? { ...c, ...p } : c)))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= cats.length) return
    const next = [...cats]
    ;[next[i], next[j]] = [next[j], next[i]]
    setCats(next)
  }
  const stop = (fn) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    fn()
  }

  // Numbering and image side follow the order of *visible* categories, exactly like the website.
  let visibleNo = 0

  return (
    <SettingsPage
      title="Our Products"
      subtitle="The product categories section on the home page."
      form={form}
      validate={validate}
    >
      <FormSection icon="text" title="Section heading" description="Big heading shown above the categories.">
        <div className="field-row">
          <Field label="Heading line 1" required maxLength={60} {...form.bind('heading_line1')} />
          <Field label="Heading line 2" maxLength={60} hint="Optional second line." {...form.bind('heading_line2')} />
        </div>
        <Field label="Intro text" as="textarea" rows={2} counter={250} hint="Optional line under the heading." {...form.bind('subtext')} />
      </FormSection>

      <FormSection
        icon="products"
        title="Categories"
        description={`${cats.length} of ${MAX_CATEGORIES}. Numbers and image sides are automatic.`}
        tone="blue"
      >
        {errors.categories && <div className="field-error" style={{ marginBottom: 10 }}>{errors.categories}</div>}

        {cats.map((c, i) => {
          const no = c.is_active ? ++visibleNo : null
          const err = (f) => errors[`categories.${i}.${f}`]
          const hasErr = Object.keys(errors).some((k) => k.startsWith(`categories.${i}.`) && errors[k])
          return (
            <details className={`cat-panel${hasErr ? ' has-error' : ''}`} key={i} open={i === 0 || hasErr}>
              <summary>
                <span className="cat-no">{no ? pad(no) : '—'}</span>
                <span className="cat-title">{c.title || 'Untitled category'}</span>
                {!c.is_active && <span className="badge badge-red">Hidden</span>}
                <span className="cat-meta">{c.items.filter((t) => t.trim()).length} items</span>
                <span className="cat-actions">
                  <button type="button" className="icon-btn" disabled={i === 0} onClick={stop(() => move(i, -1))} aria-label="Move category up">
                    <Icon name="up" size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    disabled={i === cats.length - 1}
                    onClick={stop(() => move(i, 1))}
                    aria-label="Move category down"
                  >
                    <Icon name="down" size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    disabled={cats.length <= 1}
                    onClick={stop(() => setCats(cats.filter((_, idx) => idx !== i)))}
                    aria-label="Delete category"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </span>
              </summary>

              <div className="cat-body">
                <label className="check" style={{ marginBottom: 18 }}>
                  <input type="checkbox" checked={c.is_active} onChange={(e) => patch(i, { is_active: e.target.checked })} />
                  Visible on the website
                </label>

                <Field
                  label="Title"
                  required
                  maxLength={60}
                  value={c.title}
                  error={err('title')}
                  onChange={(e) => patch(i, { title: e.target.value })}
                />
                <Field
                  label="Description"
                  required
                  as="textarea"
                  rows={3}
                  counter={500}
                  value={c.description}
                  error={err('description')}
                  onChange={(e) => patch(i, { description: e.target.value })}
                />
                <Field
                  label="Image"
                  icon="image"
                  placeholder="/images/agricultural-products.jpg"
                  hint="Put the file in frontend/public/images and enter its path."
                  value={c.image}
                  error={err('image')}
                  onChange={(e) => patch(i, { image: e.target.value })}
                />
                <Field
                  label="Image description (alt text)"
                  maxLength={180}
                  hint="Describes the photo for search engines and screen readers (5-180 characters). Optional."
                  value={c.image_alt || ''}
                  error={err('image_alt')}
                  onChange={(e) => patch(i, { image_alt: e.target.value })}
                />

                <div className="field">
                  <span className="field-label">
                    Checklist <span className="req">*</span>
                    <span className="label-note">image caption: {c.items.filter((t) => t.trim()).length} sourcing categories</span>
                  </span>
                  {c.items.map((t, j) => (
                    <div className="item-row" key={j}>
                      <input
                        type="text"
                        value={t}
                        maxLength={50}
                        placeholder="e.g. Vegetables & Fruits"
                        aria-label={`Checklist item ${j + 1}`}
                        onChange={(e) => patch(i, { items: c.items.map((x, idx) => (idx === j ? e.target.value : x)) })}
                      />
                      <button
                        type="button"
                        className="icon-btn danger"
                        aria-label={`Remove checklist item ${j + 1}`}
                        onClick={() => patch(i, { items: c.items.filter((_, idx) => idx !== j) })}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  ))}
                  {err('items') && <div className="field-error" style={{ marginBottom: 8 }}>{err('items')}</div>}
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={c.items.length >= MAX_ITEMS}
                      onClick={() => patch(i, { items: [...c.items, ''] })}
                    >
                      <Icon name="plus" size={16} /> Add item
                    </button>
                  </div>
                </div>

                <div className="field-row">
                  <Field
                    label="Button label"
                    required
                    maxLength={40}
                    placeholder="Explore Agricultural Products"
                    value={c.button_label}
                    error={err('button_label')}
                    onChange={(e) => patch(i, { button_label: e.target.value })}
                  />
                  <Field
                    label="Button link"
                    required
                    placeholder="/products"
                    value={c.button_url}
                    error={err('button_url')}
                    onChange={(e) => patch(i, { button_url: e.target.value })}
                  />
                </div>
              </div>
            </details>
          )
        })}

        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={cats.length >= MAX_CATEGORIES}
          onClick={() => setCats([...cats, blankCategory()])}
        >
          <Icon name="plus" size={16} /> Add category
        </button>
        {cats.length >= MAX_CATEGORIES && <div className="field-hint">Maximum of {MAX_CATEGORIES} categories reached.</div>}
      </FormSection>
    </SettingsPage>
  )
}
