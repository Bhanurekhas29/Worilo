import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm from '../useSettingsForm.js'

const keywords = (s) => s.split(/[,\n]+/).map((k) => k.trim()).filter(Boolean)

function validate(v) {
  const e = {}
  const title = v.meta_title.trim()
  if (!title) e.meta_title = 'Meta title is required'
  else if (title.length < 10 || title.length > 70) e.meta_title = 'Meta title must be 10-70 characters'

  const desc = v.meta_description.trim()
  if (!desc) e.meta_description = 'Meta description is required'
  else if (desc.length < 50 || desc.length > 160) e.meta_description = 'Meta description must be 50-160 characters'

  const primary = keywords(v.primary_keywords)
  if (!primary.length) e.primary_keywords = 'Primary keywords are required'
  else if (primary.length > 10) e.primary_keywords = 'Use at most 10 primary keywords'
  else if (primary.some((k) => k.length < 2 || k.length > 60)) e.primary_keywords = 'Each keyword must be 2-60 characters'

  const secondary = keywords(v.secondary_keywords)
  if (secondary.length > 30) e.secondary_keywords = 'Use at most 30 secondary keywords'
  else if (secondary.some((k) => k.length < 2 || k.length > 60)) e.secondary_keywords = 'Each keyword must be 2-60 characters'
  return e
}

export default function Seo() {
  const form = useSettingsForm('/settings/seo', {
    meta_title: '',
    meta_description: '',
    primary_keywords: '',
    secondary_keywords: '',
  })

  return (
    <SettingsPage
      title="SEO"
      subtitle="How the website appears in search engines."
      form={form}
      validate={validate}
    >
      <FormSection icon="search" title="Search appearance" description="The title and snippet shown in Google results.">
        <Field
          label="Meta title"
          required
          counter={70}
          hint="Recommended: 50-60 characters."
          {...form.bind('meta_title')}
        />
        <Field
          label="Meta description"
          as="textarea"
          rows={3}
          required
          counter={160}
          hint="Recommended: 120-160 characters."
          {...form.bind('meta_description')}
        />
      </FormSection>

      <FormSection icon="tags" title="Keywords" description="Search terms the website should rank for." tone="blue">
        <Field
          label="Primary keywords"
          as="textarea"
          rows={2}
          required
          hint="Separate with commas. Up to 10 keywords."
          {...form.bind('primary_keywords')}
        />
        <Field
          label="Secondary keywords"
          as="textarea"
          rows={3}
          hint="Separate with commas. Up to 30 keywords."
          {...form.bind('secondary_keywords')}
        />
      </FormSection>
    </SettingsPage>
  )
}
