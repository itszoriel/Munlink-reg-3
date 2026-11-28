import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, RefreshCw, Search, X } from 'lucide-react'
import { create } from 'zustand'
import { documentsApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { getBarangaysByMunicipalityId } from '@/lib/locations'
import { getMunicipalitySeal, getMunicipalityVisual } from '@/lib/municipalityVisuals'
import { formatPeso, useLang } from '@/lib/i18n'
import TownPicker from './TownPicker'

export type DocType = {
  id: number
  name: string
  description?: string | null
  authority_level: 'barangay' | 'municipal' | string
  requirements?: Array<string | { name?: string; label?: string }> | null
  fee: number
  fee_confirmed?: boolean
  fee_tiers?: Record<string, number> | null
  exemption_rules?: Record<string, unknown> | null
  processing_days?: number | null
  supports_physical?: boolean
  supports_digital?: boolean
}

const cache = new Map<string, DocType[]>()

/** Search text for the charter, shared so the home hero's shortcuts can set it. */
export const useCharterSearch = create<{ q: string; setQ: (q: string) => void }>((set) => ({
  q: '',
  setQ: (q) => set({ q }),
}))

function matches(d: DocType, q: string) {
  if (!q) return true
  const needle = q.toLowerCase()
  return `${d.name} ${d.description || ''}`.toLowerCase().includes(needle)
}

function requirementText(r: string | { name?: string; label?: string }) {
  return typeof r === 'string' ? r : (r?.label || r?.name || '')
}

/**
 * The Citizen's Charter: every document a town and barangay issue online, with fee,
 * processing time, what to bring and how it is released. Public, no login needed.
 */
export default function CitizensCharter({ headingLevel = 'h2' }: { headingLevel?: 'h1' | 'h2' }) {
  const { t, lang } = useLang()
  const town = useAppStore((s) => s.selectedMunicipality)
  const barangay = useAppStore((s) => s.selectedBarangay)
  const setMunicipality = useAppStore((s) => s.setMunicipality)
  const setBarangay = useAppStore((s) => s.setBarangay)
  const user = useAppStore((s) => s.user) as any
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const verified = isAuthenticated && user?.admin_verified

  const [types, setTypes] = useState<DocType[] | null>(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const q = useCharterSearch((s) => s.q)
  const setQ = useCharterSearch((s) => s.setQ)

  const barangays = useMemo(() => (town ? getBarangaysByMunicipalityId(town.id) : []), [town])
  const key = town ? `${town.id}:${barangay?.id || ''}` : ''

  useEffect(() => {
    if (!town) return
    let alive = true
    const cached = cache.get(key)
    if (cached) { setTypes(cached); setError(false); return }
    setTypes(null)
    setError(false)
    documentsApi.getTypes({ municipality_id: town.id, ...(barangay ? { barangay_id: barangay.id } : {}) })
      .then((res) => {
        const list: DocType[] = (res as any)?.data?.types || []
        cache.set(key, list)
        if (alive) setTypes(list)
      })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [key, town, barangay, reload])

  const Heading = headingLevel
  const SubHeading = headingLevel === 'h1' ? 'h2' : 'h3'
  const ItemHeading = headingLevel === 'h1' ? 'h3' : 'h4'

  if (!town) {
    return (
      <div>
        <Heading className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {t('Documents you can request online', 'Mga dokumentong maaaring hilingin online')}
        </Heading>
        <p className="mt-2 max-w-2xl text-slate-600">
          {t(
            'See the fee, processing time and requirements before you go. Pick your town to start.',
            'Alamin ang singil, tagal ng pagproseso at mga kailangan bago ka pumunta. Piliin ang iyong bayan para magsimula.'
          )}
        </p>
        <div className="mt-6">
          <TownPicker headingLevel={SubHeading as 'h2' | 'h3'} heading={t('Your town', 'Ang iyong bayan')} description="" />
        </div>
      </div>
    )
  }

  const visual = getMunicipalityVisual({ municipalityName: town.name, municipalitySlug: town.slug })
  const shown = (types || []).filter((d) => matches(d, q.trim()))
  const barangayDocs = shown.filter((d) => d.authority_level === 'barangay')
  const municipalDocs = shown.filter((d) => d.authority_level !== 'barangay')
  const anyProvisional = (types || []).some((d) => !d.fee_confirmed)

  return (
    <div>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <img src={getMunicipalitySeal(town.slug)} alt={t(`Seal of ${town.name}`, `Sagisag ng ${town.name}`)} width={64} height={64} className="h-16 w-16 flex-shrink-0 object-contain" />
          <div>
            <Heading className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {t(`Documents from ${town.name}`, `Mga dokumento mula sa ${town.name}`)}
            </Heading>
            <p className="mt-1 text-sm text-slate-600">
              {t("Citizen's Charter: fees, processing time and requirements", 'Citizen\'s Charter: singil, tagal at mga kailangan')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="charter-barangay">{t('Barangay', 'Barangay')}</label>
          <select
            id="charter-barangay"
            className="input-field min-h-[44px] w-auto max-w-[16rem] py-2"
            value={barangay?.id || ''}
            onChange={(e) => {
              const b = barangays.find((x) => String(x.id) === e.target.value)
              setBarangay(b as any)
            }}
          >
            <option value="">{t('Choose your barangay', 'Piliin ang barangay')}</option>
            {barangays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button type="button" className="btn-secondary min-h-[44px]" onClick={() => setMunicipality(undefined)}>
            {t('Change town', 'Palitan ang bayan')}
          </button>
        </div>
      </div>

      {anyProvisional && (
        <div className="mt-6 flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="note">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" aria-hidden="true" />
          <p>
            <strong className="font-semibold">{t('Fees are provisional.', 'Pansamantala ang mga singil.')}</strong>{' '}
            {t(
              'Amounts marked "provisional" follow standard rates and are still being confirmed by the issuing office. The amount you pay is the one your office confirms when it processes your request.',
              'Ang mga halagang may markang "pansamantala" ay batay sa karaniwang singil at kinukumpirma pa ng opisinang naglalabas nito. Ang babayaran mo ay ang halagang kukumpirmahin ng opisina sa pagproseso ng iyong kahilingan.'
            )}
          </p>
        </div>
      )}

      <div className="relative mt-6 max-w-md">
        <label htmlFor="charter-search" className="sr-only">{t('Search documents', 'Maghanap ng dokumento')}</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          id="charter-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('Search, e.g. clearance, cedula, permit', 'Hanapin, hal. clearance, cedula, permit')}
          className="input-field min-h-[44px] w-full pl-9 pr-10"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded text-slate-600 hover:bg-slate-100" aria-label={t('Clear search', 'Burahin ang hinahanap')}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {error ? (
        <div className="mt-6 rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-700">
          <p>{t('The list of documents could not be loaded. Check your connection and try again.', 'Hindi ma-load ang listahan ng dokumento. Suriin ang iyong koneksyon at subukang muli.')}</p>
          <button type="button" className="btn-secondary mt-3" onClick={() => { cache.delete(key); setReload((n) => n + 1) }}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> {t('Try again', 'Subukang muli')}
          </button>
        </div>
      ) : types === null ? (
        <div className="mt-6 space-y-3" aria-busy="true" aria-label={t('Loading documents', 'Nilo-load ang mga dokumento')}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-card h-24" />)}
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-8">
            {barangay ? (
              <DocGroup
                title={t(`At Barangay ${barangay.name} hall`, `Sa barangay hall ng ${barangay.name}`)}
                docs={barangayDocs}
                Heading={SubHeading}
                ItemHeading={ItemHeading}
                verified={!!verified}
                isAuthenticated={isAuthenticated}
                empty={q ? t(`No barangay document matches "${q}".`, `Walang dokumento ng barangay na tugma sa "${q}".`) : t('This barangay has not listed online documents yet.', 'Wala pang nakalistang online na dokumento ang barangay na ito.')}
              />
            ) : (
              <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
                {t(
                  'Choose your barangay above to also see barangay clearance, residency and other barangay documents.',
                  'Piliin ang iyong barangay sa itaas para makita rin ang barangay clearance, residency at iba pang dokumento ng barangay.'
                )}
              </p>
            )}
            <DocGroup
              title={t(`At the ${town.name} municipal hall`, `Sa munisipyo ng ${town.name}`)}
              docs={municipalDocs}
              Heading={SubHeading}
              ItemHeading={ItemHeading}
              verified={!!verified}
              isAuthenticated={isAuthenticated}
              empty={q ? t(`No municipal document matches "${q}".`, `Walang dokumento ng munisipyo na tugma sa "${q}".`) : t('This municipality has not listed online documents yet.', 'Wala pang nakalistang online na dokumento ang munisipyong ito.')}
            />
          </div>
          <aside className="hidden lg:block">
            <figure className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={visual.landmark} alt={t(`${town.name}, Zambales`, `${town.name}, Zambales`)} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="p-4 text-sm text-slate-700">
                <p>{visual.spotlight}</p>
                <a href={visual.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-slate-600 underline">{visual.sourceLabel}</a>
              </figcaption>
            </figure>
            <p className="mt-4 text-sm text-slate-600">
              {lang === 'fil'
                ? 'Libre ang pag-browse ng listahang ito. Kailangan ng beripikadong account para makapag-request.'
                : 'Anyone can browse this list. You need a verified account to send a request.'}
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}

function DocGroup({
  title, docs, Heading, ItemHeading, verified, isAuthenticated, empty,
}: {
  title: string
  docs: DocType[]
  Heading: 'h2' | 'h3'
  ItemHeading: 'h3' | 'h4'
  verified: boolean
  isAuthenticated: boolean
  empty: string
}) {
  return (
    <section>
      <Heading className="text-lg font-semibold text-slate-900">{title}</Heading>
      {docs.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {docs.map((d) => <DocRow key={d.id} doc={d} ItemHeading={ItemHeading} verified={verified} isAuthenticated={isAuthenticated} />)}
        </ul>
      )}
    </section>
  )
}

function DocRow({ doc, ItemHeading, verified, isAuthenticated }: { doc: DocType; ItemHeading: 'h3' | 'h4'; verified: boolean; isAuthenticated: boolean }) {
  const { t } = useLang()
  const tiers = doc.fee_tiers ? Object.values(doc.fee_tiers).map(Number).filter((n) => !Number.isNaN(n)) : []
  const fee = tiers.length
    ? `${formatPeso(Math.min(...tiers))} – ${formatPeso(Math.max(...tiers))}`
    : Number(doc.fee) > 0 ? formatPeso(Number(doc.fee)) : t('Free', 'Libre')
  const days = Number(doc.processing_days ?? 0)
  const time = days <= 0
    ? t('Same day', 'Sa araw ding iyon')
    : days === 1 ? t('1 working day', '1 araw ng trabaho') : t(`${days} working days`, `${days} araw ng trabaho`)
  const release = [
    doc.supports_physical !== false ? t('Pickup at the hall', 'Kukunin sa opisina') : null,
    doc.supports_digital ? t('Digital copy', 'Digital na kopya') : null,
  ].filter(Boolean).join(' · ')
  const rules = doc.exemption_rules || {}
  const freeFor = [
    rules.senior ? t('senior citizens', 'senior citizen') : null,
    rules.pwd ? t('PWDs', 'PWD') : null,
    rules.student ? t('students (for school use)', 'estudyante (para sa paaralan)') : null,
  ].filter(Boolean)
  const requirements = (doc.requirements || []).map(requirementText).filter(Boolean)
  const requestTo = verified ? `/documents?type=${doc.id}` : isAuthenticated ? '/upload-id' : '/register'

  return (
    <li className="grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      <div className="min-w-0">
        <ItemHeading className="text-base font-semibold text-slate-900">{doc.name}</ItemHeading>
        {doc.description && <p className="mt-1 text-sm text-slate-600">{doc.description}</p>}
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-600">{t('Fee', 'Singil')}</dt>
            <dd className="font-semibold tabular-nums text-slate-900">
              {fee}
              {!doc.fee_confirmed && Number(doc.fee) > 0 && (
                <span className="ml-1.5 align-middle rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">
                  {t('provisional', 'pansamantala')}
                </span>
              )}
            </dd>
            {freeFor.length > 0 && (
              <dd className="mt-0.5 text-xs text-emerald-800">{t('Free for', 'Libre para sa')} {freeFor.join(', ')}</dd>
            )}
          </div>
          <div>
            <dt className="text-xs text-slate-600">{t('Processing time', 'Tagal ng pagproseso')}</dt>
            <dd className="font-medium text-slate-900">{time}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-slate-600">{t('How you get it', 'Paano makukuha')}</dt>
            <dd className="font-medium text-slate-900">{release}</dd>
          </div>
        </dl>
        {requirements.length > 0 && (
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-medium">{t('Bring:', 'Dalhin:')}</span> {requirements.join(' · ')}
          </p>
        )}
      </div>
      <Link to={requestTo} className="btn-primary w-full md:w-auto" aria-label={t(`Request ${doc.name}`, `Humiling ng ${doc.name}`)}>
        {t('Request', 'Humiling')}
      </Link>
    </li>
  )
}
