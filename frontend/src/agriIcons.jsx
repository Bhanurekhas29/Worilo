import { Apple, Bean, Droplet, FlaskConical, Flame, Leaf, Nut, Package, Sprout, Wheat } from 'lucide-react'

// Icons selectable for the cards on the Agricultural Products page (keys are stored by the API).
export const agriIcons = {
  wheat: { label: 'Rice / wheat', Cmp: Wheat },
  sprout: { label: 'Grains / sprout', Cmp: Sprout },
  bean: { label: 'Pulses / beans', Cmp: Bean },
  leaf: { label: 'Seeds / leaf', Cmp: Leaf },
  flame: { label: 'Spices', Cmp: Flame },
  droplet: { label: 'Oils', Cmp: Droplet },
  apple: { label: 'Fruits', Cmp: Apple },
  flask: { label: 'Chemicals', Cmp: FlaskConical },
  nut: { label: 'Nuts', Cmp: Nut },
  package: { label: 'Package', Cmp: Package },
}

export function AgriIcon({ name, size = 16 }) {
  const Cmp = agriIcons[name]?.Cmp
  return Cmp ? <Cmp size={size} strokeWidth={1.8} aria-hidden="true" /> : null
}
