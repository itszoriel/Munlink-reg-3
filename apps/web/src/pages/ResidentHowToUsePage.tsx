import { Link } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  FileText,
  LayoutDashboard,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  TriangleAlert,
  User,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getMunicipalityVisual } from '@/lib/municipalityVisuals'

type GuideSection = {
  title: string
  description: string
  icon: typeof LayoutDashboard
  steps: string[]
  href: string
  hrefLabel: string
}

const residentGuideSections: GuideSection[] = [
  {
    title: 'Start at your dashboard',
    description: 'Your dashboard is your home screen for requests, marketplace activity, and applications.',
    icon: LayoutDashboard,
    steps: [
      'Check your municipality badge and recent counts right after login.',
      'Use the quick guide if you are new to the platform.',
      'Open your recent requests and activity cards for the items you need to follow up on first.',
    ],
    href: '/dashboard',
    hrefLabel: 'Open dashboard',
  },
  {
    title: 'Read announcements and updates',
    description: 'Stay updated on province, municipality, and barangay announcements.',
    icon: Bell,
    steps: [
      'Open Updates to read the latest announcements.',
      'If you want to explore another valid Zambales area, use the municipality and barangay filters in the header.',
      'Open an announcement card to read the full details and images.',
    ],
    href: '/announcements',
    hrefLabel: 'Open updates',
  },
  {
    title: 'Request and track documents',
    description: 'Choose a document type, fill in the request details, upload requirements, and track progress.',
    icon: FileText,
    steps: [
      'Open Documents and choose the document type you need.',
      'Review the fee preview, pickup or digital options, and upload any required files.',
      'Track submitted requests from your request history and open the request details page for updates or claim information.',
    ],
    href: '/documents',
    hrefLabel: 'Open documents',
  },
  {
    title: 'Use the marketplace',
    description: 'Browse listings, create your own post, and manage transactions from your account.',
    icon: ShoppingBag,
    steps: [
      'Open Marketplace to browse items in your area.',
      'Post an item when you want to sell, lend, donate, or offer something locally.',
      'Use My Marketplace to manage your items and review buyer or seller transactions.',
    ],
    href: '/marketplace',
    hrefLabel: 'Open marketplace',
  },
  {
    title: 'Report community concerns',
    description: 'Send local concerns to your municipality and keep track of your submitted reports.',
    icon: TriangleAlert,
    steps: [
      'Open Community Concerns and choose the report option.',
      'Add the concern details clearly and attach evidence if needed.',
      'Check the status of your reports from the same page.',
    ],
    href: '/problems',
    hrefLabel: 'Open concerns',
  },
  {
    title: 'Apply to programs',
    description: 'Review available programs for your municipality and submit an application when eligible.',
    icon: ShieldCheck,
    steps: [
      'Open Programs to see active opportunities.',
      'Use the guided application steps to complete the form and upload supporting files.',
      'Switch to your applications view to monitor progress.',
    ],
    href: '/programs',
    hrefLabel: 'Open programs',
  },
  {
    title: 'Keep your profile updated',
    description: 'Your account details help the system show the right municipality, barangay, and services.',
    icon: User,
    steps: [
      'Open Profile to review your personal details and photo.',
      'Update your location details carefully so requests and local pages stay aligned with your account.',
      'Use your profile if you need to manage notification preferences or submit a transfer request.',
    ],
    href: '/profile',
    hrefLabel: 'Open profile',
  },
]

export default function ResidentHowToUsePage() {
  const user = useAppStore((s) => s.user)
  const municipalityVisual = getMunicipalityVisual({
    municipalityName: (user as any)?.municipality_name,
    municipalitySlug: (user as any)?.municipality_slug,
  })
  const municipalityName = (user as any)?.municipality_name || municipalityVisual.name
  const barangayName = (user as any)?.barangay_name

  return (
    <div className={`min-h-screen bg-gradient-to-b ${municipalityVisual.theme.pageGradient} font-sans`}>
      <div className="container-responsive py-10 md:py-12 space-y-8">
        <section className="rounded-[32px] border border-white/60 bg-white/85 p-6 md:p-8 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                <BookOpen className="h-4 w-4" />
                Resident guide
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                How to use MunLink
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600 md:text-lg">
                Start with the basics, then move through the features one by one. This guide only covers the tools that are already available in the resident website.
              </p>
            </div>
            <div className={`rounded-2xl border px-4 py-4 shadow-sm ${municipalityVisual.theme.panelClass}`}>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPin className="h-4 w-4" />
                Your current area
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900">{municipalityName}</div>
              {barangayName ? (
                <div className="mt-1 text-sm text-slate-600">Barangay {barangayName}</div>
              ) : (
                <div className="mt-1 text-sm text-slate-600">Barangay not yet shown on your profile.</div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <QuickStep
              title="1. Know your home area"
              text="Check your dashboard header so you can confirm the municipality and barangay tied to your account."
            />
            <QuickStep
              title="2. Choose one main task"
              text="Most residents start with Updates, Documents, Marketplace, Concerns, or Programs."
            />
            <QuickStep
              title="3. Track activity later"
              text="Return to your dashboard, request history, or marketplace activity pages when you need follow-up details."
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="grid gap-6 md:grid-cols-2">
            {residentGuideSections.map((section) => (
              <GuideCard key={section.title} section={section} />
            ))}
          </div>

          <aside className="space-y-6">
            <div className={`rounded-3xl border p-6 shadow-sm ${municipalityVisual.theme.panelClass}`}>
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${municipalityVisual.theme.iconClass}`}>
                <MapPin className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Municipality reminder</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{municipalityVisual.spotlight}</p>
              <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${municipalityVisual.theme.chipClass}`}>
                {municipalityVisual.fact}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Package className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Helpful reminders</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Use your registered municipality for document requests and local resident actions.</li>
                <li>When you browse another municipality, treat it as view-only exploration unless the page clearly allows action.</li>
                <li>Keep screenshots, request numbers, and transaction details when you need to follow up on a request.</li>
              </ul>
              <Link
                to="/dashboard"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to dashboard
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}

function QuickStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}

function GuideCard({ section }: { section: GuideSection }) {
  const Icon = section.icon

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">{section.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
      <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
        {section.steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <Link
        to={section.href}
        className="mt-5 inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
      >
        {section.hrefLabel}
      </Link>
    </article>
  )
}
