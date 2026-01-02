import { NavLink } from 'react-router-dom'
import { useAdminStore } from '../../lib/store'
import { LayoutDashboard, Users, Gift, FileText, AlertTriangle, ShoppingBag, Megaphone, BarChart3 } from 'lucide-react'
import { getBestRegion3Seal } from '@munlink/ui'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  className?: string
}

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/dashboard', badge: null },
  { icon: 'residents', label: 'Residents', path: '/residents', badge: null },
  { icon: 'programs', label: 'Programs', path: '/programs', badge: null },
  { icon: 'requests', label: 'Requests', path: '/requests', badge: null },
  { icon: 'problems', label: 'Problems', path: '/problems', badge: null },
  { icon: 'marketplace', label: 'Marketplace', path: '/marketplace', badge: null },
  { icon: 'announcements', label: 'Announcements', path: '/announcements', badge: null },
  { icon: 'reports', label: 'Reports', path: '/reports', badge: null },
]

function IconFor(code: string, className = 'w-5 h-5') {
  switch (code) {
    case 'dashboard': return <LayoutDashboard className={className} aria-hidden="true" />
    case 'residents': return <Users className={className} aria-hidden="true" />
    case 'programs': return <Gift className={className} aria-hidden="true" />
    case 'requests': return <FileText className={className} aria-hidden="true" />
    case 'problems': return <AlertTriangle className={className} aria-hidden="true" />
    case 'transactions': return <ShoppingBag className={className} aria-hidden="true" />
    case 'marketplace': return <ShoppingBag className={className} aria-hidden="true" />
    case 'announcements': return <Megaphone className={className} aria-hidden="true" />
    case 'reports': return <BarChart3 className={className} aria-hidden="true" />
    default: return <LayoutDashboard className={className} aria-hidden="true" />
  }
}

export default function Sidebar({ collapsed, onToggle, className = '' }: SidebarProps) {
  const user = useAdminStore((s) => s.user)
  
  const seal = getBestRegion3Seal({
    municipality: (user as any)?.admin_municipality_slug || (user as any)?.admin_municipality_name || (user as any)?.municipality_slug || (user as any)?.municipality_name,
    // province is not reliably present on admin user payload; fallback is handled inside helper
  })
  if (collapsed) {
    return (
      <aside className={`fixed left-0 top-0 h-screen w-[80px] bg-white/90 backdrop-blur-xl border-r border-neutral-200 z-50 transition-all duration-300 flex flex-col ${className}`}>
        <div className="flex flex-col items-center px-4 py-5 border-b border-neutral-200">
          <img src={seal.src} className="w-10 h-10 object-contain" alt={seal.alt} />
        </div>
        <nav className="px-4 py-6 space-y-3 flex-1">
          {navItems.map((item) => (
            <div key={item.path} className="relative group">
              <NavLink
                to={item.path}
                className={({ isActive }) => `flex items-center justify-center w-12 h-12 rounded-xl transition-all ${isActive ? 'bg-ocean-gradient text-white shadow-lg' : 'text-neutral-700 hover:bg-ocean-50'}`}
              >
                <span className="text-xl">{IconFor(item.icon, 'w-5 h-5')}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
              </div>
            </div>
          ))}
        </nav>
        {/* Toggle button at bottom */}
        <div className="px-4 py-4 border-t border-neutral-200">
          <button onClick={onToggle} className="w-12 h-10 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-colors mx-auto">
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className={`fixed left-0 top-0 h-screen w-[260px] bg-white/90 backdrop-blur-xl border-r border-neutral-200 z-50 transition-all duration-300 flex flex-col ${className}`}>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-200">
        <img src={seal.src} className="w-10 h-10 object-contain" alt={seal.alt} />
        <div>
          <p className="font-bold text-sm text-neutral-900">{user?.admin_municipality_name || 'MunLink'}</p>
          <p className="text-xs text-neutral-600">Admin Portal</p>
        </div>
      </div>
      <nav className="px-4 py-6 space-y-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `group flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${isActive ? 'bg-ocean-gradient text-white shadow-lg' : 'text-neutral-700 hover:bg-ocean-50 hover:text-ocean-700'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{IconFor(item.icon, 'w-5 h-5')}</span>
              <span className="text-sm">{item.label}</span>
            </div>
            {item.badge && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>
      {/* Toggle button at bottom */}
      <div className="px-4 py-4 border-t border-neutral-200">
        <button onClick={onToggle} className="w-full h-10 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center gap-2 transition-colors text-neutral-600 text-sm font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          <span>Collapse</span>
        </button>
      </div>
    </aside>
  )
}


