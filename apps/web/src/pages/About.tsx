import { Link } from 'react-router-dom'
import { Building, Users, HandHeart, ShieldCheck, Mail, Phone, Bug, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ZAMBALES_MUNICIPALITY_VISUALS } from '@/lib/municipalityVisuals'

const FEATURES = [
  {
    icon: Building,
    title: 'Municipal services',
    description: 'Request documents, permits and certificates online, with QR verification and status tracking.',
  },
  {
    icon: Users,
    title: 'Community marketplace',
    description: 'Sell, lend or give away items to verified residents of your own municipality.',
  },
  {
    icon: HandHeart,
    title: 'Benefit programs',
    description: 'Find municipal assistance programs, check eligibility and apply online.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy and security',
    description: 'IDs are kept in private storage, staff access is limited to their own area, and sensitive actions are logged.',
  },
]

const BARANGAY_RECORDS = [
  'Ordinances and resolutions (free digital copy; fee only if certified)',
  'Barangay assembly minutes and attendance',
  'Annual and supplemental budget and fund utilization',
  'Disaster risk reduction plan and fund usage',
  'Project status reports',
]

const MUNICIPAL_RECORDS = [
  'Ordinances, resolutions and appropriation measures',
  'Annual and supplemental budget and Annual Investment Plan',
  'Procurement plans and bidding documents',
  'Infrastructure project list and contract details',
  'Local tax and fee schedule',
]

const REPORT_TIPS = [
  'The steps that lead to the problem',
  'What you expected and what happened instead',
  'The page address and the time it happened',
  'Your browser and device, for example Chrome on Android',
  'A screenshot, if you can',
]

export default function About() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  return (
    <div className="bg-[#f6f7f9]">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-responsive py-12 sm:py-16">
          <p className="text-sm font-medium uppercase tracking-wider text-navy-700">About</p>
          <h1 className="mt-2 max-w-3xl text-3xl sm:text-4xl font-semibold text-slate-900">
            MunLink Zambales
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
            An online service platform for the 13 municipalities of Zambales and their barangays. Residents use it to
            reach their local government; municipal and barangay staff use it to serve them.
          </p>
        </div>
      </section>

      <section className="container-responsive grid gap-10 py-12 sm:py-16 lg:grid-cols-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Our purpose</h2>
        </div>
        <div className="space-y-4 text-slate-700 leading-relaxed lg:col-span-2">
          <p>
            MunLink brings common municipal and barangay transactions online so residents spend less time travelling
            and waiting at the hall, and local offices can track requests in one place.
          </p>
          <p>
            Each municipality and barangay sees and manages only its own residents and requests. Provincial staff can
            see across Zambales for reporting.
          </p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="container-responsive py-12 sm:py-16">
          <h2 className="text-2xl font-semibold text-slate-900">What the platform does</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-responsive py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Municipalities served</h2>
            <p className="mt-1 text-slate-600">All 13 municipalities of Zambales. The capital is Iba.</p>
          </div>
          <img src="/logos/provinces/zambales.png" alt="Seal of the Province of Zambales" className="h-14 w-14 object-contain" />
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ZAMBALES_MUNICIPALITY_VISUALS.map((mun) => (
            <li key={mun.slug} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img
                src={mun.landmark}
                alt=""
                className="aspect-[3/2] w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.src = `/logos/municipalities/${mun.slug}.png` }}
              />
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="text-sm font-semibold text-slate-900">{mun.name}</span>
                {mun.isCapital && <span className="pill pill-ocean">Capital</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="container-responsive py-12 sm:py-16">
          <h2 className="text-2xl font-semibold text-slate-900">Public records you can request</h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Records that municipal and barangay offices make available to residents under Philippine transparency laws.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <RecordList title="Barangay records" office="Barangay secretary or treasurer" items={BARANGAY_RECORDS} />
            <RecordList title="Municipal records" office="Records office, Sangguniang Bayan, budget office" items={MUNICIPAL_RECORDS} />
          </div>
          <p className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <strong className="font-semibold text-slate-900">Legal basis:</strong> 1987 Constitution (Art. III Sec. 7), RA 6713,
            RA 7160, DILG Full Disclosure Policy, EO 02 (Freedom of Information), RA 9184, RA 11032, and the Data Privacy Act
            (RA 10173) for redactions.
          </p>
        </div>
      </section>

      <section className="container-responsive grid gap-6 py-12 sm:py-16 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Mail className="h-5 w-5 text-navy-700" aria-hidden="true" />
            Contact
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <dt className="sr-only">Email</dt>
              <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <dd><a href="mailto:Pauljohn.antigo@gmail.com" className="text-navy-700 hover:underline">Pauljohn.antigo@gmail.com</a></dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="sr-only">Phone</dt>
              <Phone className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <dd><a href="tel:09764859463" className="text-navy-700 hover:underline">0976 485 9463</a></dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-slate-600">For urgent problems, call or text for the fastest response.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Bug className="h-5 w-5 text-navy-700" aria-hidden="true" />
            Reporting a problem with the site
          </h2>
          <p className="mt-4 text-sm text-slate-700">Please include:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            {REPORT_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="bg-navy-800">
          <div className="container-responsive flex flex-col items-start gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Create your MunLink account</h2>
              <p className="mt-1 text-navy-100">Registration is free for residents of Zambales.</p>
            </div>
            <Link to="/register" className="btn bg-white text-navy-800 hover:bg-navy-50">
              Register
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

function RecordList({ title, office, items }: { title: string; office: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{office}</p>
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}
