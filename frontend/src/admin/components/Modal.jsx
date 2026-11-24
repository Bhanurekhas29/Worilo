import Icon from './Icons.jsx'

// Popup. It can only be closed with the Back button (top) or a Cancel/Close button in the
// body, so a stray Esc press or click outside never throws away what was typed.
export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="modal-back" onClick={onClose}>
          <Icon name="back" size={16} /> Back
        </button>
        <div className="modal-head">
          <h3>{title}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}
