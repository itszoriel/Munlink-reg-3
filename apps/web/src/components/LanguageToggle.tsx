import { useLang, type Lang } from '@/lib/i18n'

const OPTIONS: { value: Lang; label: string; name: string }[] = [
  { value: 'fil', label: 'FIL', name: 'Filipino' },
  { value: 'en', label: 'EN', name: 'English' },
]

/** Segmented Filipino / English switch. */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLang()
  return (
    <div
      role="group"
      aria-label={t('Language', 'Wika')}
      className={`inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-xs font-semibold ${className}`}
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            lang={opt.value === 'fil' ? 'fil' : 'en'}
            aria-pressed={active}
            aria-label={opt.name}
            onClick={() => setLang(opt.value)}
            className={`min-h-[32px] min-w-[40px] rounded px-2 transition-colors ${
              active ? 'bg-navy-700 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
