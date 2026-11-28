import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'

export default function Footer() {
  const year = new Date().getFullYear()
  const { t } = useLang()
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-responsive py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src="/logos/provinces/zambales.png" alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="text-base font-semibold text-slate-900">MunLink Zambales</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              {t('Online services of the municipal and barangay governments of the Province of Zambales.', 'Online na serbisyo ng mga munisipyo at barangay ng Lalawigan ng Zambales.')}
            </p>
          </div>
          <nav aria-label="Footer: explore">
            <h2 className="text-sm font-semibold text-slate-900">{t('Explore', 'Tuklasin')}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/announcements" className="text-slate-600 hover:text-navy-800 hover:underline">{t('Announcements', 'Anunsyo')}</Link></li>
              <li><Link to="/marketplace" className="text-slate-600 hover:text-navy-800 hover:underline">{t('Community marketplace', 'Palengke ng komunidad')}</Link></li>
              <li><Link to="/about" className="text-slate-600 hover:text-navy-800 hover:underline">{t('About MunLink', 'Tungkol sa MunLink')}</Link></li>
            </ul>
          </nav>
          <nav aria-label="Footer: services">
            <h2 className="text-sm font-semibold text-slate-900">{t('Services', 'Serbisyo')}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/services" className="text-slate-600 hover:text-navy-800 hover:underline">{t('Documents and fees', 'Dokumento at singil')}</Link></li>
              <li><Link to="/programs" className="text-slate-600 hover:text-navy-800 hover:underline">{t('Benefit programs', 'Mga programang tulong')}</Link></li>
              <li><Link to="/problems" className="text-slate-600 hover:text-navy-800 hover:underline">{t('Report a problem', 'Mag-ulat ng problema')}</Link></li>
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} MunLink Zambales</p>
          <p className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-navy-800 hover:underline">{t('Privacy policy', 'Patakaran sa privacy')}</Link>
            <Link to="/terms-of-service" className="hover:text-navy-800 hover:underline">{t('Terms of service', 'Mga tuntunin')}</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
