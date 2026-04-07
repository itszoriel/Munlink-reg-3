import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  FileText,
  Gift,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Users,
} from 'lucide-react'

type Variant = 'municipal' | 'provincial' | 'barangay'

type GuideSection = {
  title: string
  description: string
  icon: typeof LayoutDashboard
  steps: string[]
  href: string
  hrefLabel: string
}

const sectionMap: Record<Variant, GuideSection[]> = {
  municipal: [
    {
      title: 'Start at the dashboard',
      description: 'Use the dashboard to check current workload and jump into the most urgent area first.',
      icon: LayoutDashboard,
      steps: [
        'Review the summary cards for verifications, concerns, marketplace activity, announcements, and programs.',
        'Open the pending verification area if you need to approve or reject resident accounts.',
        'Use the quick guide any time you need a refresher on where a task belongs.',
      ],
      href: '/dashboard',
      hrefLabel: 'Open dashboard',
    },
    {
      title: 'Manage residents',
      description: 'Resident management is where account review and related checks begin.',
      icon: Users,
      steps: [
        'Open Residents to review pending registrations and resident details.',
        'Use the resident modal when you need to inspect information before taking action.',
        'Return here when you need to review municipality-level resident records again.',
      ],
      href: '/residents',
      hrefLabel: 'Open residents',
    },
    {
      title: 'Process requests',
      description: 'Use Requests to review document submissions and move them through the correct next step.',
      icon: FileText,
      steps: [
        'Filter by request status to focus on the queue that needs action.',
        'Review payment, supporting files, and request details before changing status.',
        'Use the request actions for approval, rejection, ready-for-pickup, and related processing tasks.',
      ],
      href: '/requests',
      hrefLabel: 'Open requests',
    },
    {
      title: 'Post announcements',
      description: 'Announcements let you publish updates for your allowed scope using the admin portal.',
      icon: Megaphone,
      steps: [
        'Open Announcements to create, edit, publish, or archive updates.',
        'Review the scope carefully before saving.',
        'Use the edit modal to update content, images, and timing details.',
      ],
      href: '/announcements',
      hrefLabel: 'Open announcements',
    },
    {
      title: 'Handle concerns and programs',
      description: 'Community concerns and programs each have their own management pages.',
      icon: AlertTriangle,
      steps: [
        'Open Community Concerns when you need to update issue status or review reports.',
        'Open Programs to review program records and applications.',
        'Use these pages when your dashboard cards or recent activity point to follow-up work.',
      ],
      href: '/problems',
      hrefLabel: 'Open concerns',
    },
    {
      title: 'Check reports and your account',
      description: 'Use reports for oversight and profile for your own account details.',
      icon: BarChart3,
      steps: [
        'Open Reports when you need summaries, exports, or high-level tracking.',
        'Open Profile to review your admin account details.',
        'Use only the pages that match your role and current assignment.',
      ],
      href: '/reports',
      hrefLabel: 'Open reports',
    },
  ],
  provincial: [
    {
      title: 'Start at the provincial dashboard',
      description: 'Your dashboard shows province-wide announcement reach and high-level stats.',
      icon: LayoutDashboard,
      steps: [
        'Review the announcement totals first.',
        'Use the stat cards to jump into the provincial announcement workflow.',
        'Return to the dashboard when you need a quick province-wide overview.',
      ],
      href: '/provincial/dashboard',
      hrefLabel: 'Open dashboard',
    },
    {
      title: 'Manage provincial announcements',
      description: 'Provincial admins focus on announcements that apply across Zambales.',
      icon: Megaphone,
      steps: [
        'Open Announcements to create or update province-wide notices.',
        'Use the editor when you need to adjust content, timing, images, or status.',
        'Keep announcement scope aligned with provincial responsibilities.',
      ],
      href: '/provincial/announcements',
      hrefLabel: 'Open announcements',
    },
    {
      title: 'Use reports and oversight pages',
      description: 'Reports help you monitor province-level communication and activity.',
      icon: BarChart3,
      steps: [
        'Open Reports for summary views and oversight information.',
        'Use the dashboard and reports together when checking overall provincial reach.',
        'Keep profile/account actions in the account menu at the top of the screen.',
      ],
      href: '/provincial/reports',
      hrefLabel: 'Open reports',
    },
  ],
  barangay: [
    {
      title: 'Start at the barangay dashboard',
      description: 'The dashboard gives you a local overview of your barangay activity.',
      icon: LayoutDashboard,
      steps: [
        'Review the announcement stats first.',
        'Use the quick guide when you need a reminder of your role limits.',
        'Return here for a simple snapshot of current barangay-level activity.',
      ],
      href: '/barangay/dashboard',
      hrefLabel: 'Open dashboard',
    },
    {
      title: 'Manage barangay announcements',
      description: 'Barangay admins handle updates that stay within their barangay scope.',
      icon: Megaphone,
      steps: [
        'Open Announcements to create or update barangay-level posts.',
        'Check scope and details carefully before publishing.',
        'Use the editor for content, images, and schedule changes.',
      ],
      href: '/barangay/announcements',
      hrefLabel: 'Open announcements',
    },
    {
      title: 'Review barangay programs and reports',
      description: 'Programs and reports are the other main working areas in the barangay portal.',
      icon: Gift,
      steps: [
        'Open Programs to review local program information.',
        'Open Reports when you need summary information for your barangay portal.',
        'Use the account menu for profile and basic account actions.',
      ],
      href: '/barangay/programs',
      hrefLabel: 'Open programs',
    },
  ],
}

