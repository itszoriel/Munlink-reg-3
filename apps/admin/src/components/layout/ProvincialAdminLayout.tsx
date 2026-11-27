import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar, { type NavSection } from './Sidebar'
import TopHeader from './TopHeader'
import MobileNav from './MobileNav'
import { adminThemes } from './adminTheme'

interface ProvincialAdminLayoutProps {
  children: ReactNode
}

// Provincial Admin navigation sections
const provincialAdminNavSections: NavSection[] = [
  {
    label: 'Provincial Management',
    items: [
      { icon: 'dashboard', label: 'Dashboard', path: '/provincial/dashboard' },
      { icon: 'announcements', label: 'Announcements', path: '/provincial/announcements' },
      { icon: 'reports', label: 'Reports', path: '/provincial/reports' },
    ]
  }
]

export default function ProvincialAdminLayout({ children }: ProvincialAdminLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()


  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [isMobileSidebarOpen])
  // Hide mobile FABs when sidebar is open (match web behavior)
  useEffect(() => {
    const body = document.body
    body.classList.toggle('mobile-menu-open', isMobileSidebarOpen)
    return () => {
      body.classList.remove('mobile-menu-open')
    }
  }, [isMobileSidebarOpen])

  return (
    <div
      className="min-h-screen bg-neutral-50"
      style={adminThemes.provincial}
    >

      {/* Unified Sidebar (desktop + mobile) */}
      <Sidebar
        collapsed
        onOpenChange={setSidebarOpen}
        mobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        navSections={provincialAdminNavSections}
        title="Provincial Admin"
        subtitle="Zambales Province"
      />

      {/* Top header with profile/logout + mobile trigger */}
      <TopHeader
        sidebarCollapsed={!sidebarOpen}
        onOpenMobile={() => { setIsProfileMenuOpen(false); setIsMobileSidebarOpen(true); }}
        onProfileMenuChange={setIsProfileMenuOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content - auto-expand sidebar so use minimum collapsed width */}
      <main
        className={`transition-all duration-300 pt-20 md:pt-20 pb-24 md:pb-28 overflow-x-hidden max-w-full relative z-10 ${
          sidebarOpen ? 'md:ml-[288px]' : 'md:ml-[84px]'
        }`}
      >
        <div className="p-4 md:p-6 lg:p-8 w-full max-w-none">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav - hidden when sidebar or profile menu is open */}
      {!isMobileSidebarOpen && !isProfileMenuOpen && <MobileNav />}
    </div>
  )
}
