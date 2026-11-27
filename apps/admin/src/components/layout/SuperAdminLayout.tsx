import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar, { type NavSection } from './Sidebar'
import TopHeader from './TopHeader'
import MobileNav from './MobileNav'

interface SuperAdminLayoutProps {
  children: ReactNode
}

// Super Admin navigation sections
const superAdminNavSections: NavSection[] = [
  {
    label: 'Administration',
    items: [
      { icon: 'residents', label: 'Admin Management', path: '/superadmin' },
      { icon: 'audit', label: 'Audit Log', path: '/superadmin/audit' },
    ]
  }
]

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
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

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* Unified Sidebar (desktop + mobile) */}
      <Sidebar
        collapsed
        onOpenChange={setSidebarOpen}
        mobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        navSections={superAdminNavSections}
        title="Super Admin"
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
