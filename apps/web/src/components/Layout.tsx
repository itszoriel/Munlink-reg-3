import { Outlet, Link, useLocation } from 'react-router-dom'
import { useRef } from 'react'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import ProvinceSelect from './ProvinceSelect'
import MunicipalitySelect from './MunicipalitySelect'
import ServicesMenu from './ServicesMenu'
import { useNavigate } from 'react-router-dom'
import Footer from './Footer'
import AuthStatusBanner from './AuthStatusBanner'
import { Toast } from '@munlink/ui'
import { mediaUrl } from '@/lib/api'
import { Menu } from 'lucide-react'

export default function Layout() {
  const accountRef = useRef<HTMLDetailsElement>(null)
  const closeAccount = () => { try { if (accountRef.current) accountRef.current.open = false } catch {} }
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)
  const role = useAppStore((s) => s.role)
  const user = useAppStore((s) => s.user)
  const logout = useAppStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  // Re-validate auth on history navigation to prevent back access after logout
  useEffect(() => {
    const recheckAuth = () => {
      const { isAuthenticated: auth, role: currentRole } = useAppStore.getState()
      if (!auth || currentRole === 'public') {
        navigate('/login', { replace: true })
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

  return (
    <div className={"min-h-screen flex flex-col"}>
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-7xl transition-all duration-300 ${scrolled ? 'top-2' : ''}`}>
        <div className={`bg-white/85 backdrop-blur-xl rounded-2xl px-4 lg:px-6 py-2.5 border border-white/60 transition-shadow duration-300 ${scrolled ? 'shadow-xl' : 'shadow-lg'}`}>
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="text-base lg:text-lg font-serif font-semibold text-gray-900 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2">
              <img
                src="/logos/MunLink%20Logo.png"
                alt="MunLink Logo"
                className="h-7 w-7 rounded-full object-cover bg-white/60 border border-white/60 shadow-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span>MunLink</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1 xl:gap-3 text-gray-900 text-sm">
              <Link to="/" className="hover:text-ocean-700 transition-colors font-serif px-2 py-1 rounded-lg hover:bg-ocean-50">
                Home
              </Link>
              <Link to="/announcements" className="hover:text-ocean-700 transition-colors font-serif px-2 py-1 rounded-lg hover:bg-ocean-50">
                Updates
              </Link>
              <Link to="/marketplace" className="hover:text-ocean-700 transition-colors font-serif px-2 py-1 rounded-lg hover:bg-ocean-50">
                Marketplace
              </Link>
              <ServicesMenu />
              
              <span aria-hidden="true" className="w-px h-5 bg-gray-300 mx-1" />
              
              <div className="flex items-center gap-1 bg-ocean-50/50 rounded-lg px-2 py-1">
                <ProvinceSelect />
                <span className="text-gray-300">/</span>
                <MunicipalitySelect />
              </div>
              
              <span aria-hidden="true" className="w-px h-5 bg-gray-300 mx-1" />
              
              <Link to="/about" className="hover:text-ocean-700 transition-colors font-serif px-2 py-1 rounded-lg hover:bg-ocean-50">
                About
              </Link>
              {role === 'public' ? (
                <>
                  <Link to="/login" className="hover:text-ocean-700 transition-colors font-serif px-3 py-1.5 rounded-lg hover:bg-ocean-50">Login</Link>
                  <Link to="/register" className="bg-ocean-600 text-white font-serif px-3 py-1.5 rounded-lg hover:bg-ocean-700 transition-colors">Register</Link>
                </>
              ) : (
                <details ref={accountRef} className="relative group">
                  <summary className="list-none cursor-pointer flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-ocean-50">
                    {user?.profile_picture ? (
                      <img src={mediaUrl(user.profile_picture)} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-white/60" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-ocean-100 text-ocean-700 flex items-center justify-center text-xs font-semibold">
                        {(user?.username || 'A').slice(0,2).toUpperCase()}
                      </div>
                    )}
                    <span className="font-serif text-sm">Account ▾</span>
                  </summary>
                  <div className="absolute right-0 mt-3 w-52 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/50 p-2 z-50">
                    <button onClick={() => { closeAccount(); navigate('/dashboard') }} className="block w-full text-left px-3 py-2 rounded hover:bg-ocean-50 text-sm">Dashboard</button>
                    <button onClick={() => { closeAccount(); navigate('/my-marketplace') }} className="block w-full text-left px-3 py-2 rounded hover:bg-ocean-50 text-sm">My Marketplace</button>
                    <button onClick={() => { closeAccount(); navigate('/profile') }} className="block w-full text-left px-3 py-2 rounded hover:bg-ocean-50 text-sm">Profile</button>
                    <hr className="my-1 border-gray-200" />
                    <button onClick={() => { closeAccount(); logout(); navigate('/login', { replace: true }) }} className="block w-full text-left px-3 py-2 rounded hover:bg-red-50 text-sm text-red-600">Logout</button>
                  </div>
                </details>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="lg:hidden btn-ghost rounded-full p-2" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-over menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
        <aside className="absolute right-0 top-0 h-full w-[85%] xxs:w-[80%] xs:w-[70%] bg-white p-4 flex flex-col">
          <div className="px-2 py-3 border-b border-neutral-200">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-neutral-50">Home</Link>
            <Link to="/announcements" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-neutral-50">Announcements</Link>
            <Link to="/marketplace" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-neutral-50">Marketplace</Link>
            <div className="mt-1 mb-1 px-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase">Services</div>
            <Link to="/documents" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-neutral-50">Documents</Link>
            <Link to="/problems" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-neutral-50">Problems</Link>
            <Link to="/programs" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-neutral-50">Programs</Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-neutral-50">About</Link>
            <div className="px-3 py-2 space-y-2">
              <ProvinceSelect />
              <MunicipalitySelect />
            </div>
          </div>
          <div className="mt-auto p-3 border-t border-neutral-200">
            {role === 'public' ? (
              <div className="grid gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary text-center">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-secondary text-center">Register</Link>
              </div>
            ) : (
              <div className="grid gap-2">
                <button onClick={() => { setMobileOpen(false); navigate('/dashboard'); }} className="btn-ghost rounded">Dashboard</button>
                <button onClick={() => { setMobileOpen(false); navigate('/my-marketplace'); }} className="btn-ghost rounded">My Marketplace</button>
                <button onClick={() => { setMobileOpen(false); navigate('/profile'); }} className="btn-ghost rounded">Profile</button>
                <button onClick={() => { setMobileOpen(false); logout(); navigate('/login', { replace: true }) }} className="btn-primary rounded">Logout</button>
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="h-24" />
      <AuthStatusBanner />
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

