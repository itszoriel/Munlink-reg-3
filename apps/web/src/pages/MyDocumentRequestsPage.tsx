import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { documentsApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { useCachedFetch } from '@/lib/useCachedFetch'
import { CACHE_KEYS } from '@/lib/dataStore'
import { StatusBadge, EmptyState } from '@munlink/ui'
import RequestTimeline from '@/components/RequestTimeline'
import { useLang } from '@/lib/i18n'
import { statusInfo, statusLabel } from '@/lib/requestStatus'

type DocumentRequest = {
  id: number
  request_number: string
  status: string
  delivery_method?: string
  created_at?: string
  approved_at?: string
  ready_at?: string
  completed_at?: string
  document_type?: { name: string; code: string }
}

type Filter = 'all' | 'open' | 'ready' | 'done'

export default function MyDocumentRequestsPage() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const isAuthBootstrapped = useAppStore((s) => s.isAuthBootstrapped)
  const [filter, setFilter] = useState<Filter>('all')
  const { t, lang } = useLang()

  const { data: requestsData, loading } = useCachedFetch(
    CACHE_KEYS.DOCUMENT_REQUESTS,
    () => documentsApi.getMyRequests(),
    { enabled: isAuthBootstrapped && isAuthenticated, staleTime: 2 * 60 * 1000 }
  )

  const allRequests = ((requestsData as any)?.data?.requests || (requestsData as any)?.requests || []) as DocumentRequest[]

  const matches = (r: DocumentRequest) => {
    const stage = statusInfo(r.status).stage
    if (filter === 'open') return stage === 'received' || stage === 'processing'
    if (filter === 'ready') return stage === 'ready'
    if (filter === 'done') return stage === 'released' || stage === 'stopped'
    return true
  }
  const requests = allRequests.filter(matches)

  const FILTERS: { value: Filter; en: string; fil: string }[] = [
    { value: 'all', en: 'All', fil: 'Lahat' },
    { value: 'open', en: 'In progress', fil: 'Isinasagawa' },
    { value: 'ready', en: 'Ready', fil: 'Handa na' },
    { value: 'done', en: 'Finished', fil: 'Tapos na' },
  ]

  return (
    <div className="container-responsive py-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{t('My document requests', 'Aking mga kahilingan')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('Follow each request from received to released.', 'Subaybayan ang bawat kahilingan mula natanggap hanggang naibigay.')}</p>
        </div>
        <Link to="/documents" className="btn-primary">
          <FileText className="h-4 w-4" aria-hidden="true" />
          {t('Request a document', 'Humiling ng dokumento')}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t('Filter requests', 'Salain ang mga kahilingan')}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`min-h-[40px] rounded-md border px-3 text-sm font-medium transition-colors ${
              filter === f.value ? 'border-navy-700 bg-navy-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t(f.en, f.fil)}
          </button>
        ))}
      </div>

      {loading && allRequests.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-card h-28" />)}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon="document"
          title={filter === 'all' ? t('No document requests yet', 'Wala ka pang kahilingan') : t('Nothing here', 'Wala rito')}
          description={filter === 'all'
            ? t('Choose a document from your town\'s list to send your first request.', 'Pumili ng dokumento mula sa listahan ng iyong bayan para sa unang kahilingan.')
            : t('No requests match this filter.', 'Walang kahilingang tugma sa filter na ito.')}
          action={filter === 'all'
            ? <Link to="/documents" className="btn-primary">{t('Request a document', 'Humiling ng dokumento')}</Link>
            : <button type="button" className="btn-secondary" onClick={() => setFilter('all')}>{t('Show all', 'Ipakita lahat')}</button>}
        />
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {requests.map((r) => {
            const digital = r.delivery_method?.toLowerCase() === 'digital'
            const ready = statusInfo(r.status).stage === 'ready'
            return (
              <li key={r.id} className="grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-900">{r.document_type?.name || t('Document', 'Dokumento')}</h2>
                  <p className="text-xs tabular-nums text-slate-600">{r.request_number}</p>
                  <div className="mt-2">
                    <StatusBadge status={r.status}>{statusLabel(r.status, lang)}</StatusBadge>
                  </div>
                </div>
                <RequestTimeline
                  status={r.status}
                  pickup={!digital}
                  compact
                  dates={{ received: r.created_at, processing: r.approved_at, ready: r.ready_at, released: r.completed_at }}
                />
                <Link to={`/dashboard/requests/${r.id}`} className={ready ? 'btn-primary' : 'btn-secondary'}>
                  {ready && !digital ? t('Open claim stub', 'Buksan ang claim stub') : t('View details', 'Tingnan')}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
