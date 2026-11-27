import { Check } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { STAGES, stageIndex, statusInfo } from '@/lib/requestStatus'

type Props = {
  status?: string
  /** Dates for each stage when known (ISO strings). */
  dates?: Partial<Record<'received' | 'processing' | 'ready' | 'released', string | null>>
  pickup?: boolean
  compact?: boolean
}

function shortDate(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

/**
 * Four-stage progress line: Received → Being processed → Ready → Released.
 * A stopped request (not approved / cancelled) shows its reason instead of progress.
 */
export default function RequestTimeline({ status, dates = {}, pickup = true, compact = false }: Props) {
  const { t, lang } = useLang()
  const reached = stageIndex(status)
  const info = statusInfo(status)

  if (reached < 0) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
        {lang === 'fil' ? info.fil : info.en}
      </p>
    )
  }

  return (
    <ol className={`grid grid-cols-4 ${compact ? 'gap-1' : 'gap-2'}`} aria-label={t('Request progress', 'Takbo ng kahilingan')}>
      {STAGES.map((stage, i) => {
        const done = i < reached || (i === reached && stage.key === 'released')
        const current = i === reached && !done
        const label = stage.key === 'ready'
          ? (pickup ? t('Ready for pickup', 'Handa nang kunin') : t('Ready to download', 'Handa nang i-download'))
          : t(stage.en, stage.fil)
        return (
          <li key={stage.key} className="min-w-0" aria-current={current ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full ${i <= reached ? 'bg-navy-700' : 'bg-slate-200'}`} />
            <div className="mt-2 flex items-start gap-1">
              {done && <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-navy-700" aria-hidden="true" />}
              <span className={`text-xs leading-snug ${current ? 'font-semibold text-slate-900' : i < reached || done ? 'text-slate-700' : 'text-slate-500'}`}>
                {label}
              </span>
            </div>
            {!compact && dates[stage.key] && i <= reached && (
              <span className="block text-xs tabular-nums text-slate-500">{shortDate(dates[stage.key])}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
