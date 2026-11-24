// Notification preferences live in this browser (localStorage), so each admin / device can differ.
const KEY = 'worilo_admin_notify'
const DEFAULTS = { sound: true, volume: 0.6, desktop: false }

export function getNotifySettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveNotifySettings(patch) {
  const next = { ...getNotifySettings(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage blocked: settings just won't persist */
  }
  return next
}

// Soft two-tone chime generated with the Web Audio API (no sound file needed).
export function playChime(volume = 0.6) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[
      [880, 0],
      [1318, 0.16],
    ].forEach(([freq, offset]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.05) * 0.5, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.55)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.6)
    })
    setTimeout(() => ctx.close().catch(() => {}), 1500)
  } catch {
    /* audio blocked until the user interacts with the page */
  }
}
