import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Select, getBestRegion3Seal } from '@munlink/ui'
import {
  AlertTriangle,
  FileSearch,
  Gift,
  Megaphone,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { adminApi, userApi, issueApi, marketplaceApi, announcementApi } from '../lib/api'
import UserVerificationList from '../components/UserVerificationList'
import { useAdminStore } from '../lib/store'
import { useCachedFetch } from '../lib/useCachedFetch'
import { CACHE_KEYS } from '../lib/dataStore'
import { getMunicipalityVisual } from '../lib/municipalityVisuals'

type MetricTone = 'sky' | 'emerald' | 'amber' | 'violet' | 'rose'
type ActivityTone = 'ocean' | 'forest' | 'sunset' | 'purple' | 'red'
type ActivityIconCode = 'residents' | 'concern' | 'marketplace' | 'announcement'

export default function Dashboard() {
  const user = useAdminStore((s) => s.user)
  const isAuthBootstrapped = useAdminStore((s) => s.isAuthBootstrapped)
  const navigate = useNavigate()

  const municipalityName = (user as any)?.admin_municipality_name || (user as any)?.municipality_name || 'Zambales'
  const municipalitySlug = (user as any)?.admin_municipality_slug || (user as any)?.municipality_slug
  const adminName = user?.first_name || user?.username || 'Admin'

  const municipalityVisual = useMemo(
    () =>
      getMunicipalityVisual({
        municipalityName,
        municipalitySlug,
      }),
    [municipalityName, municipalitySlug]
  )

  const municipalitySeal = getBestRegion3Seal({
    municipality: municipalitySlug || municipalityName,
    province: 'Zambales',
  })

  const { data: dashData, loading: dashLoading, refetch: refetchDash } = useCachedFetch(
    CACHE_KEYS.DASHBOARD,
    () => adminApi.getReports(),
    {
      staleTime: 2 * 60 * 1000,
      enabled: isAuthBootstrapped,
    }
  )

  const { data: activityData, loading: activityLoading } = useCachedFetch(
    CACHE_KEYS.DASHBOARD_ACTIVITY,
    async () => {
      const [pendingUsersRes, issuesRes, itemsRes, announcementsRes, marketStatsRes] = await Promise.allSettled([
        userApi.getPendingUsers(),
        issueApi.getIssues({ page: 1, per_page: 20 }),
        marketplaceApi.getPendingItems(),
        announcementApi.getAnnouncements(),
        marketplaceApi.getMarketplaceStats(),
      ])
      return { pendingUsersRes, issuesRes, itemsRes, announcementsRes, marketStatsRes }
    },
    {
      staleTime: 5 * 60 * 1000,
      enabled: isAuthBootstrapped,
    }
  )

  const d = (dashData as any)?.dashboard || dashData
  const dash = {
    pending_verifications: d?.pending_verifications ?? 0,
    active_problems: d?.active_issues ?? d?.active_problems ?? 0,
    marketplace_items: d?.marketplace_items ?? 0,
    announcements: d?.announcements ?? 0,
    active_programs: d?.active_programs ?? 0,
  }

  const pendingUsers = activityData && (activityData as any).pendingUsersRes?.status === 'fulfilled'
    ? (((activityData as any).pendingUsersRes.value as any)?.data?.users || ((activityData as any).pendingUsersRes.value as any)?.users || [])
    : []
  const issues = activityData && (activityData as any).issuesRes?.status === 'fulfilled'
    ? (((activityData as any).issuesRes.value as any)?.data?.data || ((activityData as any).issuesRes.value as any)?.data || ((activityData as any).issuesRes.value as any)?.issues || [])
    : []
  const items = activityData && (activityData as any).itemsRes?.status === 'fulfilled'
    ? ((((activityData as any).itemsRes.value as any)?.data?.data?.items) || ((activityData as any).itemsRes.value as any)?.data?.items || ((activityData as any).itemsRes.value as any)?.items || [])
    : []
  const announcements = activityData && (activityData as any).announcementsRes?.status === 'fulfilled'
    ? ((((activityData as any).announcementsRes.value as any)?.data?.announcements) || ((activityData as any).announcementsRes.value as any)?.announcements || [])
    : []
  const recentAnnouncements = announcements.slice(0, 3)
  const marketStats = activityData && (activityData as any).marketStatsRes?.status === 'fulfilled'
    ? (((activityData as any).marketStatsRes.value as any)?.data || (activityData as any).marketStatsRes.value)
    : undefined

  const loading = dashLoading || activityLoading

  const gradientClass = (color: 'ocean' | 'forest' | 'sunset' | 'red') => {
    switch (color) {
      case 'ocean':
        return 'bg-ocean-600'
      case 'forest':
        return 'bg-forest-600'
      case 'sunset':
        return 'bg-sunset-600'
      case 'red':
        return 'bg-red-600'
      default:
        return 'bg-neutral-600'
    }
  }

  const reloadStats = async () => {
    refetchDash()
  }

  const totalMarket = marketStats?.total_items ?? marketStats?.approved_items ?? items.length
  const pendingCount = Array.isArray(pendingUsers) ? pendingUsers.length : 0
  const activeProblemsCount = Array.isArray(issues)
    ? issues.filter((it: any) => {
        const state = String(it.status || it.state || '').toLowerCase()
        return state.includes('active') || state.includes('in_progress') || state.includes('under') || state === ''
      }).length
    : 0

  const finalDash = {
    pending_verifications: pendingCount || dash.pending_verifications || 0,
    active_problems: activeProblemsCount || dash.active_problems || 0,
    marketplace_items: typeof totalMarket === 'number' ? totalMarket : (dash.marketplace_items ?? 0),
    announcements: announcements.length || dash.announcements || 0,
    active_programs: dash.active_programs || 0,
  }

  const in7 = (value?: string) => {
    if (!value) return false
    const parsed = new Date(value)
    return Number.isFinite(parsed.getTime()) && (Date.now() - parsed.getTime()) < (7 * 24 * 60 * 60 * 1000)
  }

  const verifications7 = pendingUsers.filter((entry: any) => in7(entry.created_at)).length
  const documents7 = 0
  const marketplace7 = items.filter((entry: any) => in7(entry.created_at)).length
  const problems7 = issues.filter((entry: any) => in7(entry.created_at)).length

  const overview = [
    { label: 'Verifications', value: verifications7, max: Math.max(10, verifications7), color: 'ocean' as const },
    { label: 'Documents', value: documents7, max: Math.max(10, documents7 || 10), color: 'ocean' as const },
    { label: 'Marketplace', value: marketplace7, max: Math.max(10, marketplace7), color: 'ocean' as const },
    { label: 'Community Concerns', value: problems7, max: Math.max(10, problems7), color: 'red' as const },
  ]

  const activity: Array<{ icon: ActivityIconCode; text: string; who?: string; ts: number; color: ActivityTone }> = []

  for (const entry of pendingUsers) {
    const ts = new Date(entry.created_at || entry.updated_at || Date.now()).getTime()
    activity.push({
      icon: 'residents',
      text: 'New registration',
      who: `${entry.first_name ?? ''} ${entry.last_name ?? ''}`.trim(),
      ts,
      color: 'ocean',
    })
  }

  for (const entry of issues) {
    const ts = new Date(entry.created_at || entry.updated_at || Date.now()).getTime()
    activity.push({
      icon: 'concern',
      text: `Concern: ${entry.title ?? entry.category ?? 'New concern'}`,
      who: entry.created_by_name,
      ts,
      color: 'red',
    })
  }

  for (const entry of items) {
    const ts = new Date(entry.created_at || entry.updated_at || Date.now()).getTime()
    activity.push({
      icon: 'marketplace',
      text: `Marketplace: ${entry.title ?? 'New item'}`,
      who: entry.seller_name,
      ts,
      color: 'sunset',
    })
  }

  for (const entry of announcements) {
    const ts = new Date(entry.created_at || entry.updated_at || Date.now()).getTime()
    activity.push({
      icon: 'announcement',
      text: `Announcement: ${entry.title ?? 'New announcement'}`,
      who: entry.created_by_name,
      ts,
      color: 'purple',
    })
  }

  activity.sort((a, b) => b.ts - a.ts)
  const recentActivity = activity.slice(0, 10)

  const timeAgo = (ts: number) => {
    const diff = Math.max(0, Date.now() - ts)
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
    const days = Math.floor(hrs / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const stats = [
    {
      title: 'Pending Verifications',
      value: loading ? 0 : (finalDash.pending_verifications ?? 0),
      hint: 'Residents waiting for review',
      icon: <Users className="h-5 w-5" />,
      tone: 'sky' as const,
      onClick: () => navigate('/residents'),
    },
    {
      title: 'Active Concerns',
      value: loading ? 0 : (finalDash.active_problems ?? 0),
      hint: 'Open community follow-ups',
      icon: <AlertTriangle className="h-5 w-5" />,
      tone: 'rose' as const,
      onClick: () => navigate('/problems'),
    },
    {
      title: 'Marketplace Items',
      value: loading ? 0 : (finalDash.marketplace_items ?? 0),
      hint: 'Live local marketplace posts',
      icon: <ShoppingBag className="h-5 w-5" />,
      tone: 'amber' as const,
      onClick: () => navigate('/transactions'),
    },
    {
      title: 'Announcements',
      value: loading ? 0 : (finalDash.announcements ?? 0),
      hint: 'Published municipal updates',
      icon: <Megaphone className="h-5 w-5" />,
      tone: 'violet' as const,
      onClick: () => navigate('/announcements'),
    },
    {
      title: 'Active Programs',
      value: loading ? 0 : (finalDash.active_programs ?? 0),
      hint: 'Benefit programs in rotation',
      icon: <Gift className="h-5 w-5" />,
      tone: 'emerald' as const,
      onClick: () => navigate('/programs'),
    },
  ]

  return (
    <div className={`min-h-screen bg-[#f6f7f9]`}>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <img src={municipalitySeal.src} alt={municipalitySeal.alt} className="h-14 w-14 rounded-full border border-slate-200 bg-white object-contain p-1" />
            <div>
              <p className="text-sm text-slate-600">
                {municipalityName}{municipalityVisual.isCapital ? ' · Capital of Zambales' : ''} · {dateStr}
              </p>
              <h1 className="mt-0.5 text-2xl font-semibold text-slate-900">Good day, {adminName}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/announcements')} leadingIcon={<Megaphone className="h-4 w-4" aria-hidden="true" />}>
              Announcements
            </Button>
            <Button onClick={() => navigate('/residents')} leadingIcon={<FileSearch className="h-4 w-4" aria-hidden="true" />}>
              Review residents
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((item) => (
            <DashboardMetricCard
              key={item.title}
              title={item.title}
              value={item.value}
              hint={item.hint}
              icon={item.icon}
              tone={item.tone}
              onClick={item.onClick}
            />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SectionFrame
            className="lg:col-span-2"
            title="Pending User Verifications"
            subtitle="Review and approve resident registrations"
            actions={
              <Button variant="secondary" size="sm" onClick={() => navigate('/residents')}>
                View all
              </Button>
            }
          >
            <UserVerificationList
              onUserVerified={reloadStats}
              onUserRejected={reloadStats}
              onReview={(entry) => navigate(`/residents?open=${entry.id}`)}
            />
          </SectionFrame>

          <SectionFrame
            title="Announcements"
            subtitle="Create and manage public announcements"
          >
            <Button fullWidth className="mb-6" onClick={() => navigate('/announcements')}>
              Create announcement
            </Button>
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-3">
                {recentAnnouncements.map((entry: any, index: number) => (
                  <button
                    type="button"
                    key={`${entry.id}-${index}`}
                    onClick={() => navigate('/announcements')}
                    className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">{entry.title}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-600">{String(entry.content || '').slice(0, 120) || 'No preview available.'}</div>
                        <div className="mt-2 text-xs font-medium text-slate-500">{String(entry.created_at || '').slice(0, 10) || 'Draft'}</div>
                      </div>
                    </div>
                  </button>
                ))}
                <Button variant="secondary" fullWidth onClick={() => navigate('/announcements')}>
                  View all
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm">
                  <Megaphone className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">No announcements yet</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Create your first municipal announcement to publish updates from {municipalityName}.</p>
              </div>
            )}
          </SectionFrame>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionFrame title="Recent Activity" subtitle="Latest municipal actions across your queues">
            <div className="space-y-3">
              {recentActivity.map((entry, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/90 p-3 transition hover:border-slate-200 hover:bg-slate-100">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${activityToneIconClass(entry.color)}`}>
                    <ActivityIcon code={entry.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{entry.text}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{entry.who || 'System'} | {timeAgo(entry.ts)}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-slate-500">
                  {loading ? 'Loading recent activity...' : 'No recent activity.'}
                </div>
              )}
            </div>
          </SectionFrame>

          <SectionFrame
            title="Activity Overview"
            subtitle="Quick pulse of the last 7 days"
            actions={(
              <Select name="activityRange" aria-label="Select activity date range" className="min-w-[10rem] rounded-lg border-slate-200 bg-white text-sm" onChange={() => {}}>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </Select>
            )}
          >
            <div className="space-y-5">
              {overview.map((item, index) => {
                const pct = Math.min(100, Math.max(0, item.max ? (item.value / item.max) * 100 : 0))
                return (
                  <div key={index}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${gradientClass(item.color)} transition-all duration-700 ease-out shadow-sm`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionFrame>
        </section>
      </div>
    </div>
  )
}

function SectionFrame({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${className || ''}`.trim()}>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  )
}

function DashboardMetricCard({
  title,
  value,
  hint,
  icon,
  tone,
  onClick,
}: {
  title: string
  value: number
  hint: string
  icon: ReactNode
  tone: MetricTone
  onClick: () => void
}) {
  const toneStyles = metricToneStyles(tone)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${toneStyles.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value.toLocaleString()}</p>
          <p className={`mt-1 text-sm ${toneStyles.hint}`}>{hint}</p>
        </div>
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${toneStyles.icon}`}>
          {icon}
        </div>
      </div>
    </button>
  )
}

function ActivityIcon({ code, className }: { code: ActivityIconCode; className?: string }) {
  if (code === 'concern') return <AlertTriangle className={className || 'h-5 w-5'} aria-hidden="true" />
  if (code === 'marketplace') return <ShoppingBag className={className || 'h-5 w-5'} aria-hidden="true" />
  if (code === 'announcement') return <Megaphone className={className || 'h-5 w-5'} aria-hidden="true" />
  return <Users className={className || 'h-5 w-5'} aria-hidden="true" />
}

function metricToneStyles(_tone: MetricTone) {
  return {
    card: 'border-slate-200 bg-white hover:border-navy-300',
    icon: 'bg-navy-50 text-navy-700',
    hint: 'text-slate-600',
  }
}

function activityToneIconClass(_tone: ActivityTone) {
  return 'bg-slate-100 text-slate-700'
}
