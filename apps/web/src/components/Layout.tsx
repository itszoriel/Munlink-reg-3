import { Outlet, Link, useLocation } from 'react-router-dom'
import { useRef } from 'react'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import MunicipalitySelect from './MunicipalitySelect'
import BarangaySelect from './BarangaySelect'
import ServicesMenu from './ServicesMenu'
import { useNavigate } from 'react-router-dom'
import Footer from './Footer'
import AuthStatusBanner from './AuthStatusBanner'
import { Toast } from '@munlink/ui'
import LanguageToggle from './LanguageToggle'
import { useLang } from '@/lib/i18n'
import { mediaUrl } from '@/lib/api'
import { Menu, X, Home as HomeIcon, Bell, ShoppingBag, FileText, AlertCircle, GraduationCap, Info, MapPin, User, LogOut, LayoutDashboard, Activity, BookOpen } from 'lucide-react'

const isProtectedResidentRoute = (pathname: string) => (
  pathname.startsWith('/dashboard') ||
  pathname.startsWith('/documents') ||
  pathname.startsWith('/upload-id') ||
  pathname.startsWith('/profile') ||
  pathname.startsWith('/my-marketplace')
)

export default function Layout() {
  const accountRef = useRef<HTMLDetailsElement>(null)
  const closeAccount = () => { try { if (accountRef.current) accountRef.current.open = false } catch {} }
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)
  const role = useAppStore((s) => s.role)
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const logout = useAppStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()
  const hideLocationSelector = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/documents')

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  // Re-validate auth on history navigation to prevent back access after logout
  useEffect(() => {
    const recheckAuth = () => {
      const { isAuthenticated: auth, role: currentRole, isAuthBootstrapped } = useAppStore.getState()
      const pathname = window.location.pathname
      if (!isAuthBootstrapped) return
      if (!isProtectedResidentRoute(pathname)) return
      if (!auth || currentRole === 'public') {
        navigate('/login', { replace: true, state: { from: pathname } })
      }
    }
    window.addEventListener('pageshow', recheckAuth)
    window.addEventListener('popstate', recheckAuth)
    return () => {
      window.removeEventListener('pageshow', recheckAuth)
      window.removeEventListener('popstate', recheckAuth)
    }
  }, [navigate])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll();
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Toggle a body class so pages can respond to the mobile menu being open (e.g., hiding FABs)
  // and lock body scroll while the mobile drawer is active.
  useEffect(() => {
    const body = document.body
    body.classList.toggle('mobile-menu-open', mobileOpen)
    body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      body.classList.remove('mobile-menu-open')
      body.style.overflow = ''
    }
  }, [mobileOpen])

  // Read one-time toast from navigation state
  useEffect(() => {
    const anyState = (location as any)?.state
    const nextToast = anyState?.toast
    if (nextToast) {
      setToast(nextToast)
      // Clear the navigation state to avoid repeated toasts on back/forward
      navigate(location.pathname + location.search, { replace: true })
    }
  }, [location, navigate])

  // Close any open <details> dropdowns (Services/Province/Municipality/Account) on navigation
  useEffect(() => {
    try {
      document.querySelectorAll('details[open]').forEach((d) => d.removeAttribute('open'))
    } catch {}
  }, [location.pathname])

  // Close mobile drawer after route changes (including browser back/forward).
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close dropdowns when clicking outside them
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      // If click is inside any <details>, keep it open (native behavior handles toggling)
      if (target.closest('details')) return
      try {
        document.querySelectorAll('details[open]').forEach((d) => d.removeAttribute('open'))
      } catch {}
    }
    document.addEventListener('click', onDocClick, true)
    return () => document.removeEventListener('click', onDocClick, true)
  }, [])

  const navLinkClass = (to: string) => {
    const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
    return `inline-flex items-center px-2.5 py-2 text-sm font-medium rounded-md transition-colors ${
      active ? 'text-navy-800 bg-navy-50' : 'text-slate-700 hover:text-navy-800 hover:bg-slate-100'
    }`
  }

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] btn-primary">
        {t('Skip to content', 'Lumaktaw sa nilalaman')}
      </a>
      <header className={`sticky top-0 z-50 bg-white border-b border-slate-200 ${scrolled ? 'shadow-sm' : ''}`}>
        <div className="container-responsive flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex flex-shrink-0 items-center gap-2.5" aria-label="MunLink Zambales home">
            <img
              src="/logos/provinces/zambales.png"
              alt=""
              className="h-9 w-9 rounded-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="leading-tight">
              <span className="block text-base font-semibold text-slate-900">MunLink Zambales</span>
              <span className="hidden sm:block text-xs text-slate-600">{t('Province of Zambales', 'Lalawigan ng Zambales')}</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            <Link to="/services" className={navLinkClass('/services')}>{t('Documents', 'Dokumento')}</Link>
            <Link to="/announcements" className={navLinkClass('/announcements')}>{t('Announcements', 'Anunsyo')}</Link>
            <ServicesMenu />
            <Link to="/about" className={navLinkClass('/about')}>{t('About', 'Tungkol')}</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <LanguageToggle />
            {!hideLocationSelector && (
              <div className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-sm" aria-label={t('Browse location', 'Lokasyong tinitingnan')}>
                <MapPin className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <MunicipalitySelect />
                <span className="text-slate-300" aria-hidden="true">/</span>
                <BarangaySelect />
              </div>
            )}
            {role === 'public' || !isAuthenticated ? (
              <>
                <Link to="/login" className="btn-ghost min-h-[40px] py-2">{t('Log in', 'Mag-log in')}</Link>
                <Link to="/register" className="btn-primary min-h-[40px] py-2">{t('Register', 'Magparehistro')}</Link>
              </>
            ) : (
              <details ref={accountRef} className="relative">
                <summary className="list-none cursor-pointer flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
                  {user?.profile_picture ? (
                    <img src={mediaUrl(user.profile_picture)} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-800">
                      {(user?.username || 'A').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-800">{t('Account', 'Account')}</span>
                </summary>
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-slate-200 bg-white p-1.5 z-50">
                  <button onClick={() => { closeAccount(); navigate('/dashboard') }} className="block w-full rounded px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-100">{t('Dashboard', 'Dashboard')}</button>
                  <button onClick={() => { closeAccount(); navigate('/profile') }} className="block w-full rounded px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-100">{t('Profile', 'Profile')}</button>
                  <button onClick={() => { closeAccount(); navigate('/dashboard/requests') }} className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">{t('My document requests', 'Aking mga kahilingan')}</button>
                  <button onClick={() => { closeAccount(); navigate('/my-marketplace?tab=transactions') }} className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">{t('Marketplace transactions', 'Mga transaksyon sa palengke')}</button>
                  <button onClick={() => { closeAccount(); navigate('/how-to-use') }} className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">{t('How to use', 'Paano gamitin')}</button>
                  <hr className="my-1.5 border-slate-200" />
                  <button onClick={() => { closeAccount(); logout(); navigate('/login', { replace: true }) }} className="block w-full rounded px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50">{t('Log out', 'Mag-log out')}</button>
                </div>
              </details>
            )}
          </div>

          <button className="lg:hidden btn-ghost min-h-[44px] px-3" onClick={() => setMobileOpen(true)} aria-label={t('Open menu', 'Buksan ang menu')} aria-expanded={mobileOpen}>
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile slide-over menu */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" onClick={() => setMobileOpen(false)} />
        <aside className={`absolute right-0 top-0 h-full w-[85%] xxs:w-[80%] xs:w-[70%] max-w-sm bg-white flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>

          {/* Header with Logo and Close */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/80 bg-white ">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <img
                src="/logos/provinces/zambales.png"
                alt=""
                className="h-8 w-8 rounded-full object-cover bg-white border border-gray-200 shadow-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="text-lg font-semibold text-gray-900">MunLink Zambales</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label={t('Close menu', 'Isara ang menu')}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="px-4 pb-3">
              <LanguageToggle />
            </div>
            <nav className="space-y-1" aria-label={t('Main', 'Pangunahin')}>
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-100 transition-colors text-slate-800 font-medium">
                <HomeIcon className="w-5 h-5 text-slate-500" aria-hidden="true" />
                <span>{t('Home', 'Home')}</span>
              </Link>
              <Link to="/services" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-100 transition-colors text-slate-800 font-medium">
                <FileText className="w-5 h-5 text-slate-500" aria-hidden="true" />
                <span>{t('Documents and fees', 'Dokumento at singil')}</span>
              </Link>
              <Link to="/announcements" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-100 transition-colors text-slate-800 font-medium">
                <Bell className="w-5 h-5 text-slate-500" aria-hidden="true" />
                <span>{t('Announcements', 'Anunsyo')}</span>
              </Link>
              <Link to="/programs" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-100 transition-colors text-slate-800 font-medium">
                <GraduationCap className="w-5 h-5 text-slate-500" aria-hidden="true" />
                <span>{t('Benefit programs', 'Mga programang tulong')}</span>
              </Link>
              <Link to="/problems" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-100 transition-colors text-slate-800 font-medium">
                <AlertCircle className="w-5 h-5 text-slate-500" aria-hidden="true" />
                <span>{t('Report a problem', 'Mag-ulat ng problema')}</span>
              </Link>
              <Link to="/marketplace" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-100 transition-colors text-slate-800 font-medium">
                <ShoppingBag className="w-5 h-5 text-slate-500" aria-hidden="true" />
                <span>{t('Community marketplace', 'Palengke ng komunidad')}</span>
              </Link>
              <Link to="/about" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-100 transition-colors text-slate-800 font-medium">
                <Info className="w-5 h-5 text-slate-500" aria-hidden="true" />
                <span>{t('About', 'Tungkol')}</span>
              </Link>

              {!hideLocationSelector && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="flex items-center gap-2 px-4 pb-2 text-sm font-semibold text-slate-700">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                    {t('Your town', 'Ang iyong bayan')}
                  </p>
                  <div className="space-y-2 px-4">
                    <div className="rounded-md border border-slate-200 p-3"><MunicipalitySelect /></div>
                    <div className="rounded-md border border-slate-200 p-3"><BarangaySelect /></div>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200/80 bg-white ">
            {role === 'public' || !isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-navy-700 hover:bg-navy-800 text-white font-semibold rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  <span>{t('Log in', 'Mag-log in')}</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-navy-700 text-navy-800 font-semibold rounded-md hover:bg-navy-50 transition-colors"
                >
                  <span>{t('Register', 'Magparehistro')}</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => { setMobileOpen(false); navigate('/dashboard'); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-800 font-semibold"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>{t('Dashboard', 'Dashboard')}</span>
                </button>
                <button
                  onClick={() => { setMobileOpen(false); navigate('/profile'); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-800 font-semibold"
                >
                  <User className="w-5 h-5" />
                  <span>{t('Profile', 'Profile')}</span>
                </button>
                <button
                  onClick={() => { setMobileOpen(false); navigate('/how-to-use'); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-800 font-semibold"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>{t('How to use', 'Paano gamitin')}</span>
                </button>

                <div className="pt-3 pb-2 border-t border-gray-200">
                  <div className="px-4 py-2 text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>{t('Activity', 'Aktibidad')}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setMobileOpen(false); navigate('/my-marketplace?tab=transactions'); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-800 font-medium"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{t('Marketplace transactions', 'Mga transaksyon')}</span>
                </button>
                <button
                  onClick={() => { setMobileOpen(false); navigate('/dashboard/requests'); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-800 font-medium"
                >
                  <FileText className="w-5 h-5" />
                  <span>{t('My document requests', 'Aking mga kahilingan')}</span>
                </button>

                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => { setMobileOpen(false); logout(); navigate('/login', { replace: true }) }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('Log out', 'Mag-log out')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <AuthStatusBanner />
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
