import { Navigate, Route, Routes } from 'react-router-dom'
import SitePage from './site/SitePage.jsx'
import AgriProductsPage from './site/AgriProductsPage.jsx'
import AdminLayout from './admin/layouts/AdminLayout.jsx'
import Login from './admin/pages/Login.jsx'
import Dashboard from './admin/pages/Dashboard.jsx'
import Enquiries from './admin/pages/Enquiries.jsx'
import Users from './admin/pages/Users.jsx'
import Brand from './admin/pages/Brand.jsx'
import Seo from './admin/pages/Seo.jsx'
import EmailSettings from './admin/pages/EmailSettings.jsx'
import Credits from './admin/pages/Credits.jsx'
import MenuCta from './admin/pages/MenuCta.jsx'
import AgriPage from './admin/pages/AgriPage.jsx'
import Hero from './admin/pages/Hero.jsx'
import Ticker from './admin/pages/Ticker.jsx'
import Products from './admin/pages/Products.jsx'
import Farmgate from './admin/pages/Farmgate.jsx'
import Partner from './admin/pages/Partner.jsx'
import HowItWorks from './admin/pages/HowItWorks.jsx'
import GlobalMarkets from './admin/pages/GlobalMarkets.jsx'
import Faqs from './admin/pages/Faqs.jsx'
import QuoteForm from './admin/pages/QuoteForm.jsx'
import Footer from './admin/pages/Footer.jsx'
import Account from './admin/pages/Account.jsx'
import FloatingIcons from './admin/pages/FloatingIcons.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SitePage />} />
      <Route path="/agricultural-products" element={<AgriProductsPage />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="users" element={<Users />} />
        <Route path="brand" element={<Brand />} />
        <Route path="seo" element={<Seo />} />
        <Route path="email-settings" element={<EmailSettings />} />
        <Route path="credits" element={<Credits />} />
        <Route path="menu-cta" element={<MenuCta />} />
        <Route path="hero" element={<Hero />} />
        <Route path="ticker" element={<Ticker />} />
        <Route path="products" element={<Products />} />
        <Route path="agri-page" element={<AgriPage />} />
        <Route path="farmgate" element={<Farmgate />} />
        <Route path="partner" element={<Partner />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="global-markets" element={<GlobalMarkets />} />
        <Route path="faqs" element={<Faqs />} />
        <Route path="quote-form" element={<QuoteForm />} />
        <Route path="footer" element={<Footer />} />
        <Route path="account" element={<Account />} />
        <Route path="floating-icons" element={<FloatingIcons />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
