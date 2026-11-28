import { MUNICIPALITIES } from '@/lib/locations'
import { getMunicipalitySeal } from '@/lib/municipalityVisuals'
import { useAppStore, type Municipality } from '@/lib/store'
import { useLang } from '@/lib/i18n'

type Props = {
  /** Called after a town is chosen (the choice is also saved as the browsing location). */
  onPick?: (m: Municipality) => void
  heading?: string
  description?: string
  headingLevel?: 'h2' | 'h3'
}

/**
 * The 13 municipalities of Zambales as seal buttons. Used wherever a page needs a
 * town before it can show anything, so nobody is sent to a selector hidden in the header.
 */
export default function TownPicker({ onPick, heading, description, headingLevel = 'h2' }: Props) {
  const { t } = useLang()
  const setMunicipality = useAppStore((s) => s.setMunicipality)
  const selected = useAppStore((s) => s.selectedMunicipality)
  const Heading = headingLevel

  return (
    <div>
      <Heading className="text-lg font-semibold text-slate-900">
        {heading || t('Choose your town', 'Piliin ang iyong bayan')}
      </Heading>
      {description !== '' && (
        <p className="mt-1 text-sm text-slate-600">
          {description || t('Services, fees and announcements differ per municipality.', 'Magkakaiba ang serbisyo, singil at anunsyo ng bawat munisipyo.')}
        </p>
      )}
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {MUNICIPALITIES.map((m) => {
          const active = selected?.id === m.id
          return (
            <li key={m.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => { setMunicipality(m); onPick?.(m) }}
                className={`flex min-h-[52px] w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                  active ? 'border-navy-700 bg-navy-50 text-navy-900' : 'border-slate-200 bg-white text-slate-800 hover:border-navy-300'
                }`}
              >
                <img src={getMunicipalitySeal(m.slug)} alt="" width={32} height={32} loading="lazy" className="h-8 w-8 flex-shrink-0 object-contain" />
                <span className="min-w-0 truncate">{m.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
