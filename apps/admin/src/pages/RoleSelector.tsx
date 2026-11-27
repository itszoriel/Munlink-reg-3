import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Landmark, Home, ShieldCheck } from 'lucide-react'

const TRACKS = [
  {
    to: '/login',
    icon: Building2,
    title: 'Municipal admin',
    description: 'Verify residents, process document requests and manage programs for one municipality.',
  },
  {
    to: '/barangay/login',
    icon: Home,
    title: 'Barangay admin',
    description: 'Handle barangay announcements, programs and reports for one barangay.',
  },
  {
    to: '/provincial/login',
    icon: Landmark,
    title: 'Provincial admin',
    description: 'Province-wide announcements and reports across Zambales.',
  },
  {
    to: '/superadmin/login',
    icon: ShieldCheck,
    title: 'Super admin',
    description: 'Manage admin accounts and review the audit log. Requires email verification.',
  },
]

export default function RoleSelector() {
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <img src="/logos/munlink-logo.png" alt="" className="h-9 w-9 rounded-full object-cover" />
          <div className="leading-tight">
            <p className="text-base font-semibold text-slate-900">MunLink Zambales</p>
            <p className="text-xs text-slate-600">Staff portal</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Sign in to the staff portal</h1>
        <p className="mt-2 text-slate-600">Choose the office you work for. Each one has its own sign-in.</p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {TRACKS.map(({ to, icon: Icon, title, description }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex h-full items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-navy-300 hover:bg-navy-50/40"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center justify-between gap-2 text-base font-semibold text-slate-900">
                    {title}
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-navy-700" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">{description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-slate-600">
          Residents should use the public MunLink site instead. Staff accounts are created by a super admin.
        </p>
      </main>
    </div>
  )
}
