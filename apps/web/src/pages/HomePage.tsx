import { Link } from 'react-router-dom'
import { announcementsApi, marketplaceApi, mediaUrl } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { useCachedFetch } from '@/lib/useCachedFetch'
import { CACHE_KEYS } from '@/lib/dataStore'
import { EmptyState } from '@munlink/ui'
import {
  ArrowRight,
  Bell,
  FileText,
  HandHeart,
  MessageSquareWarning,
  Package,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  BadgeCheck,
} from 'lucide-react'
import SafeImage from '@/components/SafeImage'

const SERVICES = [
  {
    icon: FileText,
    title: 'Documents and certificates',
    description: 'Request clearances, permits and certificates from your municipal or barangay hall and follow their status online.',
    to: '/documents',
  },
  {
    icon: HandHeart,
    title: 'Benefit programs',
    description: 'See the assistance programs open in your municipality, check who qualifies and apply.',
    to: '/programs',
  },
  {
    icon: MessageSquareWarning,
    title: 'Report a problem',
    description: 'Tell your local government about road, water, waste or safety problems and track the response.',
    to: '/problems',
  },
  {
    icon: ShoppingBag,
    title: 'Community marketplace',
    description: 'Sell, lend or give away items to verified residents in your own municipality.',
    to: '/marketplace',
  },
]

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create an account',
    description: 'Register with your name, contact details and your municipality and barangay in Zambales.',
  },
  {
    icon: BadgeCheck,
    title: 'Verify your identity',
    description: 'Upload a valid ID and a selfie. Municipal staff review it; your files stay private.',
  },
  {
    icon: FileText,
    title: 'Use local services',
    description: 'Once verified, request documents, apply to programs and report problems online.',
  },
]

