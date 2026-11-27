import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { benefitsApi, documentsApi, marketplaceApi, showToast } from '@/lib/api'
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
  Package,
  ShoppingBag,
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


export default function DashboardPage() {
  const [appModalOpen, setAppModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<MyBenefitApp | null>(null)
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

  const openBenefitDocument = async (applicationId: number, docIndex: number) => {
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
      showToast('Could not open this document. Please try again.', 'error')
    }
  }

  return (
    <div className={`min-h-screen bg-[#f6f7f9] font-sans`}>
      <div className="container-responsive py-8 md:py-10 space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <img src={municipalitySeal.src} alt={municipalitySeal.alt} className="h-14 w-14 rounded-full border border-slate-200 bg-white object-contain p-1" />
            <div>
              <p className="text-sm text-slate-600">
                {municipalityName}{barangayName ? ` · ${barangayName}` : ''}
              </p>
              <h1 className="mt-0.5 text-2xl font-semibold text-slate-900">Good day, {residentName}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/how-to-use" className="btn-secondary">How to use MunLink</Link>
            <Link to="/documents" className="btn-primary">Request a document</Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard icon={<Package size={18} />} label="Recent Items" value={items.length} hint="Latest marketplace posts" />
          <DashboardStatCard icon={<ShoppingBag size={18} />} label="Recent Transactions" value={txs.length} hint="Buyer and seller activity" />
          <DashboardStatCard icon={<FileText size={18} />} label="Recent Requests" value={reqs.length} hint="Document follow-ups" />
          <DashboardStatCard icon={<BookOpen size={18} />} label="Applications" value={apps.length} hint="Program applications" />
        </section>


        {loading && items.length === 0 && txs.length === 0 && reqs.length === 0 && apps.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
                    {selectedApp.supporting_documents.map((_doc, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => void openBenefitDocument(selectedApp.id, index)}
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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-navy-50 text-navy-700">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-600">{label}</div>
          <div className="text-2xl font-semibold leading-tight text-slate-900">{value}</div>
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
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy-50 text-navy-700">
            {icon}
          </div>
        )}
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={`${String(entry.id)}-${index}`}
            className="grid grid-cols-1 items-center gap-2 rounded-md border border-slate-200 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
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
          </div>
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
