import { useEffect, useState } from 'react'
import { Camera, ImageUp } from 'lucide-react'
import { downscaleImage } from '@/lib/imageResize'
import { useLang } from '@/lib/i18n'

type Props = {
  id: string
  label: string
  hint?: string
  kind: 'id' | 'selfie' | 'photo'
  value: File | null | undefined
  onChange: (file: File | null) => void
  required?: boolean
  error?: string
}

/**
 * Photo upload with two plain choices (camera or gallery), a framing guide shaped
 * like the thing being photographed, and on-device downscaling before upload.
 */
export default function PhotoField({ id, label, hint, kind, value, onChange, required, error }: Props) {
  const { t } = useLang()
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!value) { setPreview(null); return }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const pick = async (file?: File | null) => {
    if (!file) return
    setBusy(true)
    try { onChange(await downscaleImage(file)) } finally { setBusy(false) }
  }

  const aspect = kind === 'id' ? 'aspect-[85.6/54]' : 'aspect-square'
  const guide = kind === 'id'
    ? t('Place the whole card inside the frame, in good light, with no glare.', 'Ilagay ang buong card sa loob ng frame, sa maliwanag na lugar, walang silaw.')
    : kind === 'selfie'
      ? t('Hold your ID next to your face. Both must be clear.', 'Hawakan ang ID katabi ng iyong mukha. Dapat malinaw ang dalawa.')
      : t('A clear photo of your face.', 'Malinaw na larawan ng iyong mukha.')

  const errorId = error ? `${id}-error` : undefined
  const hintId = `${id}-hint`

  return (
    <div>
      <p id={`${id}-label`} className="text-sm font-medium text-slate-900">
        {label} {required ? <span className="text-red-700" aria-hidden="true">*</span> : <span className="font-normal text-slate-600">({t('optional', 'opsyonal')})</span>}
      </p>
      {hint && <p id={hintId} className="mt-0.5 text-sm text-slate-600">{hint}</p>}
      <div className={`mt-2 ${aspect} ${kind === 'id' ? 'w-full max-w-sm' : 'w-40'} overflow-hidden rounded-md border-2 border-dashed ${error ? 'border-red-400' : 'border-slate-300'} bg-slate-50`}>
        {preview ? (
          <img src={preview} alt={t(`Preview: ${label}`, `Silip: ${label}`)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-slate-600">{guide}</div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className="btn-secondary min-h-[44px] cursor-pointer focus-within:ring-2 focus-within:ring-navy-600 focus-within:ring-offset-2">
          <Camera className="h-4 w-4" aria-hidden="true" />
          {busy ? t('Preparing…', 'Inihahanda…') : t('Take photo', 'Kumuha ng litrato')}
          <input
            id={id}
            type="file"
            accept="image/*"
            capture={kind === 'selfie' || kind === 'photo' ? 'user' : 'environment'}
            className="sr-only"
            aria-describedby={[hint ? hintId : '', errorId || ''].filter(Boolean).join(' ') || undefined}
            aria-invalid={!!error}
            aria-labelledby={`${id}-label`}
            onChange={(e) => { pick(e.target.files?.[0]); e.currentTarget.value = '' }}
          />
        </label>
        <label className="btn-ghost min-h-[44px] cursor-pointer focus-within:ring-2 focus-within:ring-navy-600 focus-within:ring-offset-2">
          <ImageUp className="h-4 w-4" aria-hidden="true" />
          {t('Choose from gallery', 'Pumili sa gallery')}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={t(`${label}: choose from gallery`, `${label}: pumili sa gallery`)}
            onChange={(e) => { pick(e.target.files?.[0]); e.currentTarget.value = '' }}
          />
        </label>
        {value && (
          <button type="button" className="btn-ghost min-h-[44px] text-red-700" onClick={() => onChange(null)}>
            {t('Remove', 'Alisin')}
          </button>
        )}
      </div>
      {error && <p id={errorId} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  )
}
