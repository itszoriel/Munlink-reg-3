import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, getBestRegion3Seal } from '@munlink/ui'
import { AlertTriangle, Megaphone, QrCode, ShoppingBag, Users } from 'lucide-react'
import { adminApi, userApi, issueApi, marketplaceApi, announcementApi, documentsAdminApi } from '../lib/api'
import UserVerificationList from '../components/UserVerificationList'
import { useAdminStore } from '../lib/store'
import { useCachedFetch } from '../lib/useCachedFetch'
import { CACHE_KEYS } from '../lib/dataStore'

type ActivityIconCode = 'residents' | 'concern' | 'marketplace' | 'announcement'

/**
 * The office logbook: what is waiting today, oldest first. No greeting, no
 * vanity totals; every number here is a live count that links to its queue.
 */
export default function Dashboard() {
  const user = useAdminStore((s) => s.user)
  const isAuthBootstrapped = useAdminStore((s) => s.isAuthBootstrapped)
  const navigate = useNavigate()

  const municipalityName = (user as any)?.admin_municipality_name || (user as any)?.municipality_name || 'Zambales'
  const municipalitySlug = (user as any)?.admin_municipality_slug || (user as any)?.municipality_slug
  const municipalitySeal = getBestRegion3Seal({ municipality: municipalitySlug || municipalityName, province: 'Zambales' })

  const { data: dashData, loading: dashLoading, refetch: refetchDash } = useCachedFetch(
    CACHE_KEYS.DASHBOARD,
    () => adminApi.getReports(),
    { staleTime: 2 * 60 * 1000, enabled: isAuthBootstrapped }
  )

  const { data: queueData, loading: queueLoading, refetch: refetchQueue } = useCachedFetch(
    'admin_documents_queue',
    () => documentsAdminApi.getQueue(),
    { staleTime: 60 * 1000, enabled: isAuthBootstrapped }
  )

  const { data: feeData } = useCachedFetch(
    'admin_document_types',
    () => documentsAdminApi.listDocumentTypes(),
    { staleTime: 5 * 60 * 1000, enabled: isAuthBootstrapped }
  )

  const { data: activityData, loading: activityLoading } = useCachedFetch(
    CACHE_KEYS.DASHBOARD_ACTIVITY,
    async () => {
      const [pendingUsersRes, issuesRes, itemsRes, announcementsRes] = await Promise.allSettled([
        userApi.getPendingUsers(),
        issueApi.getIssues({ page: 1, per_page: 20 }),
        marketplaceApi.getPendingItems(),
        announcementApi.getAnnouncements(),
      ])
      return { pendingUsersRes, issuesRes, itemsRes, announcementsRes }
    },
    { staleTime: 5 * 60 * 1000, enabled: isAuthBootstrapped }
  )

  const settled = (key: string) => {
    const r = (activityData as any)?.[key]
    return r?.status === 'fulfilled' ? r.value : undefined
  }
  const pendingUsers: any[] = settled('pendingUsersRes')?.data?.users || settled('pendingUsersRes')?.users || []
  const issues: any[] = settled('issuesRes')?.data?.data || settled('issuesRes')?.data || settled('issuesRes')?.issues || []
  const items: any[] = settled('itemsRes')?.data?.data?.items || settled('itemsRes')?.data?.items || settled('itemsRes')?.items || []
  const announcements: any[] = settled('announcementsRes')?.data?.announcements || settled('announcementsRes')?.announcements || []

  const d = (dashData as any)?.dashboard || dashData
  const openConcerns = Array.isArray(issues)
    ? issues.filter((it: any) => {
        const state = String(it.status || it.state || '').toLowerCase()
        return state.includes('active') || state.includes('in_progress') || state.includes('under') || state === '' || state === 'pending'
      }).length
    : 0

  const queue = queueData as any
  const unconfirmedFees = ((feeData as any)?.types || []).filter((t: any) => !t.fee_confirmed && Number(t.fee) > 0).length

  const waitingDays = (() => {
    if (!queue?.oldest_waiting_at) return null
    const days = Math.floor((Date.now() - new Date(queue.oldest_waiting_at).getTime()) / 86400000)
    return Number.isFinite(days) ? Math.max(0, days) : null
  })()

  const statusParam = (group: string) => encodeURIComponent((queue?.status_groups?.[group] || []).join(','))

  const rows: Array<{ label: string; detail: string; value: number | null; to: string; urgent?: boolean }> = [
    {
      label: 'Document requests waiting',
      detail: waitingDays === null ? 'Nothing waiting' : waitingDays === 0 ? 'Oldest arrived today' : `Oldest has waited ${waitingDays} day${waitingDays === 1 ? '' : 's'}`,
      value: queue ? queue.waiting : null,
      to: `/requests?status=${statusParam('waiting')}`,
      urgent: (waitingDays ?? 0) >= 3,
    },
    { label: 'Being processed', detail: 'Approved, being prepared', value: queue ? queue.in_progress : null, to: `/requests?status=${statusParam('in_progress')}` },
    { label: 'Ready for pickup', detail: 'Residents can claim these now', value: queue ? queue.ready_for_pickup : null, to: `/requests?status=${statusParam('ready_for_pickup')}` },
    { label: 'Payments to confirm', detail: 'Proof of payment submitted', value: queue ? queue.payments_to_review : null, to: '/requests?payment=submitted' },
    {
      label: 'Residents to verify',
      detail: 'New accounts with ID uploaded',
      value: dashLoading && activityLoading ? null : (pendingUsers.length || d?.pending_verifications || 0),
      to: '/residents',
    },
    { label: 'Open community concerns', detail: 'Reported problems not yet resolved', value: activityLoading ? null : openConcerns, to: '/problems' },
  ]

  const activity: Array<{ icon: ActivityIconCode; text: string; who?: string; ts: number }> = []
  for (const e of pendingUsers) activity.push({ icon: 'residents', text: 'New registration', who: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(), ts: new Date(e.created_at || Date.now()).getTime() })
  for (const e of issues) activity.push({ icon: 'concern', text: `Concern: ${e.title ?? e.category ?? 'New concern'}`, who: e.created_by_name, ts: new Date(e.created_at || Date.now()).getTime() })
  for (const e of items) activity.push({ icon: 'marketplace', text: `Marketplace post: ${e.title ?? 'New item'}`, who: e.seller_name, ts: new Date(e.created_at || Date.now()).getTime() })
  for (const e of announcements) activity.push({ icon: 'announcement', text: `Announcement: ${e.title ?? 'Untitled'}`, who: e.created_by_name, ts: new Date(e.created_at || Date.now()).getTime() })
  activity.sort((a, b) => b.ts - a.ts)
  const recentActivity = activity.slice(0, 8)

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <img src={municipalitySeal.src} alt={municipalitySeal.alt} className="h-14 w-14 rounded-full border border-slate-200 bg-white object-contain p-1" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Today at {municipalityName}</h1>
            <p className="mt-0.5 text-sm text-slate-600">{today}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/verify-ticket')} leadingIcon={<QrCode className="h-4 w-4" aria-hidden="true" />}>
            Scan a claim stub
          </Button>
          <Button onClick={() => navigate('/requests')}>Open request queue</Button>
        </div>
      </header>

      {unconfirmedFees > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between" role="note">
          <p>
            <strong className="font-semibold">{unconfirmedFees} document fee{unconfirmedFees === 1 ? ' is' : 's are'} still provisional.</strong>{' '}
            Residents see them labelled “provisional” until your office confirms the amounts.
          </p>
          <Link to="/fees" className="btn-secondary whitespace-nowrap">Review fees</Link>
        </div>
      )}

      <section aria-labelledby="queue-heading" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <h2 id="queue-heading" className="border-b border-slate-200 px-5 py-3 text-base font-semibold text-slate-900">What needs attention</h2>
        <ul className="divide-y divide-slate-200">
          {rows.map((row) => (
            <li key={row.label}>
              <Link to={row.to} className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50">
                <span className={`text-right text-2xl font-semibold tabular-nums ${row.urgent ? 'text-red-700' : 'text-slate-900'}`}>
                  {row.value === null || (queueLoading && row.to.startsWith('/requests')) ? <span className="skeleton inline-block h-7 w-10 rounded" aria-label="Loading" /> : row.value}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-slate-900">{row.label}</span>
                  <span className={`block text-sm ${row.urgent ? 'font-medium text-red-700' : 'text-slate-600'}`}>{row.detail}</span>
                </span>
                <span className="text-sm font-medium text-navy-700">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionFrame
          className="lg:col-span-2"
          title="Residents waiting for verification"
          actions={<Button variant="secondary" size="sm" onClick={() => navigate('/residents')}>All residents</Button>}
        >
          <UserVerificationList
            onUserVerified={() => { refetchDash(); refetchQueue() }}
            onUserRejected={() => { refetchDash(); refetchQueue() }}
            onReview={(entry) => navigate(`/residents?open=${entry.id}`)}
          />
        </SectionFrame>

        <SectionFrame title="Recent activity" actions={<Button variant="secondary" size="sm" onClick={() => navigate('/announcements')} leadingIcon={<Megaphone className="h-4 w-4" aria-hidden="true" />}>Post</Button>}>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-600">{activityLoading ? 'Loading…' : 'No recent activity.'}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentActivity.map((entry, index) => (
                <li key={index} className="flex items-start gap-3 py-2.5">
                  <ActivityIcon code={entry.icon} className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-900">{entry.text}</p>
                    <p className="text-xs text-slate-600">{entry.who || 'System'} · {timeAgo(entry.ts)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionFrame>
      </section>
    </div>
  )
}

function timeAgo(ts: number) {
  const mins = Math.floor(Math.max(0, Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function SectionFrame({ title, actions, children, className }: { title: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${className || ''}`.trim()}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function ActivityIcon({ code, className }: { code: ActivityIconCode; className?: string }) {
  if (code === 'concern') return <AlertTriangle className={className} aria-hidden="true" />
  if (code === 'marketplace') return <ShoppingBag className={className} aria-hidden="true" />
  if (code === 'announcement') return <Megaphone className={className} aria-hidden="true" />
  return <Users className={className} aria-hidden="true" />
}
