import { useState } from 'react'
import { ArrowRight, CircleCheck, Mail, MapPin, MessageSquare, Phone } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import { formatPhone } from '../components/SmartLink.jsx'
import { submitEnquiry } from '../useSite.js'

const EMPTY = {
  name: '',
  email: '',
  company: '',
  phone: '',
  product: '',
  quantity: '',
  destination: '',
  message: '',
  website: '', // honeypot, must stay empty
}

export default function Quote({ data, waMessage }) {
  const [values, setValues] = useState({ ...EMPTY, category: data.categories[0] || '', delivery_terms: data.delivery_terms[0] || '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [doneMessage, setDoneMessage] = useState('')

  const phoneDigits = `${data.phone.country_code}${data.phone.number}`
  const phoneText = formatPhone(data.phone.country_code, data.phone.number)
  const waLink = `https://wa.me/${phoneDigits}${waMessage ? `?text=${encodeURIComponent(waMessage)}` : ''}`

  const bind = (name) => ({
    name,
    value: values[name],
    onChange: (e) => {
      setValues((v) => ({ ...v, [name]: e.target.value }))
      setErrors((er) => ({ ...er, [name]: undefined }))
    },
  })

  function validate() {
    const e = {}
    if (values.name.trim().length < 2) e.name = 'Please enter your full name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) e.email = 'Please enter a valid business email'
    if (values.phone && !/^\+?[0-9][0-9 ()-]{5,24}$/.test(values.phone.trim())) e.phone = 'Use a valid number with country code'
    if (!values.category) e.category = 'Please choose a category'
    return e
  }

  async function onSubmit(ev) {
    ev.preventDefault()
    setFormError('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    setStatus('sending')
    try {
      const res = await submitEnquiry({ ...values, name: values.name.trim(), email: values.email.trim() })
      setDoneMessage(res.message || data.success_message)
      setStatus('done')
    } catch (err) {
      setErrors(err.errors || {})
      setFormError(err.message)
      setStatus('idle')
    }
  }

  const field = (name, label, props = {}) => (
    <div className={`s-field${errors[name] ? ' err' : ''}`}>
      <label htmlFor={`q-${name}`}>
        {label}
        {props.required && ' *'}
      </label>
      <input id={`q-${name}`} {...bind(name)} {...props} required={false} aria-invalid={!!errors[name]} />
      {errors[name] && <span className="s-field-err">{errors[name]}</span>}
    </div>
  )

  return (
    <section id="contact" className="s-section s-quote">
      <div className="s-container s-quote-grid">
        <div className="s-quote-left">
          <Reveal>
            <p className="s-eyebrow-green">{data.eyebrow}</p>
            <h2 className="s-title">{data.heading}</h2>
            <p className="s-lead">{data.description}</p>
          </Reveal>

          <div className="s-contact-cards">
            <Reveal className="s-ccard" delay={0}>
              <span className="s-ccard-icon"><Mail size={22} /></span>
              <div>
                <small>Business email</small>
                <a href={`mailto:${data.email}`}>{data.email}</a>
              </div>
            </Reveal>
            <Reveal className="s-ccard" delay={80}>
              <span className="s-ccard-icon"><Phone size={22} /></span>
              <div>
                <small>Mobile / WhatsApp</small>
                <a href={`tel:+${phoneDigits}`}>{phoneText}</a>
              </div>
            </Reveal>
            <Reveal className="s-ccard" delay={160}>
              <span className="s-ccard-icon"><MapPin size={22} /></span>
              <div>
                <small>Country of origin</small>
                <strong>{data.origin_country}</strong>
              </div>
            </Reveal>
            {data.chat_show && (
              <Reveal as="a" className="s-ccard s-ccard-dark" delay={240} href={waLink} target="_blank" rel="noreferrer">
                <span className="s-ccard-icon green"><MessageSquare size={22} /></span>
                <div>
                  <small>Instant chat</small>
                  <strong>{data.chat_title}</strong>
                </div>
              </Reveal>
            )}
          </div>
        </div>

        <Reveal direction="right" className="s-form-card">
          {status === 'done' ? (
            <div className="s-form-done" role="status">
              <span className="s-done-icon"><CircleCheck size={44} /></span>
              <h3>Request received</h3>
              <p>{doneMessage}</p>
              <button
                type="button"
                className="s-btn s-btn-outline-dark"
                onClick={() => {
                  setValues({ ...EMPTY, category: data.categories[0] || '', delivery_terms: data.delivery_terms[0] || '' })
                  setStatus('idle')
                }}
              >
                Send another request
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <h3>{data.form_title}</h3>
              <p className="s-form-sub">{data.form_subtitle}</p>

              {formError && <div className="s-form-error" role="alert">{formError}</div>}

              <div className="s-form-grid">
                {field('name', 'Full name', { required: true, placeholder: 'Your name', autoComplete: 'name' })}
                {field('email', 'Business email', { required: true, type: 'email', placeholder: 'you@company.com', autoComplete: 'email' })}
                {field('company', 'Company', { placeholder: 'Company name', autoComplete: 'organization' })}
                {field('phone', 'Phone / WhatsApp', { placeholder: '+ Country code & number', inputMode: 'tel', autoComplete: 'tel' })}

                <div className={`s-field${errors.category ? ' err' : ''}`}>
                  <label htmlFor="q-category">Product category *</label>
                  <select id="q-category" {...bind('category')}>
                    {data.categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  {errors.category && <span className="s-field-err">{errors.category}</span>}
                </div>
                {field('product', 'Product(s) of interest', { placeholder: 'e.g. Basmati rice, turmeric' })}
                {field('quantity', 'Quantity', { placeholder: 'e.g. 1 x 20ft container' })}
                {field('destination', 'Destination country / port', { placeholder: 'e.g. Rotterdam, Netherlands' })}

                <div className="s-field wide">
                  <label htmlFor="q-delivery_terms">Preferred delivery terms</label>
                  <select id="q-delivery_terms" {...bind('delivery_terms')}>
                    {data.delivery_terms.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="s-field wide">
                  <label htmlFor="q-message">Specifications &amp; notes</label>
                  <textarea id="q-message" rows={4} placeholder="Grade, packaging, quality requirements, delivery timeline…" {...bind('message')} />
                </div>

                <div className="s-hp" aria-hidden="true">
                  <label htmlFor="q-website">Website</label>
                  <input id="q-website" tabIndex={-1} autoComplete="off" {...bind('website')} />
                </div>
              </div>

              <button type="submit" className="s-btn s-btn-green s-submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : data.submit_label} <ArrowRight size={18} />
              </button>
              <p className="s-disclaimer">{data.disclaimer}</p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
