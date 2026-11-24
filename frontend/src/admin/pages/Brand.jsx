import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const imgRe = /^(\/[A-Za-z0-9_./-]+|https?:\/\/\S+)\.(png|jpe?g|svg|webp|avif|gif|ico)(\?\S*)?$/i

function validate(v) {
  const e = {}
  const name = v.company_name.trim()
  if (!name) e.company_name = 'Company name is required'
  else if (name.length < 2 || name.length > 100) e.company_name = 'Company name must be 2-100 characters'
  for (const [key, label] of [['header_logo', 'Header logo'], ['footer_logo', 'Footer logo'], ['favicon', 'Favicon']]) {
    const val = v[key].trim()
    if (val && !imgRe.test(val)) e[key] = `${label} must be a path like /images/logo.png or an image URL`
  }
  return e
}

export default function Brand() {
  const form = useSettingsForm('/settings/brand', { company_name: '', header_logo: '', footer_logo: '', favicon: '' })
  const { values } = form

  return (
    <SettingsPage
      title="Brand"
      subtitle="Company name and logos used across the website."
      form={form}
      validate={validate}
    >
      <FormSection icon="building" title="Company" description="The name shown across the website.">
        <Field label="Company name" required maxLength={100} icon="building" {...form.bind('company_name')} />
      </FormSection>

      <FormSection icon="image" title="Logos" description="Image paths for the header and footer." tone="blue">
        <Field
          label="Header logo"
          icon="image"
          placeholder="/images/logo.png"
          hint="Put the file in frontend/public/images and enter its path, e.g. /images/logo.png"
          {...form.bind('header_logo')}
        />
        {values.header_logo && !form.errors.header_logo && (
          <div className="logo-preview" style={{ marginTop: -8, marginBottom: 22 }}>
            <img src={values.header_logo} alt="Header logo preview" />
          </div>
        )}

        <Field
          label="Footer logo"
          icon="image"
          placeholder="/images/logo-white.png"
          hint="Usually the light/white version of the logo."
          {...form.bind('footer_logo')}
        />
        {values.footer_logo && !form.errors.footer_logo && (
          <div className="logo-preview dark" style={{ marginTop: -8, marginBottom: 22 }}>
            <img src={values.footer_logo} alt="Footer logo preview" />
          </div>
        )}

        <Field
          label="Favicon"
          icon="image"
          placeholder="/images/favicon.png"
          hint="The small icon shown on the browser tab. Use a square image (PNG, ICO or SVG), ideally 256x256."
          {...form.bind('favicon')}
        />
        {values.favicon && !form.errors.favicon && (
          <div className="favicon-preview">
            <span className="tab-mock">
              <img src={values.favicon} alt="" />
              <span>{values.company_name || 'Website'}</span>
            </span>
            <span className="tab-mock small">
              <img src={values.favicon} alt="Favicon preview" />
            </span>
            <small>Browser tab preview</small>
          </div>
        )}
      </FormSection>
    </SettingsPage>
  )
}
