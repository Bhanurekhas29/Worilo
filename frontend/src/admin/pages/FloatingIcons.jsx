import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import PhoneField, { phoneProblem } from '../components/PhoneField.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm, { isEmail } from '../useSettingsForm.js'

function validate(v) {
  const e = {}
  if (v.whatsapp.show) {
    const p = phoneProblem(v.whatsapp.phone, true)
    if (p) e['whatsapp.phone'] = p
  }
  const m = v.whatsapp.message.trim().length
  if (m && (m < 5 || m > 200)) e['whatsapp.message'] = 'Pre-filled message must be 5-200 characters'
  if (v.phone.show) {
    const p = phoneProblem(v.phone.phone, true)
    if (p) e['phone.phone'] = p
  }
  if (v.email.show) {
    if (!v.email.address.trim()) e['email.address'] = 'Email address is required'
    else if (!isEmail(v.email.address.trim())) e['email.address'] = 'Enter a valid email address'
  }
  return e
}

export default function FloatingIcons() {
  const form = useSettingsForm('/settings/floating', {
    side: 'right',
    whatsapp: { show: true, phone: { country_code: '91', number: '' }, message: '' },
    phone: { show: true, phone: { country_code: '91', number: '' } },
    email: { show: true, address: '' },
  })
  const { values, errors } = form

  const patch = (group, p) => form.set(group, { ...values[group], ...p })

  return (
    <SettingsPage
      title="Floating Icons"
      subtitle="The WhatsApp, phone and email buttons that float on every page."
      form={form}
      validate={validate}
    >
      <FormSection icon="floating" title="Position" description="Which edge of the screen the icons stick to.">
        <Field label="Side" as="select" {...form.bind('side')}>
          <option value="right">Right</option>
          <option value="left">Left</option>
        </Field>
      </FormSection>

      <FormSection icon="message" title="WhatsApp" description="Green chat button. Opens WhatsApp with your number.">
        <label className="check" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={values.whatsapp.show} onChange={(e) => patch('whatsapp', { show: e.target.checked })} />
          Show the WhatsApp icon
        </label>
        <PhoneField
          label="WhatsApp number"
          required={values.whatsapp.show}
          value={values.whatsapp.phone}
          onChange={(p) => patch('whatsapp', { phone: p })}
          error={errors['whatsapp.phone']}
        />
        <Field
          label="Pre-filled message"
          as="textarea"
          rows={2}
          counter={200}
          hint="The text that appears in the visitor's WhatsApp chat box. Optional."
          value={values.whatsapp.message}
          error={errors['whatsapp.message']}
          onChange={(e) => patch('whatsapp', { message: e.target.value })}
        />
      </FormSection>

      <FormSection icon="floating" title="Phone call" description="Blue call button. Dials your number on mobile." tone="blue">
        <label className="check" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={values.phone.show} onChange={(e) => patch('phone', { show: e.target.checked })} />
          Show the phone icon
        </label>
        <PhoneField
          label="Phone number"
          required={values.phone.show}
          value={values.phone.phone}
          onChange={(p) => patch('phone', { phone: p })}
          error={errors['phone.phone']}
        />
      </FormSection>

      <FormSection icon="mail" title="Email" description="White mail button. Opens the visitor's email app." tone="navy">
        <label className="check" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={values.email.show} onChange={(e) => patch('email', { show: e.target.checked })} />
          Show the email icon
        </label>
        <Field
          label="Email address"
          required={values.email.show}
          icon="mail"
          type="email"
          value={values.email.address}
          error={errors['email.address']}
          onChange={(e) => patch('email', { address: e.target.value })}
        />
      </FormSection>
    </SettingsPage>
  )
}
