import { useId } from 'react'

// Worldwide phone input: country-code dropdown + digits-only number.
// Value shape: { country_code: '91', number: '9876543210' }. Validate with phoneProblem().
export const COUNTRY_CODES = [
  ['91', 'India'], ['1', 'USA / Canada'], ['44', 'United Kingdom'], ['971', 'UAE'], ['966', 'Saudi Arabia'],
  ['974', 'Qatar'], ['968', 'Oman'], ['965', 'Kuwait'], ['973', 'Bahrain'], ['65', 'Singapore'],
  ['60', 'Malaysia'], ['61', 'Australia'], ['64', 'New Zealand'], ['49', 'Germany'], ['33', 'France'],
  ['39', 'Italy'], ['34', 'Spain'], ['31', 'Netherlands'], ['32', 'Belgium'], ['41', 'Switzerland'],
  ['46', 'Sweden'], ['47', 'Norway'], ['45', 'Denmark'], ['358', 'Finland'], ['48', 'Poland'],
  ['7', 'Russia'], ['90', 'Turkey'], ['20', 'Egypt'], ['27', 'South Africa'], ['234', 'Nigeria'],
  ['254', 'Kenya'], ['255', 'Tanzania'], ['233', 'Ghana'], ['212', 'Morocco'], ['86', 'China'],
  ['81', 'Japan'], ['82', 'South Korea'], ['852', 'Hong Kong'], ['66', 'Thailand'], ['84', 'Vietnam'],
  ['62', 'Indonesia'], ['63', 'Philippines'], ['880', 'Bangladesh'], ['94', 'Sri Lanka'], ['977', 'Nepal'],
  ['92', 'Pakistan'], ['55', 'Brazil'], ['52', 'Mexico'], ['54', 'Argentina'], ['56', 'Chile'],
]

export function phoneProblem(v, required = false) {
  const n = (v.number || '').trim()
  if (!n) return required ? 'Phone number is required' : null
  if (!/^\d+$/.test(n)) return 'Phone number can only contain digits'
  if (n.length < 6 || n.length > 14) return 'Enter 6 to 14 digits'
  return null
}

export default function PhoneField({ label = 'Phone number', required, value, onChange, error, hint }) {
  const id = useId()
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req">*</span>}
        <span className="label-note">digits only</span>
      </label>
      <div className="phone-row">
        <select
          value={value.country_code}
          onChange={(e) => onChange({ ...value, country_code: e.target.value })}
          aria-label="Country code"
        >
          {COUNTRY_CODES.map(([code, name]) => (
            <option key={name} value={code}>
              +{code} {name}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={14}
          value={value.number}
          onChange={(e) => onChange({ ...value, number: e.target.value.replace(/\D/g, '') })}
          aria-invalid={!!error}
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>
      {error && <div className="field-error">{error}</div>}
      {hint && !error && <div className="field-hint">{hint}</div>}
    </div>
  )
}
