import { motion } from 'framer-motion'
import { announcementsApi, marketplaceApi, mediaUrl } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { useCachedFetch } from '@/lib/useCachedFetch'
import { CACHE_KEYS } from '@/lib/dataStore'
import { Link } from 'react-router-dom'
import AnnouncementCard from '@/components/AnnouncementCard'
import MarketplaceCard from '@/components/MarketplaceCard'
import { EmptyState } from '@munlink/ui'
import { ArrowRight, Bell, ShoppingBag, MapPin } from 'lucide-react'

export default function HomePage() {
  const selectedMunicipality = useAppStore((s) => s.selectedMunicipality)
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  // Municipality scoping
  const userMunicipalityId = (user as any)?.municipality_id
  const userBarangayId = (user as any)?.barangay_id
  const verifiedResident = isAuthenticated && (user as any)?.admin_verified && (user as any)?.role === 'resident'
  const browseMunicipalityId = !verifiedResident && selectedMunicipality?.id ? selectedMunicipality.id : undefined
  const shouldFetchHomeData = verifiedResident || !!browseMunicipalityId || !isAuthenticated
  const effectiveMunicipalityId = verifiedResident ? userMunicipalityId : browseMunicipalityId

  // Use cached fetch hooks
  const { data: announcementsData, loading: announcementsLoading } = useCachedFetch(
    CACHE_KEYS.HOME_ANNOUNCEMENTS,
    () => announcementsApi.getAll({ active: true, page: 1, per_page: 4, ...(browseMunicipalityId ? { municipality_id: browseMunicipalityId, browse: true } : {}) }),
    {
      dependencies: [browseMunicipalityId, userMunicipalityId, userBarangayId, verifiedResident],
      staleTime: 3 * 60 * 1000,
      enabled: shouldFetchHomeData
    }
  )

  const { data: marketplaceData, loading: marketplaceLoading } = useCachedFetch(
    CACHE_KEYS.HOME_MARKETPLACE,
    () => marketplaceApi.getItems({ status: 'available', page: 1, per_page: 4, municipality_id: effectiveMunicipalityId }),
    {
      dependencies: [effectiveMunicipalityId],
      staleTime: 3 * 60 * 1000,
      enabled: shouldFetchHomeData
    }
  )

  const recentAnnouncements = shouldFetchHomeData ? ((announcementsData as any)?.data?.announcements || []) : []
  const featuredItems = shouldFetchHomeData ? ((marketplaceData as any)?.data?.items || []) : []
  const loading = announcementsLoading || marketplaceLoading

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Background Image */}
      <section className="relative w-full min-h-[65vh] sm:min-h-[75vh] md:min-h-[80vh] lg:min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <img
          src="/assets/hero.jpg"
          alt="Zambales"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/logos/provinces/zambales.png"
            alt=""
            aria-hidden="true"
            className="w-[51vw] max-w-[440px] sm:w-[42vw] md:w-[36vw] lg:w-[31vw] xl:w-[28vw] opacity-[0.12] object-contain"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto px-2 sm:px-4 md:px-6"
          >
            {/* Province Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/85 border border-white/70 rounded-full mb-4 sm:mb-6 text-slate-800 shadow-sm backdrop-blur">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Zambales Province</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight mb-3 sm:mb-5 px-2 drop-shadow-lg">
              Lalawigan ng Zambales
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-serif text-white/90 max-w-3xl mx-auto mb-7 sm:mb-8 leading-relaxed px-4 drop-shadow">
              MunLink: Empowering Zambales and its 13 municipalities with modern digital governance solutions.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-5 flex-wrap max-w-xl mx-auto px-4">
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 bg-white/90 text-slate-900 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200 border border-white/80 backdrop-blur"
              >
                <span>{isAuthenticated ? "Dashboard" : "Get Started"}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </Link>

              <Link
                to="/about"
                className="flex items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 bg-white/75 border border-white/60 text-slate-800 rounded-xl font-semibold text-sm sm:text-base shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 backdrop-blur"
              >
                <span>About</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Guest Notice */}
      {!isAuthenticated && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
          <div className="w-full max-w-6xl mx-auto px-1 sm:px-2 md:px-4 lg:px-0">
            <div className="flex flex-col gap-5 sm:gap-6 md:gap-7 font-serif">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-tight">All your municipal services in one place</h3>
              <p className="text-base sm:text-lg text-gray-800 leading-relaxed">
                Browse services, submit requests, and stay updated across municipalities and barangays with a verified MunLink account.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 md:gap-7 text-gray-800 text-sm sm:text-base">
                <div className="p-3 sm:p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                  <p className="font-bold mb-1">Services and Requests</p>
                  <p>Track permits, documents, and updates in one dashboard.</p>
                </div>
                <div className="p-3 sm:p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                  <p className="font-bold mb-1">Verified Residency</p>
                  <p>Get tailored notices and faster processing for your municipality.</p>
                </div>
                <div className="p-3 sm:p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                  <p className="font-bold mb-1">Community and Marketplace</p>
                  <p>Access local programs, opportunities, and trusted listings.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Grid */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 pb-12 sm:pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          {/* Latest Announcements */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span>Announcements</span>
              </h2>
              <Link to="/announcements" className="text-xs sm:text-sm font-medium text-ocean-600 hover:text-ocean-700 flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <span className="hidden xs:inline">View All</span>
                <span className="xs:hidden">All</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton-card h-28 sm:h-32 rounded-xl sm:rounded-2xl" />
                ))}
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <EmptyState
                icon="announcement"
                title="No announcements yet"
                description="Check back soon for updates."
                compact
              />
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentAnnouncements.slice(0, 3).map((a: any) => (
                  <AnnouncementCard
                    key={a.id}
                    id={a.id}
                    title={a.title}
                    content={a.content}
                    municipality={a.municipality_name || 'Province-wide'}
                    barangay={a.barangay_name}
                    scope={a.scope as any}
                    priority={a.priority}
                    createdAt={a.created_at}
                    images={a.images}
                    pinned={a.pinned}
                    href={'/announcements'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Featured Marketplace */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span>Marketplace</span>
              </h2>
              <Link to="/marketplace" className="text-xs sm:text-sm font-medium text-ocean-600 hover:text-ocean-700 flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <span className="hidden xs:inline">View All</span>
                <span className="xs:hidden">All</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton-card h-40 sm:h-48 rounded-xl sm:rounded-2xl" />
                ))}
              </div>
            ) : featuredItems.length === 0 ? (
              <EmptyState
                icon="cart"
                title="No items yet"
                description="Be the first to post!"
                compact
              />
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                {featuredItems.slice(0, 4).map((it: any) => (
                  <MarketplaceCard
                    key={it.id}
                    imageUrl={it.images?.[0] ? mediaUrl(it.images[0]) : undefined}
                    title={it.title}
                    price={it.transaction_type === 'sell' && it.price ? `₱${Number(it.price).toLocaleString()}` : undefined}
                    municipality={it.municipality_name || selectedMunicipality?.name || 'Zambales'}
                    transactionType={it.transaction_type}
                    href={'/marketplace'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
