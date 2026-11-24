import { useId } from 'react'
import Icon from './Icons.jsx'

// Label + input/textarea/select + hint + error. `as` can be 'input' | 'textarea' | 'select'.
// `icon` shows a leading icon; `digitsOnly` strips everything except 0-9 as the user types.
export default function Field({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  required,
  as = 'input',
  type = 'text',
  maxLength,
  counter,
  icon,
  digitsOnly,
  children,
  ...rest
}) {
  const id = useId()
  const Tag = as
  const len = (value || '').length

  function handleChange(e) {
    if (digitsOnly) e.target.value = e.target.value.replace(/\D/g, '')
    onChange(e)
  }

  const control = (
    <Tag
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      type={as === 'input' ? type : undefined}
      maxLength={maxLength}
      inputMode={digitsOnly ? 'numeric' : rest.inputMode}
      className={icon ? 'has-icon' : undefined}
      aria-invalid={!!error}
      {...rest}
    >
      {children}
    </Tag>
  )

  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req">*</span>}
        {digitsOnly && <span className="label-note">digits only</span>}
      </label>
      {icon ? (
        <div className="input-wrap">
          <Icon name={icon} size={18} />
          {control}
        </div>
      ) : (
        control
      )}
      {counter && (
        <span className={`field-counter${len > counter ? ' over' : ''}`}>
          {len}/{counter}
        </span>
      )}
      {error && <div className="field-error">{error}</div>}
      {hint && !error && <div className="field-hint">{hint}</div>}
    </div>
  )
}
