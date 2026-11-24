import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const MAX_FAQS = 20
const pad = (n) => String(n).padStart(2, '0')

function validate(v) {
  const e = {}
  const range = (key, label, min, max) => {
    const n = v[key].trim().length
    if (!n) e[key] = `${label} is required`
    else if (n < min || n > max) e[key] = `${label} must be ${min}-${max} characters`
  }
  range('eyebrow', 'Eyebrow text', 2, 40)
  range('heading', 'Heading', 5, 100)
  range('description', 'Description', 20, 250)

  if (v.items.length < 1) e.items = 'Add at least one question'
  const seen = new Set()
  v.items.forEach((q, i) => {
    const qn = q.question.trim().replace(/\s+/g, ' ')
    if (qn.length < 5 || qn.length > 150) e[`items.${i}.question`] = 'Question must be 5-150 characters'
    else if (seen.has(qn.toLowerCase())) e[`items.${i}.question`] = 'This question is already listed'
    seen.add(qn.toLowerCase())
    const an = q.answer.trim().length
    if (an < 10 || an > 800) e[`items.${i}.answer`] = 'Answer must be 10-800 characters'
  })
  return e
}

export default function Faqs() {
  const form = useSettingsForm('/settings/faq', { eyebrow: '', heading: '', description: '', items: [] })
  const { values, errors } = form
  const items = values.items

  const setItems = (next) => form.set('items', next)
  const patch = (i, p) => setItems(items.map((q, idx) => (idx === i ? { ...q, ...p } : q)))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
  }

  return (
    <SettingsPage
      title="FAQs"
      subtitle="Frequently asked questions shown as an accordion on the website."
      form={form}
      validate={validate}
    >
      <FormSection icon="text" title="Section heading" description="Heading and intro text above the questions.">
        <Field label="Eyebrow text" required maxLength={40} hint="Small green line above the heading." {...form.bind('eyebrow')} />
        <Field label="Heading" required maxLength={100} {...form.bind('heading')} />
        <Field label="Description" required as="textarea" rows={3} counter={250} {...form.bind('description')} />
      </FormSection>

      <FormSection
        icon="faq"
        title="Questions"
        description={`${items.length} of ${MAX_FAQS}. The first question opens by default on the website.`}
        tone="blue"
      >
        {errors.items && <div className="field-error" style={{ marginBottom: 10 }}>{errors.items}</div>}
        {items.map((q, i) => (
          <div className="cat-panel" key={i} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span className="cat-no">{pad(i + 1)}</span>
              <strong className="cat-title">{q.question || 'Untitled question'}</strong>
              <span className="cat-actions">
                <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move question up">
                  <Icon name="up" size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move question down"
                >
                  <Icon name="down" size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  disabled={items.length <= 1}
                  onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                  aria-label="Delete question"
                >
                  <Icon name="trash" size={16} />
                </button>
              </span>
            </div>
            <Field
              label="Question"
              required
              maxLength={150}
              value={q.question}
              error={errors[`items.${i}.question`]}
              onChange={(e) => patch(i, { question: e.target.value })}
            />
            <Field
              label="Answer"
              required
              as="textarea"
              rows={4}
              counter={800}
              value={q.answer}
              error={errors[`items.${i}.answer`]}
              onChange={(e) => patch(i, { answer: e.target.value })}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={items.length >= MAX_FAQS}
          onClick={() => setItems([...items, { question: '', answer: '' }])}
        >
          <Icon name="plus" size={16} /> Add question
        </button>
      </FormSection>
    </SettingsPage>
  )
}
