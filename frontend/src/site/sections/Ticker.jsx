// Seconds each item takes to scroll past, per admin speed level 1-5.
const SECONDS_PER_ITEM = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1.2 }

export default function Ticker({ data }) {
  if (!data.show || data.items.length === 0) return null
  const seconds = (SECONDS_PER_ITEM[data.speed] ?? 3) * data.items.length
  const loop = [...data.items, ...data.items]

  return (
    <div className={`s-ticker${data.pause_on_hover ? ' pause' : ''}`} aria-label="Products we source">
      <div className="s-ticker-track" style={{ animationDuration: `${seconds}s` }}>
        {loop.map((t, i) => (
          <span className="s-ticker-item" key={i} aria-hidden={i >= data.items.length}>
            {t}
            <i />
          </span>
        ))}
      </div>
    </div>
  )
}
