// Shared page chrome for settings forms: heading, card, status banner, Save and Discard.
export default function SettingsPage({ title, subtitle, form, validate, children }) {
  function onSubmit(e) {
    e.preventDefault()
    form.save(validate)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <form className="card form-card" onSubmit={onSubmit} noValidate>
        {form.status.message && (
          <div className={`alert alert-${form.status.type}`} role="status">
            {form.status.message}
          </div>
        )}
        {form.loading ? <p>Loading…</p> : children}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={form.saving || form.loading}>
            {form.saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" className="btn btn-outline" disabled={!form.dirty || form.saving} onClick={form.reset}>
            Discard
          </button>
          {form.dirty && <span className="unsaved">Unsaved changes</span>}
        </div>
      </form>
    </>
  )
}
