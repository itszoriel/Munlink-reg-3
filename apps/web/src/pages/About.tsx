import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bug, ExternalLink, Mail, Phone } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ZAMBALES_MUNICIPALITY_VISUALS, getMunicipalitySeal } from '@/lib/municipalityVisuals'
import { MUNICIPALITIES } from '@/lib/locations'
import { useLang } from '@/lib/i18n'

type Pair = { en: string; fil: string }

const BARANGAY_RECORDS: Pair[] = [
  { en: 'Ordinances and resolutions (free digital copy; fee only if certified)', fil: 'Mga ordinansa at resolusyon (libreng digital na kopya; may bayad kung certified)' },
  { en: 'Barangay assembly minutes and attendance', fil: 'Katitikan at attendance ng barangay assembly' },
  { en: 'Annual and supplemental budget and fund utilization', fil: 'Taunan at supplemental na budget at paggamit ng pondo' },
  { en: 'Disaster risk reduction plan and fund usage', fil: 'Plano at pondo para sa disaster risk reduction' },
  { en: 'Project status reports', fil: 'Ulat sa estado ng mga proyekto' },
]

const MUNICIPAL_RECORDS: Pair[] = [
  { en: 'Ordinances, resolutions and appropriation measures', fil: 'Mga ordinansa, resolusyon at appropriation' },
  { en: 'Annual and supplemental budget and Annual Investment Plan', fil: 'Taunan at supplemental na budget at Annual Investment Plan' },
  { en: 'Procurement plans and bidding documents', fil: 'Mga plano sa procurement at bidding documents' },
  { en: 'Infrastructure project list and contract details', fil: 'Listahan ng proyektong imprastraktura at detalye ng kontrata' },
  { en: 'Local tax and fee schedule', fil: 'Talaan ng lokal na buwis at singil' },
]

const REPORT_TIPS: Pair[] = [
  { en: 'The steps that lead to the problem', fil: 'Ang mga hakbang bago nangyari ang problema' },
  { en: 'What you expected and what happened instead', fil: 'Ang inaasahan mo at ang talagang nangyari' },
  { en: 'The page address and the time it happened', fil: 'Ang address ng pahina at oras na nangyari' },
  { en: 'Your browser and device, for example Chrome on Android', fil: 'Ang browser at device, hal. Chrome sa Android' },
  { en: 'A screenshot, if you can', fil: 'Screenshot, kung maaari' },
]

