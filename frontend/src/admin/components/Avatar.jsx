// Profile picture, or the first letter of the name when there is none.
export default function Avatar({ admin, size = 46 }) {
  const name = admin.name || admin.username || '?'
  return (
    <span
      className="admin-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {admin.avatar ? <img src={admin.avatar} alt="" /> : name.charAt(0).toUpperCase()}
    </span>
  )
}
