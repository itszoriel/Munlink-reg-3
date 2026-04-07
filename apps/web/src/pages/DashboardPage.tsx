import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { benefitsApi, documentsApi, marketplaceApi } from '@/lib/api'
import Modal from '@/components/ui/Modal'
import { StatusBadge, getBestRegion3Seal } from '@munlink/ui'
import { useAppStore } from '@/lib/store'
import { useCachedFetch } from '@/lib/useCachedFetch'
import { CACHE_KEYS } from '@/lib/dataStore'
import { getMunicipalityVisual } from '@/lib/municipalityVisuals'
import {
  ArrowRight,
  BookOpen,
  FileText,
  Landmark,
  MapPin,
  Package,
  ShoppingBag,
  Sparkles,
  User,
} from 'lucide-react'

type MyItem = { id: number; title: string; status: string }
type MyTx = { id: number; status: string; transaction_type: string; as: 'buyer' | 'seller' }
type MyReq = {
  id: number
  request_number: string
  status: string
  delivery_method?: string
  document_type?: { name: string }
}
type MyBenefitApp = {
  id: number
  status: string
  application_number: string
  created_at?: string
  supporting_documents?: string[]
  program?: { name?: string }
}

const HERO_FALLBACK_IMAGE = '/assets/about.jpg'

