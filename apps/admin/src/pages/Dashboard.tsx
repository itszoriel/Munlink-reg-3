import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button, Select, getBestRegion3Seal } from '@munlink/ui'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  FileSearch,
  Gift,
  Hand,
  Landmark,
  MapPin,
  Megaphone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react'
import { adminApi, userApi, issueApi, marketplaceApi, announcementApi } from '../lib/api'
import UserVerificationList from '../components/UserVerificationList'
import { useAdminStore } from '../lib/store'
import { useCachedFetch } from '../lib/useCachedFetch'
import { CACHE_KEYS } from '../lib/dataStore'
import { getMunicipalityVisual } from '../lib/municipalityVisuals'

const HERO_FALLBACK_IMAGE = '/assets/about.jpg'

type MetricTone = 'sky' | 'emerald' | 'amber' | 'violet' | 'rose'
type ActivityTone = 'ocean' | 'forest' | 'sunset' | 'purple' | 'red'
type ActivityIconCode = 'residents' | 'concern' | 'marketplace' | 'announcement'

export default function Dashboard() {
  const user = useAdminStore((s) => s.user)
  const isAuthBootstrapped = useAdminStore((s) => s.isAuthBootstrapped)
  const navigate = useNavigate()
  const [heroImage, setHeroImage] = useState(HERO_FALLBACK_IMAGE)

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

  useEffect(() => {
    setHeroImage(municipalityVisual.landmark || HERO_FALLBACK_IMAGE)
  }, [municipalityVisual.landmark])

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
        return 'from-ocean-400 to-ocean-600'
      case 'forest':
        return 'from-forest-400 to-forest-600'
      case 'sunset':
        return 'from-sunset-400 to-sunset-600'
      case 'red':
        return 'from-red-400 to-red-600'
      default:
        return 'from-neutral-400 to-neutral-600'
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
    { label: 'Documents', value: documents7, max: Math.max(10, documents7 || 10), color: 'forest' as const },
    { label: 'Marketplace', value: marketplace7, max: Math.max(10, marketplace7), color: 'sunset' as const },
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
    <div className={`min-h-screen bg-gradient-to-b ${municipalityVisual.theme.pageGradient}`}>
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[32px] border border-white/60 shadow-2xl"
        >
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={municipalityVisual.landmarkLabel}
              className="h-full w-full object-cover brightness-[0.5] contrast-[1.12] saturate-[1.04]"
              onError={(event) => {
                if (event.currentTarget.src.endsWith(HERO_FALLBACK_IMAGE)) return
                setHeroImage(HERO_FALLBACK_IMAGE)
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/78 to-slate-950/58" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/30" />
          </div>

          <div className="relative z-10 p-6 md:p-8 lg:p-9">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-end">
              <div className="max-w-3xl rounded-[24px] border border-white/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.5)] md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur ${municipalityVisual.theme.badgeClass}`}>
                    <MapPin className="h-4 w-4" />
                    {municipalityName}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/72 px-4 py-2 text-sm font-medium text-white/92">
                    <Building2 className="h-4 w-4" />
                    Municipal admin workspace
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/72 px-4 py-2 text-sm font-medium text-white/88">
                    <CalendarDays className="h-4 w-4" />
                    {dateStr}
                  </span>
                  {municipalityVisual.isCapital && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/90 px-4 py-2 text-sm font-semibold text-amber-900">
                      <Landmark className="h-4 w-4" />
                      Capital of Zambales
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-start gap-4">
                  <div className="hidden h-14 w-14 rounded-2xl border border-white/12 bg-slate-900/75 text-white shadow-lg md:flex md:items-center md:justify-center">
                    <Hand className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white [text-shadow:0_6px_20px_rgba(2,6,23,0.5)] md:text-4xl lg:text-5xl">
                      Welcome back, {adminName}
                    </h1>
                    <p className="mt-3 max-w-xl text-base leading-7 text-white/95 md:text-lg">
                      You are managing the <span className="font-semibold text-white">{municipalityName}</span> portal. Review residents, announcements, community concerns, and programs from one municipality-aware workspace.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate('/residents')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-500/22 px-5 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-sky-500/30"
                  >
                    <FileSearch className="h-5 w-5 text-white" />
                    Review residents
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/announcements')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-slate-900/72 px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-900/84"
                  >
                    <Megaphone className="h-5 w-5" />
                    Manage announcements
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-slate-950/80 p-4 text-white shadow-[0_24px_70px_rgba(2,6,23,0.42)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                      <Sparkles className="h-3.5 w-3.5" />
                      Municipality fact
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-white">{municipalityName}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/92">{municipalityVisual.spotlight}</p>
                  </div>
                  <img
                    src={municipalitySeal.src}
                    alt={municipalitySeal.alt}
                    className="h-16 w-16 rounded-2xl border border-white/15 bg-slate-900/78 object-contain p-2 shadow-sm"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/82 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Quick data</div>
                  <p className="mt-2 text-sm leading-6 text-white/95">
                    {municipalityVisual.operationsNote}
                  </p>
                  <a
                    href={municipalityVisual.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-xs font-medium text-sky-100 underline decoration-white/40 underline-offset-4 transition hover:text-white"
                  >
                    {municipalityVisual.sourceLabel}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <SectionFrame
            title="How to use this portal"
            subtitle="A quick guide for first-time municipal admins"
            actions={
              <Button size="sm" onClick={() => navigate('/how-to-use')} trailingIcon={<ArrowRight className="h-4 w-4" />}>
                Open full guide
              </Button>
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              <QuickGuideStep
                icon={<ClipboardList className="h-5 w-5" />}
                title="Start with the top cards"
                text="Use the queue counts first, then open the page that matches the next task you need to finish."
              />
              <QuickGuideStep
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Clear one queue at a time"
                text="Residents, concerns, announcements, and programs each have their own working page so your review stays focused."
              />
              <QuickGuideStep
                icon={<BookOpen className="h-5 w-5" />}
                title="Use the guide when unsure"
                text="Open the help page for a walkthrough of the screens that are available in the municipal portal."
              />
            </div>
          </SectionFrame>

          <div className={`rounded-[28px] border p-6 shadow-sm ${municipalityVisual.theme.panelClass}`}>
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${municipalityVisual.theme.iconClass}`}>
              <Landmark className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Quick fact about your municipality</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              This panel highlights a verified local fact about {municipalityName} so the admin workspace stays grounded in the municipality it serves.
            </p>
            <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 p-4">
              <div className="text-sm font-semibold text-slate-900">{municipalityVisual.landmarkLabel}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{municipalityVisual.fact}</p>
              <a
                href={municipalityVisual.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs font-medium text-ocean-700 underline decoration-ocean-300 underline-offset-4 transition hover:text-ocean-800"
              >
                {municipalityVisual.sourceLabel}
              </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate('/announcements')} trailingIcon={<ArrowRight className="h-4 w-4" />}>
                Open announcements
              </Button>
              <Button variant="outline" onClick={() => navigate('/reports')}>
                View reports
              </Button>
            </div>
          </div>
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
                    className="w-full rounded-2xl border border-slate-200 bg-white/85 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
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
                <div key={index} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 p-3 transition hover:border-slate-200 hover:bg-slate-100">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${activityToneIconClass(entry.color)}`}>
                    <ActivityIcon code={entry.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{entry.text}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{entry.who || 'System'} | {timeAgo(entry.ts)}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-slate-500">
                  {loading ? 'Loading recent activity...' : 'No recent activity.'}
                </div>
              )}
            </div>
          </SectionFrame>

          <SectionFrame
            title="Activity Overview"
            subtitle="Quick pulse of the last 7 days"
            actions={(
              <Select name="activityRange" aria-label="Select activity date range" className="min-w-[10rem] rounded-xl border-slate-200 bg-white text-sm" onChange={() => {}}>
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
                        className={`h-full rounded-full bg-gradient-to-r ${gradientClass(item.color)} transition-all duration-700 ease-out shadow-sm`}
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

function QuickGuideStep({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-5">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[color:var(--admin-accent-600)] shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
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
    <section className={`overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-sm backdrop-blur ${className || ''}`.trim()}>
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
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
      className={`w-full rounded-[28px] border p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${toneStyles.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{value.toLocaleString()}</p>
          <p className={`mt-3 text-sm ${toneStyles.hint}`}>{hint}</p>
        </div>
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${toneStyles.icon}`}>
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

function metricToneStyles(tone: MetricTone) {
  switch (tone) {
    case 'emerald':
      return {
        card: 'border-emerald-100/80 bg-white/92 hover:border-emerald-200',
        icon: 'bg-emerald-100 text-emerald-700',
        hint: 'text-emerald-700/85',
      }
    case 'amber':
      return {
        card: 'border-amber-100/80 bg-white/92 hover:border-amber-200',
        icon: 'bg-amber-100 text-amber-700',
        hint: 'text-amber-700/85',
      }
    case 'violet':
      return {
        card: 'border-violet-100/80 bg-white/92 hover:border-violet-200',
        icon: 'bg-violet-100 text-violet-700',
        hint: 'text-violet-700/85',
      }
    case 'rose':
      return {
        card: 'border-rose-100/80 bg-white/92 hover:border-rose-200',
        icon: 'bg-rose-100 text-rose-700',
        hint: 'text-rose-700/85',
      }
    default:
      return {
        card: 'border-sky-100/80 bg-white/92 hover:border-sky-200',
        icon: 'bg-sky-100 text-sky-700',
        hint: 'text-sky-700/85',
      }
  }
}

function activityToneIconClass(tone: ActivityTone) {
  switch (tone) {
    case 'forest':
      return 'bg-emerald-100 text-emerald-700'
    case 'sunset':
      return 'bg-amber-100 text-amber-700'
    case 'purple':
      return 'bg-violet-100 text-violet-700'
    case 'red':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-sky-100 text-sky-700'
  }
}
