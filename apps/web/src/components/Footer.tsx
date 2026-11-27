import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-responsive py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src="/logos/munlink-logo.png" alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="text-base font-semibold text-slate-900">MunLink Zambales</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              Online services of the municipal and barangay governments of the Province of Zambales.
            </p>
          </div>
          <nav aria-label="Footer: explore">
            <h2 className="text-sm font-semibold text-slate-900">Explore</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/announcements" className="text-slate-600 hover:text-navy-800 hover:underline">Announcements</Link></li>
              <li><Link to="/marketplace" className="text-slate-600 hover:text-navy-800 hover:underline">Marketplace</Link></li>
              <li><Link to="/about" className="text-slate-600 hover:text-navy-800 hover:underline">About MunLink</Link></li>
            </ul>
          </nav>
          <nav aria-label="Footer: services">
            <h2 className="text-sm font-semibold text-slate-900">Services</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/documents" className="text-slate-600 hover:text-navy-800 hover:underline">Documents and certificates</Link></li>
              <li><Link to="/programs" className="text-slate-600 hover:text-navy-800 hover:underline">Benefit programs</Link></li>
              <li><Link to="/problems" className="text-slate-600 hover:text-navy-800 hover:underline">Report a problem</Link></li>
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} MunLink Zambales</p>
          <p className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-navy-800 hover:underline">Privacy policy</Link>
            <Link to="/terms-of-service" className="hover:text-navy-800 hover:underline">Terms of service</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
