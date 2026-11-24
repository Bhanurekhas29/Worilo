import Icon from './Icons.jsx'

// Editable ordered list of short text values (add, rename, reorder, remove).
export default function StringListEditor({ label, items, onChange, max, maxLength = 50, placeholder, error, addLabel = 'Add item' }) {
  const set = (i, text) => onChange(items.map((t, idx) => (idx === i ? text : t)))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="field">
      <span className="field-label">
        {label}
        <span className="label-note">
          {items.length} of {max}
        </span>
      </span>
      {items.map((t, i) => (
        <div className="ticker-row" key={i}>
          <span className="ticker-num">{i + 1}</span>
          <input
            type="text"
            value={t}
            maxLength={maxLength}
            placeholder={placeholder}
            onChange={(e) => set(i, e.target.value)}
            aria-label={`${label} ${i + 1}`}
          />
          <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
            <Icon name="up" size={16} />
          </button>
          <button type="button" className="icon-btn" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
            <Icon name="down" size={16} />
          </button>
          <button
            type="button"
            className="icon-btn danger"
            aria-label="Remove"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      ))}
      {error && <div className="field-error" style={{ marginBottom: 10 }}>{error}</div>}
      <div>
        <button type="button" className="btn btn-outline btn-sm" disabled={items.length >= max} onClick={() => onChange([...items, ''])}>
          <Icon name="plus" size={16} /> {addLabel}
        </button>
      </div>
    </div>
  )
}
