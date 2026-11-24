import Field from '../components/Field.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

function validate(v) {
  const e = {}
  const url = v.credit_url.trim()
  if (url && !/^https?:\/\/[^\s/$.?#].\S*$/i.test(url)) e.credit_url = 'Credit link must be a valid http(s) URL'
  return e
}

export default function Credits() {
  const form = useSettingsForm('/settings/credits', {
    credit_text: 'Designed and Developed by',
    credit_name: 'Vetri IT Systems',
    credit_url: '',
    show_credit: true,
  })
  const { values } = form

  return (
    <SettingsPage
      title="Credits"
      subtitle="Show or hide the credit line in the website footer."
      form={form}
      validate={validate}
    >
      <label className="check" style={{ marginBottom: 18 }}>
        <input
          type="checkbox"
          checked={!!values.show_credit}
          onChange={(e) => form.set('show_credit', e.target.checked)}
        />
        Show credits in the footer
      </label>

      <Field
        label="Link for “Vetri IT Systems”"
        type="url"
        placeholder="https://"
        hint="Where the Vetri IT Systems link should open. Leave blank for plain text."
        {...form.bind('credit_url')}
      />

      <div className="field">
        <span className="field-label">Preview</span>
        <div className="logo-preview dark" style={{ color: '#fff', opacity: values.show_credit ? 1 : 0.4 }}>
          {values.credit_text}&nbsp;
          {values.credit_url ? (
            <a href={values.credit_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
              {values.credit_name}
            </a>
          ) : (
            <strong style={{ color: 'var(--color-accent)' }}>{values.credit_name}</strong>
          )}
        </div>
        {!values.show_credit && <div className="field-hint">Hidden — this line will not appear in the footer.</div>}
      </div>
    </SettingsPage>
  )
}