const quickStepMap: Record<Variant, string[]> = {
  municipal: [
    'Review dashboard counts first.',
    'Open the page that matches the task: residents, requests, announcements, concerns, programs, or reports.',
    'Use your profile menu for account basics and this guide page whenever you need a reset.',
  ],
  provincial: [
    'Start from the provincial dashboard.',
    'Use announcements for province-wide communications.',
    'Use reports when you need oversight or summaries.',
  ],
  barangay: [
    'Start from the barangay dashboard.',
    'Use announcements and programs for day-to-day local work.',
    'Use reports for overview and your profile menu for account basics.',
  ],
}

const roleTitles: Record<Variant, string> = {
  municipal: 'How to use the admin portal',
  provincial: 'How to use the provincial portal',
  barangay: 'How to use the barangay portal',
}

const roleDescriptions: Record<Variant, string> = {
  municipal: 'This guide covers the real screens available to municipal admins in the current frontend.',
  provincial: 'This guide covers the current provincial admin screens exposed in the frontend.',
  barangay: 'This guide covers the current barangay admin screens exposed in the frontend.',
}

const roleNotes: Record<Variant, string> = {
  municipal: 'Municipal admins work within their assigned municipality and do not gain edit control over items outside that scope.',
  provincial: 'Provincial admins focus on province-level screens and province-wide announcements.',
  barangay: 'Barangay admins stay within barangay-level responsibilities and pages.',
}

export default function AdminGuideContent({ variant }: { variant: Variant }) {
  const sections = sectionMap[variant]
  const quickSteps = quickStepMap[variant]

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              <BookOpen className="h-3.5 w-3.5" />
              Admin guide
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {roleTitles[variant]}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600 md:text-lg">{roleDescriptions[variant]}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4" />
              Scope reminder
            </div>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">{roleNotes[variant]}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {quickSteps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {index + 1}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {sections.map((section) => (
          <GuideCard key={section.title} section={section} />
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">What to remember</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li>Use the dashboard first, then open the page that matches the task you need to finish.</li>
          <li>Keep announcements, requests, residents, and reports in their own pages instead of trying to manage everything from one screen.</li>
          <li>If you are unsure where a task belongs, return to this guide instead of guessing inside the portal.</li>
        </ul>
      </section>
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