export default function DashboardPage() {
  const [appModalOpen, setAppModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<MyBenefitApp | null>(null)
  const [heroImage, setHeroImage] = useState(HERO_FALLBACK_IMAGE)
  const user = useAppStore((s) => s.user)
  const isAuthBootstrapped = useAppStore((s) => s.isAuthBootstrapped)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  const municipalityVisual = useMemo(
    () =>
      getMunicipalityVisual({
        municipalityName: (user as any)?.municipality_name,
        municipalitySlug: (user as any)?.municipality_slug,
      }),
    [(user as any)?.municipality_name, (user as any)?.municipality_slug]
  )

  const municipalitySeal = getBestRegion3Seal({
    municipality: (user as any)?.municipality_slug || (user as any)?.municipality_name,
    province: 'Zambales',
  })

  useEffect(() => {
    setHeroImage(municipalityVisual.landmark || HERO_FALLBACK_IMAGE)
  }, [municipalityVisual.landmark])

  const residentName = (user as any)?.first_name || user?.username || 'Resident'
  const municipalityName = (user as any)?.municipality_name || municipalityVisual.name
  const barangayName = (user as any)?.barangay_name

  const { data: myItemsData, loading: itemsLoading, update: updateItems } = useCachedFetch(
    CACHE_KEYS.MY_ITEMS,
    () => marketplaceApi.getMyItems(),
    { enabled: isAuthBootstrapped && isAuthenticated, staleTime: 2 * 60 * 1000 }
  )

  const { data: myTxData, loading: txLoading } = useCachedFetch(
    CACHE_KEYS.MY_TRANSACTIONS,
    () => marketplaceApi.getMyTransactions(),
    { enabled: isAuthBootstrapped && isAuthenticated, staleTime: 2 * 60 * 1000 }
  )

  const { data: myReqData, loading: reqLoading } = useCachedFetch(
    CACHE_KEYS.DOCUMENT_REQUESTS,
    () => documentsApi.getMyRequests(),
    { enabled: isAuthBootstrapped && isAuthenticated, staleTime: 2 * 60 * 1000 }
  )

  const { data: myAppsData, loading: appsLoading } = useCachedFetch(
    CACHE_KEYS.MY_APPLICATIONS,
    () => benefitsApi.getMyApplications(),
    { enabled: isAuthBootstrapped && isAuthenticated, staleTime: 2 * 60 * 1000 }
  )

  const items = ((myItemsData as any)?.data?.items || []).slice(0, 5) as MyItem[]
  const asBuyer = ((myTxData as any)?.data?.as_buyer || []).map((t: any) => ({ ...t, as: 'buyer' }))
  const asSeller = ((myTxData as any)?.data?.as_seller || []).map((t: any) => ({ ...t, as: 'seller' }))
  const txs = [...(asBuyer as any[]), ...(asSeller as any[])].slice(0, 5) as MyTx[]
  const reqs = ((myReqData as any)?.data?.requests || []).slice(0, 5) as MyReq[]
  const apps = ((myAppsData as any)?.data?.applications || []) as MyBenefitApp[]

  const loading = itemsLoading || txLoading || reqLoading || appsLoading

  const openBenefitDocument = async (applicationId: number, docIndex: number, fallbackPath?: string) => {
    try {
      const res: any = await benefitsApi.downloadApplicationDocument(applicationId, docIndex)
      const blob = res?.data
      const contentType = String(res?.headers?.['content-type'] || '')
      if (!(blob instanceof Blob) || contentType.includes('application/json')) {
        throw new Error('Unable to open document')
      }

      const objectUrl = URL.createObjectURL(blob)
      window.open(objectUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch {
      if (fallbackPath) {
        const legacyUrl = `${(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000'}/uploads/${String(fallbackPath).replace(/^uploads\//, '')}`
        window.open(legacyUrl, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${municipalityVisual.theme.pageGradient} font-sans`}>
      <div className="container-responsive py-8 md:py-10 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[32px] border border-white/60 shadow-2xl"
        >
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={`${municipalityName} landmark`}
              className="h-full w-full object-cover"
              onError={(event) => {
                if (event.currentTarget.src.endsWith(HERO_FALLBACK_IMAGE)) return
                setHeroImage(HERO_FALLBACK_IMAGE)
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/45" />
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/20 via-transparent to-emerald-500/20" />
          </div>

          <div className="relative z-10 p-6 md:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur ${municipalityVisual.theme.badgeClass}`}>
                    <MapPin className="h-4 w-4" />
                    {municipalityName}
                  </span>
                  {barangayName && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
                      Barangay {barangayName}
                    </span>
                  )}
                  {municipalityVisual.isCapital && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-900">
                      <Landmark className="h-4 w-4" />
                      Capital of Zambales
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-start gap-4">
                  <div className="hidden h-14 w-14 rounded-2xl border border-white/30 bg-white/10 text-white shadow-lg backdrop-blur md:flex md:items-center md:justify-center">
                    <User className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                      Welcome back, {residentName}
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 md:text-lg">
                      You are signed in as a resident of <span className="font-semibold text-white">{municipalityName}</span>. Use this dashboard to follow your requests, keep up with local updates, and open the services you need most.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/documents"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
                  >
                    <FileText className="h-5 w-5 text-sky-700" />
                    Request a document
                  </Link>
                  <Link
                    to="/how-to-use"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/10 px-5 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <BookOpen className="h-5 w-5" />
                    How to use MunLink
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/20 bg-white/12 p-5 text-white shadow-xl backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                      <Sparkles className="h-3.5 w-3.5" />
                      Municipality spotlight
                    </div>
                    <h2 className="mt-4 text-2xl font-bold">{municipalityName}</h2>
                    <p className="mt-3 text-sm leading-6 text-white/85">{municipalityVisual.spotlight}</p>
                  </div>
                  <img
                    src={municipalitySeal.src}
                    alt={municipalitySeal.alt}
                    className="h-16 w-16 rounded-2xl border border-white/20 bg-white/15 object-contain p-2 shadow-sm"
                  />
                </div>
                <div className="mt-5 rounded-2xl bg-slate-950/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Good to know</div>
                  <p className="mt-2 text-sm leading-6 text-white/90">{municipalityVisual.fact}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={<Package size={18} />} label="Recent Items" value={items.length} hint="Latest marketplace posts" />
          <DashboardStatCard icon={<ShoppingBag size={18} />} label="Recent Transactions" value={txs.length} hint="Buyer and seller activity" />
          <DashboardStatCard icon={<FileText size={18} />} label="Recent Requests" value={reqs.length} hint="Document follow-ups" />
          <DashboardStatCard icon={<BookOpen size={18} />} label="Applications" value={apps.length} hint="Program applications" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  <BookOpen className="h-3.5 w-3.5" />
                  Start here
                </div>
                <h2 className="mt-4 text-2xl font-bold text-slate-900">Quick guide for first-time residents</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Keep your next steps simple. Start with your municipality, choose one service, then return here to monitor your activity.
                </p>
              </div>
              <Link
                to="/how-to-use"
                className="hidden rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 md:inline-flex"
              >
                Open full guide
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <QuickGuideStep
                number="1"
                title="Check your local identity"
                text={`Confirm that ${municipalityName}${barangayName ? ` and Barangay ${barangayName}` : ''} are shown correctly in your account.`}
              />
              <QuickGuideStep
                number="2"
                title="Choose one main task"
                text="Most residents start with documents, updates, marketplace activity, or concerns."
              />
              <QuickGuideStep
                number="3"
                title="Track progress later"
                text="Use the cards below to revisit requests, applications, items, and transactions without opening too many menus."
              />
            </div>

            <Link
              to="/how-to-use"
              className="mt-5 inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 md:hidden"
            >
              Open full guide
            </Link>
          </div>

          <div className={`rounded-3xl border p-6 shadow-sm ${municipalityVisual.theme.panelClass}`}>
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${municipalityVisual.theme.iconClass}`}>
              <MapPin className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">About your municipality</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              This dashboard now uses the same municipality image source shown on the About page so your home screen immediately feels tied to your local area.
            </p>
            <div className="mt-5 rounded-2xl border border-white/60 bg-white/80 p-4">
              <div className="text-sm font-semibold text-slate-900">{municipalityName}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{municipalityVisual.fact}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/announcements"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                Read updates
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-transparent px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/50"
              >
                Explore About page
              </Link>
            </div>
          </div>
        </section>

        {loading && items.length === 0 && txs.length === 0 && reqs.length === 0 && apps.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 h-5 w-1/3 rounded bg-slate-100" />
                <div className="space-y-3">
                  <div className="h-4 w-2/3 rounded bg-slate-100" />
                  <div className="h-4 w-1/2 rounded bg-slate-100" />
                  <div className="h-4 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ListCard
              title="My Items"
              icon={<Package size={18} />}
              emptyLabel="No items yet."
              footer={
                <Link to="/my-marketplace" className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-700 hover:underline">
                  View My Marketplace
                  <ArrowRight size={14} />
                </Link>
              }
              entries={items.map((it) => ({ id: it.id, primary: it.title, status: it.status }))}
              renderAction={(entry) => (
                <button
                  className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 transition hover:bg-rose-50"
                  onClick={async () => {
                    if (!window.confirm('Delete this item? This cannot be undone.')) return
                    try {
                      await marketplaceApi.deleteItem(Number(entry.id))
                      updateItems((prev: any) => {
                        const nextItems = (prev?.data?.items || prev || []).filter((item: any) => item.id !== entry.id)
                        return prev?.data ? { ...prev, data: { ...prev.data, items: nextItems } } : nextItems
                      })
                    } catch {}
                  }}
                >
                  Delete
                </button>
              )}
            />

            <ListCard
              title="My Transactions"
              icon={<ShoppingBag size={18} />}
              emptyLabel="No transactions yet."
              footer={
                <Link to="/my-marketplace?tab=transactions" className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-700 hover:underline">
                  See all
                  <ArrowRight size={14} />
                </Link>
              }
              entries={txs.map((t) => ({ id: t.id, primary: t.transaction_type, status: t.status, extra: { as: t.as } }))}
              renderAction={(entry) =>
                entry.status === 'pending' && entry.extra?.as === 'seller' ? (
                  <Link
                    to="/my-marketplace?tab=transactions"
                    className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Accept
                  </Link>
                ) : null
              }
            />

            <ListCard
              title="My Document Requests"
              icon={<FileText size={18} />}
              emptyLabel="No requests yet."
              footer={
                <Link to="/dashboard/requests" className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-700 hover:underline">
                  View all requests
                  <ArrowRight size={14} />
                </Link>
              }
              entries={reqs.map((request: any) => ({
                id: request.id,
                primary: `${request.document_type?.name || 'Document'} - ${request.request_number || ''}`.trim(),
                status: request.status,
                href: `/dashboard/requests/${request.id}`,
                extra: request,
              }))}
              renderAction={(entry) => {
                const extra = entry.extra || {}
                const isReadyPickup =
                  String(extra.status || '').toLowerCase() === 'ready' &&
                  String(extra.delivery_method || '').toLowerCase() !== 'digital'
                if (!isReadyPickup) return null
                return (
                  <Link
                    to={`/dashboard/requests/${extra.id}`}
                    className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 transition hover:bg-emerald-50"
                  >
                    View claim ticket
                  </Link>
                )
              }}
            />

            <ListCard
              title="My Program Applications"
              icon={<BookOpen size={18} />}
              emptyLabel="No applications yet."
              footer={
                <Link to="/programs?tab=applications" className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-700 hover:underline">
                  Open programs
                  <ArrowRight size={14} />
                </Link>
              }
              entries={apps.map((app) => ({
                id: app.id,
                primary: app.program?.name || app.application_number,
                status: app.status,
                extra: app,
              }))}
              renderAction={(entry) => (
                <button
                  className="rounded-lg border border-ocean-200 px-2 py-1 text-xs text-ocean-700 transition hover:bg-ocean-50"
                  onClick={() => {
                    setSelectedApp(entry.extra as MyBenefitApp)
                    setAppModalOpen(true)
                  }}
                >
                  View proof
                </button>
              )}
            />
          </section>
        )}

        <Modal
          isOpen={appModalOpen && !!selectedApp}
          onClose={() => {
            setAppModalOpen(false)
            setSelectedApp(null)
          }}
          title={selectedApp?.program?.name ? `Application: ${selectedApp.program.name}` : 'Application details'}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button className="btn-secondary" onClick={() => window.print()}>
                Print
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setAppModalOpen(false)
                  setSelectedApp(null)
                }}
              >
                Close
              </button>
            </div>
          }
        >
          {selectedApp && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Application No:</span> {selectedApp.application_number}
              </div>
              <div>
                <span className="font-medium">Program:</span> {selectedApp.program?.name || '-'}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span> <StatusBadge status={selectedApp.status} />
              </div>
              {selectedApp.created_at && (
                <div>
                  <span className="font-medium">Submitted:</span> {selectedApp.created_at.slice(0, 10)}
                </div>
              )}
              {Array.isArray(selectedApp.supporting_documents) && selectedApp.supporting_documents.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 font-medium">Uploaded Documents</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.supporting_documents.map((path, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => void openBenefitDocument(selectedApp.id, index, path)}
                        className="text-xs text-blue-700 underline"
                      >
                        Document {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 text-gray-600">
                You can print this page as proof of your application. Keep your Application No. for reference.
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

function DashboardStatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: number | string
  hint?: string
}) {
  return (
    <div className="group rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-700 text-white shadow-md">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
          <div className="text-3xl font-bold leading-tight text-slate-900">{value}</div>
          {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
        </div>
      </div>
    </div>
  )
}

type ListEntry = {
  id: number | string
  primary: string
  status: string
  href?: string
  extra?: any
}

function QuickGuideStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
        {number}
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}

function ListCard({
  title,
  icon,
  entries,
  emptyLabel,
  footer,
  renderAction,
}: {
  title: string
  icon?: ReactNode
  entries: ListEntry[]
  emptyLabel: string
  footer?: ReactNode
  renderAction?: (entry: ListEntry) => ReactNode | null
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="mb-5 flex items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-700 text-white shadow-md">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <motion.div
            key={`${String(entry.id)}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="grid grid-cols-1 items-center gap-2 rounded-2xl border border-slate-100 px-4 py-3 transition-all hover:border-ocean-200 hover:shadow-sm sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              {entry.href ? (
                <Link
                  to={entry.href}
                  className="block break-words text-base font-semibold text-ocean-700 transition-colors hover:text-ocean-800 hover:underline"
                >
                  {entry.primary}
                </Link>
              ) : (
                <div className="block break-words text-base font-semibold text-slate-900">{entry.primary}</div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:justify-end">
              <StatusBadge status={entry.status} />
              {renderAction ? renderAction(entry) : null}
            </div>
          </motion.div>
        ))}

        {entries.length === 0 && (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="italic">{emptyLabel}</span>
          </div>
        )}
      </div>

      {footer && <div className="mt-5 border-t border-slate-100 pt-4">{footer}</div>}
    </div>
  )
}
