import { Link } from 'react-router-dom'
import { announcementsApi, marketplaceApi, mediaUrl } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { useCachedFetch } from '@/lib/useCachedFetch'
import { CACHE_KEYS } from '@/lib/dataStore'
import { ArrowRight, Bell, HandHeart, Megaphone, MessageSquareWarning, Package, ShieldCheck, ShoppingBag } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import CitizensCharter, { useCharterSearch } from '@/components/CitizensCharter'
import { MUNICIPALITIES } from '@/lib/locations'
import { getMunicipalitySeal, getMunicipalityVisual } from '@/lib/municipalityVisuals'
import RequestTimeline from '@/components/RequestTimeline'
import { useLang } from '@/lib/i18n'

export default function HomePage() {
  const { t } = useLang()
  const setMunicipality = useAppStore((s) => s.setMunicipality)
  const setCharterQuery = useCharterSearch((s) => s.setQ)
  const selectedMunicipality = useAppStore((s) => s.selectedMunicipality)
  const selectedBarangay = useAppStore((s) => s.selectedBarangay)
  const user = useAppStore((s) => s.user)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  const userMunicipalityId = (user as any)?.municipality_id
  const userBarangayId = (user as any)?.barangay_id
  const verifiedResident = isAuthenticated && (user as any)?.admin_verified && (user as any)?.role === 'resident'
  const browseMunicipalityId = selectedMunicipality?.id
  const browseBarangayId = selectedBarangay?.id
  const effectiveMunicipalityId = verifiedResident ? userMunicipalityId : browseMunicipalityId
  const announcementDetailQuery = (() => {
    const qp = new URLSearchParams()
    if (browseMunicipalityId) {
      qp.set('municipality_id', String(browseMunicipalityId))
      qp.set('browse', 'true')
    }
    if (browseBarangayId) qp.set('barangay_id', String(browseBarangayId))
    const qs = qp.toString()
    return qs ? `?${qs}` : ''
  })()

  // Home feeds are public; the backend enforces visibility rules.
  const { data: announcementsData, loading: announcementsLoading } = useCachedFetch(
    CACHE_KEYS.HOME_ANNOUNCEMENTS,
    () => announcementsApi.getAll({
      active: true,
      page: 1,
      per_page: 4,
      ...(browseMunicipalityId ? { municipality_id: browseMunicipalityId, browse: true } : {}),
      ...(browseBarangayId ? { barangay_id: browseBarangayId } : {}),
    }),
    {
      dependencies: ['home_announcements_fetch_fix_v2', browseMunicipalityId, browseBarangayId, userMunicipalityId, userBarangayId, verifiedResident],
      staleTime: 3 * 60 * 1000,
    }
  )

  const { data: marketplaceData, loading: marketplaceLoading } = useCachedFetch(
    CACHE_KEYS.HOME_MARKETPLACE,
    () => marketplaceApi.getItems({ status: 'available', page: 1, per_page: 4, municipality_id: effectiveMunicipalityId }),
    { dependencies: [effectiveMunicipalityId], staleTime: 3 * 60 * 1000 }
  )

  const recentAnnouncements = (announcementsData as any)?.data?.announcements || []
  const featuredItems = (marketplaceData as any)?.data?.items || []
  const areaName = selectedMunicipality?.name || 'Zambales'

  const OTHER_SERVICES = [
    {
      icon: HandHeart,
      title: t('Benefit programs', 'Mga programang tulong'),
      description: t('Assistance open in your town, who qualifies and how to apply.', 'Mga tulong na bukas sa iyong bayan, sino ang kwalipikado at paano mag-apply.'),
      to: '/programs',
    },
    {
      icon: MessageSquareWarning,
      title: t('Report a problem', 'Mag-ulat ng problema'),
      description: t('Roads, water, waste or safety. Follow the response online.', 'Kalsada, tubig, basura o kaligtasan. Subaybayan ang tugon online.'),
      to: '/problems',
    },
    {
      icon: ShoppingBag,
      title: t('Community marketplace', 'Palengke ng komunidad'),
      description: t('Sell, lend or give away items to verified neighbours.', 'Magbenta, magpahiram o mamigay sa mga beripikadong kapitbahay.'),
      to: '/marketplace',
    },
    {
      icon: Megaphone,
      title: t('Announcements', 'Mga anunsyo'),
      description: t('Official notices from the province, your town and your barangay.', 'Opisyal na abiso mula sa lalawigan, bayan at barangay.'),
      to: '/announcements',
    },
  ]

  // Common requests at the hall; each one filters the charter below.
  const POPULAR = [
    { label: t('Barangay clearance', 'Barangay clearance'), q: 'clearance' },
    { label: 'Cedula', q: 'cedula' },
    { label: t('Certificate of indigency', 'Certificate of indigency'), q: 'indigency' },
    { label: t('Business permit', 'Business permit'), q: 'business' },
    { label: t('Certificate of residency', 'Certificate of residency'), q: 'residen' },
  ]

  const goToCharter = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    document.getElementById('documents')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const hallVisual = getMunicipalityVisual({ municipalityName: selectedMunicipality?.name || 'Iba', municipalitySlug: selectedMunicipality?.slug || 'iba' })

  return (
    <div className="bg-[#f6f7f9]">
      {/* Hero: the coast as a wide band, the service counter laid over its edge */}
      <section className="bg-white">
        <div className="h-[220px] overflow-hidden bg-navy-900 sm:h-[340px] lg:h-[460px]">
          <img
            src="/assets/hero.webp"
            alt={t('Bangka boats on the Zambales coast', 'Mga bangka sa baybayin ng Zambales')}
            width={1600}
            height={900}
            className="h-full w-full object-cover object-[center_62%]"
          />
        </div>
        <div className="container-responsive relative -mt-16 pb-12 sm:-mt-24 lg:-mt-28 lg:pb-16">
          <div className="grid gap-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12 lg:p-10">
            <div className="flex flex-col justify-center">
              <h1 className="text-[2rem] font-semibold leading-[1.12] tracking-[-0.02em] text-slate-900 sm:text-4xl lg:text-[2.75rem]" style={{ textWrap: 'balance' } as any}>
                {t('Barangay and municipal documents, without the long line', 'Dokumento mula sa barangay at munisipyo, nang hindi pumipila')}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {t(
                  'See the fee and requirements first, send your request online, and claim it when it is ready. For residents of the 13 municipalities of Zambales.',
                  'Alamin muna ang singil at mga kailangan, ipadala ang kahilingan online, at kunin kapag handa na. Para sa mga residente ng 13 bayan ng Zambales.'
                )}
              </p>
              <p className="mt-6 flex items-start gap-2 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" aria-hidden="true" />
                {t('Run with the municipal and barangay offices of Zambales. Your ID is seen only by your own municipality.', 'Kasama ang mga munisipyo at barangay ng Zambales. Ang iyong munisipyo lamang ang makakakita ng iyong ID.')}
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <label htmlFor="hero-town" className="block text-sm font-semibold text-slate-900">
                {t('Your town', 'Ang iyong bayan')}
              </label>
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={getMunicipalitySeal(selectedMunicipality?.slug)}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 flex-shrink-0 object-contain"
                />
                <select
                  id="hero-town"
                  className="input-field min-h-[44px]"
                  value={selectedMunicipality?.id || ''}
                  onChange={(e) => {
                    const m = MUNICIPALITIES.find((x) => String(x.id) === e.target.value)
                    setMunicipality(m)
                  }}
                >
                  <option value="">{t('Choose town', 'Pumili ng bayan')}</option>
                  {MUNICIPALITIES.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-900">{t('Most requested', 'Madalas hilingin')}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {POPULAR.map((item) => (
                  <li key={item.q}>
                    <button
                      type="button"
                      onClick={() => { setCharterQuery(item.q); goToCharter() }}
                      className="min-h-[40px] rounded-full border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-800 transition-colors hover:border-navy-600 hover:text-navy-800"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>

              <button type="button" onClick={() => { setCharterQuery(''); goToCharter() }} className="btn-primary mt-6 w-full">
                {t('See all fees and requirements', 'Tingnan lahat ng singil at kailangan')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="mt-3 text-center text-sm text-slate-600">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="font-medium text-navy-700 underline">{t('Go to your dashboard', 'Pumunta sa dashboard')}</Link>
                ) : (
                  <>
                    {t('No account needed to look. ', 'Hindi kailangan ng account para tumingin. ')}
                    <Link to="/register" className="font-medium text-navy-700 underline">{t('Register', 'Magparehistro')}</Link>
                    {t(' to send a request.', ' para magpadala ng kahilingan.')}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Citizen's Charter */}
      <section id="documents" className="scroll-mt-20 border-y border-slate-200 bg-white">
        <div className="container-responsive py-12 sm:py-16">
          <CitizensCharter />
        </div>
      </section>

      {/* From request to release */}
      <section className="border-b border-slate-200">
        <div className="container-responsive grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{t('From request to release', 'Mula kahilingan hanggang pagkuha')}</h2>
            <ol className="mt-6 space-y-5">
              {[
                [t('Register and verify once', 'Magparehistro at magpa-verify nang isang beses'), t('Your name, address and one valid ID. Staff of your own municipality check it.', 'Pangalan, tirahan at isang valid ID. Susuriin ito ng kawani ng iyong munisipyo.')],
                [t('Send your request', 'Ipadala ang kahilingan'), t('Choose the document and its purpose. You see the fee before you send.', 'Piliin ang dokumento at layunin. Makikita mo ang singil bago magpadala.')],
                [t('Follow its progress', 'Subaybayan ang takbo'), t('Each step is shown here and sent to your email or phone.', 'Makikita rito ang bawat hakbang at ipapadala sa email o telepono mo.')],
                [t('Claim it with your stub', 'Kunin gamit ang claim stub'), t('Show the QR code at the hall, or download the digital copy.', 'Ipakita ang QR code sa opisina, o i-download ang digital na kopya.')],
              ].map(([title, body]) => (
                <li key={title}>
                  <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 flex items-start gap-3 text-sm text-slate-700">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                {t(
                  'IDs and selfies are kept in private storage. Only authorized staff of your own municipality can view them, and every view is logged, in line with the Data Privacy Act of 2012.',
                  'Nakatago sa pribadong storage ang mga ID at selfie. Ang awtorisadong kawani lamang ng iyong munisipyo ang makakakita nito, at naitatala ang bawat pagtingin, alinsunod sa Data Privacy Act of 2012.'
                )}{' '}
                <Link to="/privacy-policy" className="font-medium text-navy-700 underline">{t('Privacy policy', 'Patakaran sa privacy')}</Link>
              </span>
            </p>
          </div>
          <SampleClaimStub />
        </div>
      </section>

      {/* More from the hall: a real town photo beside a list of the other online services */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-responsive grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch lg:gap-14">
          <figure className="relative overflow-hidden rounded-lg bg-slate-100">
            <img
              src={hallVisual.landmark}
              alt={t(`${hallVisual.name}, Zambales`, `${hallVisual.name}, Zambales`)}
              loading="lazy"
              width={1200}
              height={800}
              className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-navy-950/85 px-4 py-3 text-sm text-white">
              {hallVisual.name}, Zambales
            </figcaption>
          </figure>
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {t('More from your municipal hall', 'Iba pa mula sa inyong munisipyo')}
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">
              {t('Your municipal and barangay offices also run these online, with the same account.', 'Ito rin ay online mula sa inyong munisipyo at barangay, gamit ang parehong account.')}
            </p>
            <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {OTHER_SERVICES.map(({ icon: Icon, title, description, to }) => (
                <li key={to}>
                  <Link to={to} className="group -mx-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-md px-3 py-5 transition-colors hover:bg-slate-50">
                    <Icon className="h-6 w-6 text-navy-700" aria-hidden="true" />
                    <span>
                      <span className="block text-lg font-semibold text-slate-900">{title}</span>
                      <span className="mt-0.5 block text-sm text-slate-600">{description}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-navy-700" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Announcements and marketplace */}
      <section>
        <div className="container-responsive grid gap-10 py-12 sm:py-16 lg:grid-cols-2">
          <div>
            <SectionHeading title={t(`Announcements in ${areaName}`, `Mga anunsyo sa ${areaName}`)} linkTo="/announcements" linkLabel={t('All announcements', 'Lahat ng anunsyo')} />
            {announcementsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton-card h-20" />)}</div>
            ) : recentAnnouncements.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
                {t(
                  `${areaName} has no active announcements right now. Official notices from the province, your municipality and barangay appear here.`,
                  `Walang aktibong anunsyo ang ${areaName} sa ngayon. Dito lumalabas ang opisyal na abiso ng lalawigan, munisipyo at barangay.`
                )}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                {recentAnnouncements.slice(0, 4).map((a: any) => (
                  <AnnouncementRow key={a.id} announcement={a} detailQuery={announcementDetailQuery} />
                ))}
              </ul>
            )}
          </div>

          <div>
            <SectionHeading title={t('From the marketplace', 'Mula sa palengke')} linkTo="/marketplace" linkLabel={t('Browse marketplace', 'Tingnan ang palengke')} />
            {marketplaceLoading ? (
              <div className="grid grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-card h-56" />)}</div>
            ) : featuredItems.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
                {t(
                  'No items posted yet. Verified residents can sell, lend or give away items to neighbours in their town.',
                  'Wala pang nakapost. Maaaring magbenta, magpahiram o mamigay ang mga beripikadong residente sa kanilang bayan.'
                )}
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-4">
                {featuredItems.slice(0, 4).map((it: any) => (
                  <MarketplaceTile key={it.id} item={it} fallbackMunicipality={selectedMunicipality?.name} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

/** An illustration of the claim stub residents receive, clearly marked as a sample. */
function SampleClaimStub() {
  const { t } = useLang()
  return (
    <figure aria-label={t('Sample claim stub', 'Halimbawa ng claim stub')}>
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className="flex items-center justify-between bg-navy-800 px-4 py-2.5 text-sm text-white">
          <span className="font-semibold">{t('Claim stub', 'Claim stub')}</span>
          <span className="rounded border border-white/50 px-1.5 text-xs">{t('Sample', 'Halimbawa')}</span>
        </div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 p-4">
          <svg viewBox="0 0 21 21" className="h-24 w-24 text-slate-900" aria-hidden="true" shapeRendering="crispEdges">
            {QR_CELLS.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />)}
          </svg>
          <dl className="grid content-start gap-2 text-sm">
            <div>
              <dt className="text-xs text-slate-600">{t('Document', 'Dokumento')}</dt>
              <dd className="font-semibold text-slate-900">Barangay Clearance</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-600">{t('Claim at', 'Kunin sa')}</dt>
              <dd className="font-medium text-slate-900">{t('Your barangay hall, Mon–Fri 8:00–5:00', 'Barangay hall, Lun–Biy 8:00–5:00')}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-600">{t('Bring', 'Dalhin')}</dt>
              <dd className="font-medium text-slate-900">{t('Valid ID and the fee', 'Valid ID at ang singil')}</dd>
            </div>
          </dl>
        </div>
        <div className="border-t border-dashed border-slate-300 px-4 py-4">
          <RequestTimeline status="ready_for_pickup" compact />
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-slate-600">
        {t('Every request ends with a stub like this, on your phone or printed.', 'Bawat kahilingan ay may ganitong stub, sa telepono o naka-print.')}
      </figcaption>
    </figure>
  )
}

// A fixed decorative QR-like pattern (finder squares plus a few modules); it encodes nothing.
const QR_CELLS: Array<[number, number]> = (() => {
  const cells: Array<[number, number]> = []
  const finder = (ox: number, oy: number) => {
    for (let x = 0; x < 7; x++) for (let y = 0; y < 7; y++) {
      const edge = x === 0 || y === 0 || x === 6 || y === 6
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
      if (edge || core) cells.push([ox + x, oy + y])
    }
  }
  finder(0, 0); finder(14, 0); finder(0, 14)
  for (let x = 8; x < 21; x++) for (let y = 8; y < 21; y++) if ((x * 7 + y * 3) % 5 < 2) cells.push([x, y])
  for (let i = 8; i < 13; i += 2) { cells.push([i, 6]); cells.push([6, i]) }
  return cells
})()

function SectionHeading({ title, linkTo, linkLabel }: { title: string; linkTo: string; linkLabel: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <Link to={linkTo} className="whitespace-nowrap text-sm font-medium text-navy-700 hover:underline">{linkLabel}</Link>
    </div>
  )
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function AnnouncementRow({ announcement, detailQuery }: { announcement: any; detailQuery?: string }) {
  const { t } = useLang()
  const urgent = announcement.priority?.toLowerCase() === 'high'
  return (
    <li>
      <Link to={`/announcements/${announcement.id}${detailQuery || ''}`} className="flex items-start gap-4 p-4 transition-colors hover:bg-slate-50">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
          {announcement.images?.[0] ? (
            <SafeImage src={mediaUrl(announcement.images[0])} alt="" className="h-full w-full object-cover" fallbackIcon="image" />
          ) : (
            <Bell className="h-5 w-5 text-slate-500" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {urgent && <span className="pill pill-error mb-1">{t('Urgent', 'Mahalaga')}</span>}
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{announcement.title}</h3>
          <p className="mt-0.5 text-xs text-slate-600">{formatDate(announcement.created_at)}</p>
        </div>
      </Link>
    </li>
  )
}

function MarketplaceTile({ item, fallbackMunicipality }: { item: any; fallbackMunicipality?: string }) {
  const { t } = useLang()
  const price = item.transaction_type === 'sell' && item.price
    ? `₱${Number(item.price).toLocaleString()}`
    : item.transaction_type === 'lend' ? t('For lending', 'Pahiram') : t('Free', 'Libre')
  return (
    <li>
      <Link to={`/marketplace/${item.id}`} className="block overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-navy-300">
        <div className="aspect-[4/3] bg-slate-100">
          {item.images?.[0] ? (
            <SafeImage src={mediaUrl(item.images[0])} alt={item.title} className="h-full w-full object-cover" fallbackIcon="image" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-slate-400" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</h3>
          <p className="text-xs text-slate-600">{item.municipality_name || fallbackMunicipality || 'Zambales'}</p>
          <p className="mt-1 text-sm font-semibold text-navy-700">{price}</p>
        </div>
      </Link>
    </li>
  )
}