export default function About() {
  const { t, lang } = useLang()
  const pick = (p: Pair) => (lang === 'fil' ? p.fil : p.en)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const selected = useAppStore((s) => s.selectedMunicipality)
  const setMunicipality = useAppStore((s) => s.setMunicipality)
  const navigate = useNavigate()

  const initial = ZAMBALES_MUNICIPALITY_VISUALS.find((v) => v.name === selected?.name)
    || ZAMBALES_MUNICIPALITY_VISUALS.find((v) => v.isCapital)
    || ZAMBALES_MUNICIPALITY_VISUALS[0]
  const [townSlug, setTownSlug] = useState(initial.slug)
  const town = ZAMBALES_MUNICIPALITY_VISUALS.find((v) => v.slug === townSlug) || initial

  const openTown = () => {
    const m = MUNICIPALITIES.find((x) => x.name === town.name)
    if (m) setMunicipality(m)
    navigate('/services')
  }

  const WHAT_IT_DOES = [
    { title: t('Documents and certificates', 'Mga dokumento at sertipiko'), body: t('Fees, requirements and processing time for every document, then the request itself, tracked to the claim stub.', 'Singil, mga kailangan at tagal ng bawat dokumento, at ang mismong kahilingan hanggang sa claim stub.'), to: '/services' },
    { title: t('Benefit programs', 'Mga programang tulong'), body: t('Assistance your municipality and barangay are running, who qualifies, and the application.', 'Mga tulong ng inyong munisipyo at barangay, sino ang kwalipikado, at ang aplikasyon.'), to: '/programs' },
    { title: t('Problem reports', 'Pag-uulat ng problema'), body: t('Roads, water, waste and safety reports that go to the office responsible, with its response.', 'Ulat tungkol sa kalsada, tubig, basura at kaligtasan na diretso sa opisinang may hawak, kasama ang tugon.'), to: '/problems' },
    { title: t('Community marketplace', 'Palengke ng komunidad'), body: t('Selling, lending and giving away among verified residents of the same town.', 'Pagbebenta, pagpapahiram at pamimigay sa pagitan ng mga beripikadong residente ng iisang bayan.'), to: '/marketplace' },
  ]

  return (
    <div className="bg-[#f6f7f9]">
      {/* Header: photo band with the introduction laid over its edge */}
      <section className="bg-white">
        <div className="h-[200px] overflow-hidden bg-navy-900 sm:h-[280px] lg:h-[340px]">
          <img src="/assets/about.webp" alt={t('Zambales coastline', 'Baybayin ng Zambales')} width={1600} height={900} className="h-full w-full object-cover" />
        </div>
        <div className="container-responsive relative -mt-14 pb-12 sm:-mt-24 lg:-mt-28 lg:pb-16">
          <div className="grid gap-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12 lg:p-10">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-4xl">{t('About MunLink Zambales', 'Tungkol sa MunLink Zambales')}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
                {t(
                  'An online counter for the municipal and barangay halls of Zambales. Residents use it to reach their local government without travelling to the hall; staff use it to answer them and keep track of every request.',
                  'Isang online na counter ng mga munisipyo at barangay ng Zambales. Ginagamit ito ng mga residente para makipag-ugnayan sa lokal na pamahalaan nang hindi pumupunta sa opisina; ginagamit ito ng kawani para tumugon at subaybayan ang bawat kahilingan.'
                )}
              </p>
            </div>
            <dl className="grid content-center gap-5 border-t border-slate-200 pt-6 text-sm lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div>
                <dt className="font-semibold text-slate-900">{t('Covers', 'Sakop')}</dt>
                <dd className="mt-1 text-slate-600">{t('The 13 municipalities of Zambales and their barangays. Olongapo City is not included.', 'Ang 13 munisipyo ng Zambales at ang kanilang mga barangay. Hindi kasama ang Olongapo City.')}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{t('Who sees what', 'Sino ang nakakakita')}</dt>
                <dd className="mt-1 text-slate-600">{t('Each office sees only its own residents and requests. Provincial staff see Zambales-wide reports.', 'Ang bawat opisina ay nakakakita lamang ng sarili nitong residente at kahilingan. Ang kawani ng lalawigan ay nakakakita ng ulat para sa buong Zambales.')}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">{t('Your data', 'Ang iyong datos')}</dt>
                <dd className="mt-1 text-slate-600">
                  {t('IDs stay in private storage and every view is logged, under the Data Privacy Act of 2012.', 'Nasa pribadong storage ang mga ID at naitatala ang bawat pagtingin, alinsunod sa Data Privacy Act of 2012.')}{' '}
                  <Link to="/privacy-policy" className="font-medium text-navy-700 underline">{t('Privacy policy', 'Patakaran sa privacy')}</Link>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* The 13 towns: one explorer instead of 13 identical tiles */}
      <section className="border-y border-slate-200 bg-white">
        <div className="container-responsive py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{t('The 13 towns we serve', 'Ang 13 bayang pinaglilingkuran')}</h2>
              <p className="mt-1 text-slate-600">{t('Pick a town to see it, then open its documents and fees.', 'Pumili ng bayan para makita ito, saka buksan ang mga dokumento at singil nito.')}</p>
            </div>
            <img src="/logos/provinces/zambales.png" alt={t('Seal of the Province of Zambales', 'Sagisag ng Lalawigan ng Zambales')} width={56} height={56} className="h-14 w-14 object-contain" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0" aria-label={t('Towns', 'Mga bayan')}>
              {ZAMBALES_MUNICIPALITY_VISUALS.map((v) => {
                const active = v.slug === town.slug
                return (
                  <li key={v.slug} className="flex-shrink-0">
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTownSlug(v.slug)}
                      className={`flex min-h-[44px] w-full items-center gap-2.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-left text-sm font-medium transition-colors lg:border-transparent ${
                        active ? 'border-navy-700 bg-navy-50 text-navy-900 lg:border-navy-200' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <img src={getMunicipalitySeal(v.slug)} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                      {v.name}
                      {v.isCapital && <span className="ml-auto text-xs font-normal text-slate-600">{t('Capital', 'Kabisera')}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>

            <article className="overflow-hidden rounded-lg border border-slate-200" aria-live="polite">
              <img key={town.slug} src={town.landmark} alt={t(`${town.name}, Zambales`, `${town.name}, Zambales`)} width={1200} height={750} className="aspect-[16/9] w-full bg-slate-100 object-cover" />
              <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <div className="flex items-center gap-3">
                    <img src={getMunicipalitySeal(town.slug)} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-900">{town.name}</h3>
                      {town.isCapital && <p className="text-sm text-slate-600">{t('Capital of Zambales', 'Kabisera ng Zambales')}</p>}
                    </div>
                  </div>
                  <p className="mt-4 max-w-prose text-slate-700">{town.spotlight}</p>
                  <p className="mt-2 max-w-prose text-sm text-slate-600">{town.fact}</p>
                  <a href={town.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-slate-600 underline">
                    {town.sourceLabel} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
                <button type="button" onClick={openTown} className="btn-primary whitespace-nowrap">
                  {t(`${town.name} documents and fees`, `Dokumento at singil ng ${town.name}`)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* What it is for */}
      <section className="container-responsive grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{t('What it is for', 'Para saan ito')}</h2>
          <p className="mt-4 leading-relaxed text-slate-700">
            {t(
              'Most visits to the hall are to ask what to bring, to file a request, or to check if it is ready. MunLink moves those three trips online, so the one remaining trip is to claim your document.',
              'Karamihan ng pagpunta sa opisina ay para magtanong kung ano ang dadalhin, mag-file ng kahilingan, o alamin kung handa na. Inilalagay ng MunLink online ang tatlong iyon, kaya ang natitirang biyahe ay ang pagkuha ng dokumento.'
            )}
          </p>
        </div>
        <ul className="grid gap-x-10 sm:grid-cols-2">
          {WHAT_IT_DOES.map((item) => (
            <li key={item.to} className="border-t border-slate-300 py-5">
              <Link to={item.to} className="group block">
                <span className="flex items-center justify-between gap-3 text-lg font-semibold text-slate-900 group-hover:text-navy-800">
                  {item.title}
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-navy-700" aria-hidden="true" />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-600">{item.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Public records */}
      <section className="border-y border-slate-200 bg-white">
        <div className="container-responsive py-12 sm:py-16">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{t('Public records you can ask for', 'Mga pampublikong rekord na maaari mong hingin')}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            {t('Records that municipal and barangay offices make available to residents under Philippine transparency laws.', 'Mga rekord na ibinibigay ng munisipyo at barangay sa mga residente ayon sa mga batas sa transparency.')}
          </p>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <RecordList title={t('At the barangay hall', 'Sa barangay hall')} office={t('Ask the barangay secretary or treasurer', 'Hingin sa kalihim o ingat-yaman ng barangay')} items={BARANGAY_RECORDS.map(pick)} />
            <RecordList title={t('At the municipal hall', 'Sa munisipyo')} office={t('Records office, Sangguniang Bayan, budget office', 'Records office, Sangguniang Bayan, budget office')} items={MUNICIPAL_RECORDS.map(pick)} />
          </div>
          <p className="mt-8 max-w-3xl text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{t('Legal basis:', 'Batayang legal:')}</span> 1987 Constitution (Art. III Sec. 7), RA 6713, RA 7160, DILG Full Disclosure Policy, EO 02 (Freedom of Information), RA 9184, RA 11032, {t('and the Data Privacy Act (RA 10173) for redactions.', 'at ang Data Privacy Act (RA 10173) para sa mga tinatakpang bahagi.')}
          </p>
        </div>
      </section>

      {/* Support */}
      <section className="container-responsive py-12 sm:py-16">
        <div className="grid overflow-hidden rounded-lg border border-slate-200 bg-white md:grid-cols-2">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">{t('Help with the website', 'Tulong sa website')}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {t('For problems with the site itself. Questions about a specific request, fee or schedule go to your municipal or barangay office.', 'Para sa problema sa mismong site. Ang tanong tungkol sa kahilingan, singil o iskedyul ay sa inyong munisipyo o barangay.')}
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <a href="mailto:Pauljohn.antigo@gmail.com" className="font-medium text-navy-700 underline">Pauljohn.antigo@gmail.com</a>
              </li>
              <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Phone className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <a href="tel:09764859463" className="font-medium text-navy-700 underline">0976 485 9463</a>
                <span className="text-slate-600">{t('call or text for urgent problems', 'tumawag o mag-text kung apurahan')}</span>
              </li>
            </ul>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8 md:border-l md:border-t-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Bug className="h-5 w-5 text-slate-600" aria-hidden="true" />
              {t('When you report a problem, include', 'Kapag mag-uulat ng problema, isama ang')}
            </h2>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              {REPORT_TIPS.map((tip) => <li key={tip.en}>{pick(tip)}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="bg-navy-800">
          <div className="container-responsive flex flex-col items-start gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">{t('Create your MunLink account', 'Gumawa ng MunLink account')}</h2>
              <p className="mt-1 text-navy-100">{t('Free for residents of Zambales. You need it only to send a request.', 'Libre para sa mga residente ng Zambales. Kailangan lamang ito para magpadala ng kahilingan.')}</p>
            </div>
            <Link to="/register" className="btn bg-white text-navy-800 hover:bg-navy-50">
              {t('Register', 'Magparehistro')}
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
    <div className="border-t-2 border-navy-700 pt-5">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{office}</p>
      <ul className="mt-4 divide-y divide-slate-200 text-sm text-slate-700">
        {items.map((item) => <li key={item} className="py-2.5">{item}</li>)}
      </ul>
    </div>
  )
}
