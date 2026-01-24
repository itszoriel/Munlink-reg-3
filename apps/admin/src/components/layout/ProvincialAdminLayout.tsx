import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Building2, Megaphone, BarChart3, Menu, X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAdminStore } from '../../lib/store'
import { getBestRegion3Seal } from '@munlink/ui'

interface ProvincialAdminLayoutProps {
  children: ReactNode
}

export default function ProvincialAdminLayout({ children }: ProvincialAdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAdminStore()

  // Get provincial seal (Zambales)
  const provincialSeal = getBestRegion3Seal({
    province: 'Zambales',
  })

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const navItems = [
    {
      path: '/provincial/dashboard',
      icon: Building2,
      label: 'Dashboard',
      description: 'Province-wide overview'
    },
    {
      path: '/provincial/announcements',
      icon: Megaphone,
      label: 'Announcements',
      description: 'Province-wide announcements'
    },
    {
      path: '/provincial/reports',
      icon: BarChart3,
      label: 'Reports',
      description: 'Province-wide statistics'
    }
  ]

  const isActivePath = (path: string) => {
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-indigo-50/30 to-violet-50/20">
      {/* Transparent provincial seal watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
        <img
          src={provincialSeal.src}
          alt=""
          aria-hidden="true"
          className="w-[600px] h-[600px] object-contain opacity-[0.07] select-none"
        />
      </div>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 flex-col transition-all duration-300 z-40 ${
          isSidebarCollapsed ? 'w-[80px]' : 'w-[280px]'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          {isSidebarCollapsed ? (
            <div className="flex items-center justify-center">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="overflow-hidden">
                <h2 className="font-serif font-bold text-gray-900 text-lg whitespace-nowrap">Provincial Admin</h2>
                <p className="text-xs text-gray-500 whitespace-nowrap">Zambales Portal</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path)
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-600'}`} />
                {!isSidebarCollapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-indigo-100' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-100">
          <div className={`${isSidebarCollapsed ? 'text-center' : 'flex items-center gap-3'} mb-3`}>
            <div className={`${isSidebarCollapsed ? 'mx-auto' : ''} w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors`}
          >
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-sm transition-colors"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-gray-900 text-lg">Provincial Admin</h2>
                  <p className="text-xs text-gray-500">Zambales Portal</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = isActivePath(item.path)
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path)
                      setIsMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <div className="flex-1 text-left">
                      <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {item.label}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-indigo-100' : 'text-gray-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Top Header - Mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-bold text-gray-900">Provincial Admin</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-16 md:pt-0 relative z-10 ${
          isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[280px]'
        }`}
      >
        <div className="p-4 md:p-6 lg:p-8 w-full max-w-none">
          {children}
        </div>
      </main>
    </div>
  )
}
