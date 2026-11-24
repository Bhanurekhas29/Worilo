import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import PhoneField, { phoneProblem } from '../components/PhoneField.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import StringListEditor from '../components/StringListEditor.jsx'
import useSettingsForm, { isEmail } from '../useSettingsForm.js'

const MAX_OPTIONS = 12

function listProblem(list, label, maxLen) {
  if (list.length === 0) return `Add at least one ${label}`
  const seen = new Set()
  for (let i = 0; i < list.length; i++) {
    const t = list[i].trim().replace(/\s+/g, ' ')
    if (t.length < 2 || t.length > maxLen) return `${label[0].toUpperCase()}${label.slice(1)} ${i + 1} must be 2-${maxLen} characters`
    if (seen.has(t.toLowerCase())) return `"${t}" is listed twice`
    seen.add(t.toLowerCase())
  }
  return null
}

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
  if (!v.email.trim()) e.email = 'Business email is required'
  else if (!isEmail(v.email.trim())) e.email = 'Enter a valid business email'
  const phone = phoneProblem(v.phone, true)
  if (phone) e.phone = phone
  range('origin_country', 'Country of origin', 2, 40)
  if (v.chat_show) range('chat_title', 'Chat card title', 2, 40)
  range('form_title', 'Form title', 3, 60)
  range('form_subtitle', 'Form sub-text', 10, 150)
  range('submit_label', 'Submit button label', 2, 40)
  range('disclaimer', 'Disclaimer', 20, 300)
  range('success_message', 'Success message', 10, 200)
  const cat = listProblem(v.categories, 'product category', 50)
  if (cat) e.categories = cat
  const terms = listProblem(v.delivery_terms, 'delivery term', 30)
  if (terms) e.delivery_terms = terms
  return e
}

export default function QuoteForm() {
  const form = useSettingsForm('/settings/quote', {
    eyebrow: '',
    heading: '',
    description: '',
    email: '',
    phone: { country_code: '91', number: '' },
    origin_country: '',
    chat_show: true,
    chat_title: '',
    form_title: '',
    form_subtitle: '',
    submit_label: '',
    disclaimer: '',
    success_message: '',
    categories: [],
    delivery_terms: [],
  })
  const { values } = form

  return (
    <SettingsPage
      title="Quote Form"
      subtitle="“Get in touch” text, contact details and the quote request form."
      form={form}
      validate={validate}
    >
      <FormSection icon="text" title="Left side text" description="Heading shown beside the form.">
        <Field label="Eyebrow text" required maxLength={40} hint="Small green line above the heading." {...form.bind('eyebrow')} />
        <Field label="Heading" required as="textarea" rows={2} counter={100} {...form.bind('heading')} />
        <Field label="Description" required as="textarea" rows={4} counter={400} {...form.bind('description')} />
      </FormSection>

      <FormSection icon="mail" title="Contact details" description="Shown as cards under the heading." tone="blue">
        <Field label="Business email" required icon="mail" type="email" {...form.bind('email')} />
        <PhoneField
          label="Mobile / WhatsApp"
          required
          value={values.phone}
          onChange={(p) => form.set('phone', p)}
          error={form.errors.phone}
          hint="Used for the phone card and the WhatsApp chat link."
        />
        <Field label="Country of origin" required maxLength={40} {...form.bind('origin_country')} />

        <label className="check" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={!!values.chat_show} onChange={(e) => form.set('chat_show', e.target.checked)} />
          Show the “Instant chat” WhatsApp card
        </label>
        {values.chat_show && <Field label="Chat card title" required maxLength={40} {...form.bind('chat_title')} />}
      </FormSection>

      <FormSection icon="buttons" title="Form card text" description="Texts on the quote request form." tone="navy">
        <div className="field-row">
          <Field label="Form title" required maxLength={60} {...form.bind('form_title')} />
          <Field label="Submit button label" required maxLength={40} {...form.bind('submit_label')} />
        </div>
        <Field label="Form sub-text" required counter={150} {...form.bind('form_subtitle')} />
        <Field label="Disclaimer" required as="textarea" rows={3} counter={300} hint="Small print under the submit button." {...form.bind('disclaimer')} />
        <Field
          label="Success message"
          required
          as="textarea"
          rows={2}
          counter={200}
          hint="Shown to the visitor after they submit the form."
          {...form.bind('success_message')}
        />
      </FormSection>

      <FormSection icon="tags" title="Dropdown options" description="Choices visitors can pick in the form.">
        <StringListEditor
          label="Product category"
          items={values.categories}
          onChange={(list) => form.set('categories', list)}
          max={MAX_OPTIONS}
          maxLength={50}
          placeholder="e.g. Agricultural Products"
          error={form.errors.categories}
          addLabel="Add category"
        />
        <StringListEditor
          label="Preferred delivery terms"
          items={values.delivery_terms}
          onChange={(list) => form.set('delivery_terms', list)}
          max={MAX_OPTIONS}
          maxLength={30}
          placeholder="e.g. FOB"
          error={form.errors.delivery_terms}
          addLabel="Add term"
        />
      </FormSection>
    </SettingsPage>
  )
}
