import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const MAX_STEPS = 8
const pad = (n) => String(n).padStart(2, '0')
const linkRe = /^(\/[A-Za-z0-9\-._~/#?=&%]*|#[A-Za-z0-9_-]+|https?:\/\/\S+)$/

function validate(v) {
  const e = {}
  const range = (key, label, min, max) => {
    const n = v[key].trim().length
    if (!n) e[key] = `${label} is required`
    else if (n < min || n > max) e[key] = `${label} must be ${min}-${max} characters`
  }
  range('eyebrow', 'Eyebrow text', 2, 40)
  range('heading', 'Heading', 10, 100)
  range('description', 'Description', 20, 250)

  if (v.button_label.trim() || v.button_url.trim()) {
    range('button_label', 'Button label', 2, 40)
    const url = v.button_url.trim()
    if (!url) e.button_url = 'Button link is required'
    else if (!linkRe.test(url) || (url.includes('//') && !/^https?:\/\//i.test(url))) {
      e.button_url = 'Button link must be a page path like /contact, an anchor like #contact, or a full http(s) URL'
    }
  }

  if (v.steps.length < 1) e.steps = 'Add at least one step'
  v.steps.forEach((s, i) => {
    const t = s.title.trim().length
    if (t < 2 || t > 60) e[`steps.${i}.title`] = 'Title must be 2-60 characters'
    const d = s.description.trim().length
    if (d < 10 || d > 200) e[`steps.${i}.description`] = 'Description must be 10-200 characters'
  })
  return e
}

export default function HowItWorks() {
  const form = useSettingsForm('/settings/process', {
    eyebrow: '',
    heading: '',
    description: '',
    button_label: '',
    button_url: '',
    steps: [],
  })
  const { values, errors } = form
  const steps = values.steps

  const setSteps = (next) => form.set('steps', next)
  const patch = (i, p) => setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...p } : s)))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[i], next[j]] = [next[j], next[i]]
    setSteps(next)
  }

  return (
    <SettingsPage
      title="How It Works"
      subtitle="The dark section that explains the sourcing process step by step."
      form={form}
      validate={validate}
    >
      <FormSection icon="text" title="Section heading" description="Heading, intro text and the button on the right.">
        <Field label="Eyebrow text" required maxLength={40} hint="Small green line above the heading." {...form.bind('eyebrow')} />
        <Field label="Heading" required as="textarea" rows={2} counter={100} {...form.bind('heading')} />
        <Field label="Description" required as="textarea" rows={3} counter={250} {...form.bind('description')} />
        <div className="field-row">
          <Field
            label="Button label"
            maxLength={40}
            hint="Leave both button fields empty to hide the button."
            {...form.bind('button_label')}
          />
          <Field label="Button link" placeholder="/contact" {...form.bind('button_url')} />
        </div>
      </FormSection>

      <FormSection
        icon="steps"
        title="Steps"
        description={`${steps.length} of ${MAX_STEPS}. Numbers (01, 02…) are automatic.`}
        tone="blue"
      >
        {errors.steps && <div className="field-error" style={{ marginBottom: 10 }}>{errors.steps}</div>}
        {steps.map((s, i) => (
          <div className="cat-panel" key={i} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span className="cat-no">{pad(i + 1)}</span>
              <strong className="cat-title">{s.title || 'Untitled step'}</strong>
              <span className="cat-actions">
                <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move step up">
                  <Icon name="up" size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={i === steps.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move step down"
                >
                  <Icon name="down" size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  disabled={steps.length <= 1}
                  onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
                  aria-label="Delete step"
                >
                  <Icon name="trash" size={16} />
                </button>
              </span>
            </div>
            <Field
              label="Title"
              required
              maxLength={60}
              value={s.title}
              error={errors[`steps.${i}.title`]}
              onChange={(e) => patch(i, { title: e.target.value })}
            />
            <Field
              label="Description"
              required
              as="textarea"
              rows={3}
              counter={200}
              value={s.description}
              error={errors[`steps.${i}.description`]}
              onChange={(e) => patch(i, { description: e.target.value })}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={steps.length >= MAX_STEPS}
          onClick={() => setSteps([...steps, { title: '', description: '' }])}
        >
          <Icon name="plus" size={16} /> Add step
        </button>
      </FormSection>
    </SettingsPage>
  )
}