export default function HomePage() {
  const selectedMunicipality = useAppStore((s) => s.selectedMunicipality)
  const selectedBarangay = useAppStore((s) => s.selectedBarangay)
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  const userMunicipalityId = (user as any)?.municipality_id
  const userBarangayId = (user as any)?.barangay_id
  const verifiedResident = isAuthenticated && (user as any)?.admin_verified && (user as any)?.role === 'resident'
  const browseMunicipalityId = selectedMunicipality?.id
  const browseBarangayId = selectedBarangay?.id
  const effectiveMunicipalityId = verifiedResident ? userMunicipalityId : browseMunicipalityId
  const announcementDetailQuery = (() => {
    const qp = new URLSearchParams()
    if (browseMunicipalityId) {
      qp.set('municipality_id', String(browseMunicipalityId))
      qp.set('browse', 'true')
    }
    if (browseBarangayId) qp.set('barangay_id', String(browseBarangayId))
    const qs = qp.toString()
    return qs ? `?${qs}` : ''
  })()

  // Home feeds are public; the backend enforces visibility rules.
  const { data: announcementsData, loading: announcementsLoading } = useCachedFetch(
    CACHE_KEYS.HOME_ANNOUNCEMENTS,
    () => announcementsApi.getAll({
      active: true,
      page: 1,
      per_page: 4,
      ...(browseMunicipalityId ? { municipality_id: browseMunicipalityId, browse: true } : {}),
      ...(browseBarangayId ? { barangay_id: browseBarangayId } : {}),
    }),
    {
      dependencies: ['home_announcements_fetch_fix_v2', browseMunicipalityId, browseBarangayId, userMunicipalityId, userBarangayId, verifiedResident],
      staleTime: 3 * 60 * 1000,
    }
  )

  const { data: marketplaceData, loading: marketplaceLoading } = useCachedFetch(
    CACHE_KEYS.HOME_MARKETPLACE,
    () => marketplaceApi.getItems({ status: 'available', page: 1, per_page: 4, municipality_id: effectiveMunicipalityId }),
    {
      dependencies: [effectiveMunicipalityId],
      staleTime: 3 * 60 * 1000,
    }
  )

  const recentAnnouncements = (announcementsData as any)?.data?.announcements || []
  const featuredItems = (marketplaceData as any)?.data?.items || []
  const areaName = selectedMunicipality?.name || 'Zambales'

  return (
    <div className="bg-[#f6f7f9]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy-900">
        <img
          src="/assets/hero.jpg"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-navy-950/75" aria-hidden="true" />
        <div className="container-responsive py-16 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-navy-100">
              Province of Zambales
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-white">
              Local government services for Zambales residents, online
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-200">
              Request documents, apply for programs and report problems to your municipality and
              barangay without lining up at the hall. Serving the 13 municipalities of Zambales.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="btn bg-white text-navy-800 hover:bg-navy-50"
              >
                {isAuthenticated ? 'Go to your dashboard' : 'Create an account'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to={isAuthenticated ? '/documents' : '/login'}
                className="btn border-white/60 text-white hover:bg-white/10"
              >
                {isAuthenticated ? 'Request a document' : 'Log in'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white border-b border-slate-200">
        <div className="container-responsive py-14 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">What you can do</h2>
            <p className="mt-2 text-slate-600">
              Services provided by your municipal and barangay offices.
            </p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, description, to }) => (
              <li key={title}>
                <Link
                  to={to}
                  className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-navy-300 hover:bg-navy-50/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy-700 group-hover:underline">
                    Open
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      {!isAuthenticated && (
        <section className="border-b border-slate-200">
          <div className="container-responsive py-14 sm:py-16">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">How it works</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, description }, index) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-navy-200 bg-white text-sm font-semibold text-navy-700">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Icon className="h-4 w-4 text-navy-600" aria-hidden="true" />
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
              <p>
                IDs and selfies are kept in private storage. Only authorized staff of your own municipality can view
                them, and every view is logged, in line with the Data Privacy Act of 2012.{' '}
                <Link to="/privacy-policy" className="font-medium text-navy-700 underline">Privacy policy</Link>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Announcements and marketplace */}
      <section>
        <div className="container-responsive grid gap-10 py-14 sm:py-16 lg:grid-cols-2">
          <div>
            <SectionHeading title={`Announcements in ${areaName}`} linkTo="/announcements" linkLabel="All announcements" />
            {announcementsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton-card h-20" />)}
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <EmptyState icon="announcement" title="No announcements yet" description="Check back soon for updates." compact />
            ) : (
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                {recentAnnouncements.slice(0, 4).map((a: any) => (
                  <AnnouncementRow key={a.id} announcement={a} detailQuery={announcementDetailQuery} />
                ))}
              </ul>
            )}
          </div>

          <div>
            <SectionHeading title="From the marketplace" linkTo="/marketplace" linkLabel="Browse marketplace" />
            {marketplaceLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-card h-56" />)}
              </div>
            ) : featuredItems.length === 0 ? (
              <EmptyState icon="cart" title="No items yet" description="Verified residents can post items to sell, lend or give away." compact />
            ) : (
              <ul className="grid grid-cols-2 gap-4">
                {featuredItems.slice(0, 4).map((it: any) => (
                  <MarketplaceTile key={it.id} item={it} fallbackMunicipality={selectedMunicipality?.name} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeading({ title, linkTo, linkLabel }: { title: string; linkTo: string; linkLabel: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <Link to={linkTo} className="whitespace-nowrap text-sm font-medium text-navy-700 hover:underline">
        {linkLabel}
      </Link>
    </div>
  )
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function AnnouncementRow({ announcement, detailQuery }: { announcement: any; detailQuery?: string }) {
  const urgent = announcement.priority?.toLowerCase() === 'high'
  return (
    <li>
      <Link
        to={`/announcements/${announcement.id}${detailQuery || ''}`}
        className="flex items-start gap-4 p-4 transition-colors hover:bg-slate-50"
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
          {announcement.images?.[0] ? (
            <SafeImage src={mediaUrl(announcement.images[0])} alt="" className="h-full w-full object-cover" fallbackIcon="image" />
          ) : (
            <Bell className="h-5 w-5 text-slate-500" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {urgent && <span className="pill pill-error mb-1">Urgent</span>}
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{announcement.title}</h3>
          <p className="mt-0.5 text-xs text-slate-600">{formatDate(announcement.created_at)}</p>
        </div>
      </Link>
    </li>
  )
}

function MarketplaceTile({ item, fallbackMunicipality }: { item: any; fallbackMunicipality?: string }) {
  const price = item.transaction_type === 'sell' && item.price
    ? `₱${Number(item.price).toLocaleString()}`
    : item.transaction_type === 'lend'
      ? 'For lending'
      : 'Free'
  return (
    <li>
      <Link
        to={`/marketplace/${item.id}`}
        className="block overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-navy-300"
      >
        <div className="aspect-[4/3] bg-slate-100">
          {item.images?.[0] ? (
            <SafeImage src={mediaUrl(item.images[0])} alt={item.title} className="h-full w-full object-cover" fallbackIcon="image" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-slate-400" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</h3>
          <p className="text-xs text-slate-600">{item.municipality_name || fallbackMunicipality || 'Zambales'}</p>
          <p className="mt-1 text-sm font-semibold text-navy-700">{price}</p>
        </div>
      </Link>
    </li>
  )
}
