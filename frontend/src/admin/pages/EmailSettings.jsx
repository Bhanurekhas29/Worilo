import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { adminApi } from '../api.js'
import Field from '../components/Field.jsx'
import FormSection from '../components/FormSection.jsx'
import Icon from '../components/Icons.jsx'
import SettingsPage from '../components/SettingsPage.jsx'
import useSettingsForm, { isEmail } from '../useSettingsForm.js'

const hostRe = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

export default function EmailSettings() {
  const { admin } = useOutletContext()
  const form = useSettingsForm('/settings/email', {
    smtp_host: '',
    smtp_port: '587',
    encryption: 'tls',
    smtp_username: '',
    smtp_password: '',
    current_password: '',
    from_email: '',
    from_name: '',
    notify_email: '',
  })
  const [replacing, setReplacing] = useState(false)
  const [test, setTest] = useState({ state: 'idle', message: '' }) // idle | sending | ok | error

  async function sendTest() {
    setTest({ state: 'sending', message: '' })
    try {
      const res = await adminApi.post('/settings/email_test', {})
      setTest({ state: 'ok', message: `Test email sent to ${res.to}. Check the inbox (and spam folder).` })
    } catch (err) {
      setTest({ state: 'error', message: err.message })
    }
  }
  const hasPassword = !!form.meta.has_password
  const changing = replacing || (!form.loading && !hasPassword)

  function cancelReplace() {
    setReplacing(false)
    form.set('smtp_password', '')
    form.set('current_password', '')
  }

  function validate(v) {
    const e = {}
    const host = v.smtp_host.trim()
    if (!host) e.smtp_host = 'SMTP host is required'
    else if (!hostRe.test(host) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) e.smtp_host = 'Enter a valid host, e.g. smtp.gmail.com'

    const port = String(v.smtp_port).trim()
    if (!port) e.smtp_port = 'SMTP port is required'
    else if (!/^\d+$/.test(port) || +port < 1 || +port > 65535) e.smtp_port = 'Port must be a number between 1 and 65535'

    const user = v.smtp_username.trim()
    if (!user) e.smtp_username = 'SMTP username is required'
    else if (/\s/.test(user)) e.smtp_username = 'Enter a valid SMTP username (no spaces)'

    if (changing) {
      const pw = v.smtp_password.replace(/\s+/g, '')
      if (!pw) e.smtp_password = 'App password is required'
      else if (pw.length < 8 || pw.length > 100) e.smtp_password = 'App password must be 8-100 characters'
      else if (host.toLowerCase().endsWith('gmail.com') && !/^[a-z]{16}$/i.test(pw)) {
        e.smtp_password = 'A Gmail app password is 16 letters (spaces are ignored)'
      }
      if (!v.current_password) e.current_password = 'Enter your admin password to change the app password'
    }

    if (!v.from_email.trim()) e.from_email = 'From email is required'
    else if (!isEmail(v.from_email.trim())) e.from_email = 'Enter a valid from email'
    if (v.from_name.trim().length < 2) e.from_name = 'From name must be at least 2 characters'
    if (!v.notify_email.trim()) e.notify_email = 'Notification email is required'
    else if (!isEmail(v.notify_email.trim())) e.notify_email = 'Enter a valid notification email'
    return e
  }

  // Wrap save so the replace panel closes once the new password is stored.
  const wrapped = {
    ...form,
    reset: () => {
      setReplacing(false)
      form.reset()
    },
    save: async (v) => {
      if (await form.save(v)) setReplacing(false)
    },
  }

  if (!admin.is_super) {
    return <div className="alert alert-error">Only the superuser can manage email settings.</div>
  }

  return (
    <SettingsPage
      title="Email Settings"
      subtitle="SMTP details used to send enquiry notifications."
      form={wrapped}
      validate={validate}
    >
      <FormSection icon="server" title="SMTP server" description="Where enquiry emails are sent from.">
        <Field label="SMTP host" required icon="globe" placeholder="smtp.gmail.com" {...form.bind('smtp_host')} />
        <div className="field-row">
          <Field label="SMTP port" required icon="hash" digitsOnly maxLength={5} placeholder="587" {...form.bind('smtp_port')} />
          <Field label="Encryption" as="select" required {...form.bind('encryption')}>
            <option value="tls">TLS (port 587)</option>
            <option value="ssl">SSL (port 465)</option>
            <option value="none">None</option>
          </Field>
        </div>
      </FormSection>

      <FormSection icon="lock" title="Authentication" description="Account used to log in to the SMTP server." tone="blue">
        <Field
          label="SMTP username"
          required
          icon="user"
          placeholder="you@gmail.com"
          autoComplete="off"
          {...form.bind('smtp_username')}
        />

        {!changing ? (
          <div className="field">
            <label>
              App password
              <span className="secure-badge">
                <Icon name="lock" size={13} /> Encrypted
              </span>
            </label>
            <div className="secret-row">
              <div className="secret-mask" aria-label="App password is saved and hidden">
                <Icon name="key" size={18} />
                ••••••••••••••••
              </div>
              <button type="button" className="btn btn-outline" onClick={() => setReplacing(true)}>
                Replace
              </button>
            </div>
            <div className="field-hint">
              Saved and hidden. It can never be viewed again, only replaced.
              {form.meta.password_updated && ` Last updated ${form.meta.password_updated}.`}
            </div>
          </div>
        ) : (
          <>
            <Field
              label="Your admin password"
              required
              icon="shield"
              type="password"
              autoComplete="current-password"
              hint="Confirm it's you before the app password is changed."
              {...form.bind('current_password')}
            />
            <Field
              label="New app password"
              required
              icon="key"
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              data-lpignore="true"
              placeholder="xxxx xxxx xxxx xxxx"
              hint="Paste it straight from Google. Spaces are ignored. It's stored encrypted and never shown again."
              {...form.bind('smtp_password')}
            />
            {hasPassword && (
              <button type="button" className="btn btn-outline btn-sm" onClick={cancelReplace} style={{ marginBottom: 6 }}>
                Cancel
              </button>
            )}
          </>
        )}
      </FormSection>

      <FormSection icon="send" title="Sender and notifications" description="Who emails come from and where enquiries go." tone="navy">
        <div className="field-row">
          <Field label="From email" required icon="mail" type="email" {...form.bind('from_email')} />
          <Field label="From name" required {...form.bind('from_name')} />
        </div>
        <Field
          label="Notification email"
          required
          icon="mail"
          type="email"
          hint="New enquiries are sent to this address."
          {...form.bind('notify_email')}
        />
      </FormSection>

      <FormSection icon="send" title="Test your setup" description="Send a test email to the notification address above." tone="blue">
        {test.message && <div className={`alert alert-${test.state === 'ok' ? 'success' : 'error'}`}>{test.message}</div>}
        <button
          type="button"
          className="btn btn-outline"
          onClick={sendTest}
          disabled={test.state === 'sending' || form.dirty || !hasPassword}
        >
          <Icon name={test.state === 'sending' ? 'spinner' : 'send'} size={18} /> {test.state === 'sending' ? 'Sending…' : 'Send test email'}
        </button>
        {(form.dirty || !hasPassword) && (
          <div className="field-hint" style={{ marginTop: 8 }}>
            {!hasPassword ? 'Save your settings with the app password first.' : 'Save your changes first, then send the test.'}
          </div>
        )}
      </FormSection>
    </SettingsPage>
  )
}
