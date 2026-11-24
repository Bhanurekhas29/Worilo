// Sidebar menu definition. Add new admin pages here (and a <Route> in App.jsx).
// `group` renders a section heading above the items that follow it.
// `superOnly` hides the item from non-superuser admins.
export const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { href: '/', label: 'View website', icon: 'external' },
  { to: '/admin/enquiries', label: 'View Enquiries', icon: 'inbox' },
  { group: 'Authentication & Authorization' },
  { to: '/admin/users', label: 'Users', icon: 'users', superOnly: true },
  { to: '/admin/brand', label: 'Brand', icon: 'brand' },
  { to: '/admin/seo', label: 'SEO', icon: 'search' },
  { to: '/admin/email-settings', label: 'Email Settings', icon: 'mail', superOnly: true },
  { to: '/admin/credits', label: 'Credits', icon: 'award' },
  { group: 'Website' },
  { to: '/admin/menu-cta', label: 'Menu & CTA', icon: 'navbar' },
  { to: '/admin/hero', label: 'Hero Section', icon: 'hero' },
  { to: '/admin/ticker', label: 'Scrolling Ticker', icon: 'ticker' },
  { to: '/admin/products', label: 'Our Products', icon: 'products' },
  { to: '/admin/agri-page', label: 'Agricultural Popup', icon: 'products' },
  { to: '/admin/farmgate', label: 'Farmgate Sourcing', icon: 'sprout' },
  { to: '/admin/partner', label: 'Sourcing Partner', icon: 'handshake' },
  { to: '/admin/how-it-works', label: 'How It Works', icon: 'steps' },
  { to: '/admin/global-markets', label: 'Global Markets', icon: 'markets' },
  { to: '/admin/faqs', label: 'FAQs', icon: 'faq' },
  { to: '/admin/quote-form', label: 'Quote Form', icon: 'quote' },
  { to: '/admin/footer', label: 'Footer', icon: 'footer' },
  { to: '/admin/floating-icons', label: 'Floating Icons', icon: 'floating' },
]

const extraTitles = { '/admin/account': 'Account settings' }

export function pageTitle(pathname) {
  const match = navItems.find((i) => i.to === pathname)
  return match ? match.label : extraTitles[pathname] || 'Dashboard'
}
