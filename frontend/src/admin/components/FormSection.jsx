import Icon from './Icons.jsx'

// A titled block inside a form card: coloured icon tile + heading + one-line description.
export default function FormSection({ icon, title, description, tone = 'green', children }) {
  return (
    <section className="form-section">
      <div className="fs-head">
        <div className={`fs-tile ${tone}`}>
          <Icon name={icon} size={20} />
        </div>
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
