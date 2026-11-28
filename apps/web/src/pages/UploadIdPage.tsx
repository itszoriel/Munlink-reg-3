import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { authApi, getAccessToken } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { idDocumentFlags } from '@/lib/verification'
import PrivateIdPreview from '@/components/PrivateIdPreview'
import PhotoField from '@/components/PhotoField'
import { useLang } from '@/lib/i18n'

export default function UploadIdPage() {
  const { t } = useLang()
  const emailVerified = useAppStore((s) => s.emailVerified)
  const user = useAppStore((s) => s.user) as any
  const setAuth = useAppStore((s) => s.setAuth)
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [idType, setIdType] = useState<string>(user?.valid_id_type || '')
  const [idTypes, setIdTypes] = useState<{ value: string; label: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  // Bumped after an upload so the previews reload the replaced files.
  const [previewVersion, setPreviewVersion] = useState(0)

  const idFlags = idDocumentFlags(user)
  const hasIdDocuments = idFlags.valid_id_front || idFlags.valid_id_back
  const canSubmit = !!front || !!back || !!selfie

  useEffect(() => {
    authApi.getValidIdTypes().then((res: any) => setIdTypes(res?.data?.types || [])).catch(() => setIdTypes([]))
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    if (!canSubmit) {
      setErr(t('Add at least one photo to upload.', 'Magdagdag ng kahit isang litrato.'))
      return
    }
    setSubmitting(true)
    try {
      const response = await authApi.uploadVerificationDocs({
        valid_id_front: front || undefined,
        valid_id_back: back || undefined,
        selfie_with_id: selfie || undefined,
        valid_id_type: idType || undefined,
      })
      if (response.data?.user) setAuth(response.data.user, getAccessToken() || '', '')
      setMsg(response.data?.message || t('Uploaded. Your account is waiting for review by your municipality.', 'Na-upload na. Hinihintay ang pagsusuri ng iyong munisipyo.'))
      setFront(null); setBack(null); setSelfie(null)
      setPreviewVersion((v) => v + 1)
    } catch (e: any) {
      setErr(String(e?.response?.data?.error || t('Upload failed. Check your connection and try again.', 'Hindi na-upload. Suriin ang koneksyon at subukang muli.')).replace(/^[a-z_]+:\s*/i, ''))
    } finally {
      setSubmitting(false)
    }
  }

  const current = (docType: 'id_front' | 'id_back' | 'selfie', present: boolean, label: string, inputId: string) => present && (
    <div className="mb-2">
      <p className="mb-1 text-sm text-slate-600">{t('On file now:', 'Nakatala ngayon:')}</p>
      <div className="w-full max-w-xs">
        <PrivateIdPreview
          key={`${docType}-${previewVersion}`}
          docType={docType}
          alt={label}
          fallbackIcon={docType === 'selfie' ? 'user' : 'document'}
          onReplace={() => document.getElementById(inputId)?.focus()}
        />
      </div>
    </div>
  )

  return (
    <div className="container-responsive max-w-2xl py-10 sm:py-12">
      <h1 className="text-2xl font-semibold text-slate-900">{t('Verify your identity', 'I-verify ang iyong pagkakakilanlan')}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {hasIdDocuments
          ? t('Your ID is on file. Upload new photos only if staff asked you to, or if your ID changed.', 'Nakatala na ang iyong ID. Mag-upload lamang ng bago kung hiniling ng kawani o nagbago ang iyong ID.')
          : t('Upload one valid ID and a selfie so your municipality can verify your account.', 'Mag-upload ng isang valid ID at selfie para ma-verify ng iyong munisipyo ang account.')}
      </p>

      {!emailVerified && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          {t('Confirm your email first. You can upload now, but review starts after your email is confirmed.', 'Kumpirmahin muna ang iyong email. Maaari kang mag-upload ngayon, pero magsisimula ang pagsusuri pagkatapos makumpirma ang email.')}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-6 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        {err && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{err}</div>}
        {msg && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{msg}</div>}

        <p className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
          {t(
            'Only authorized staff of your own municipality can open these files, and every view is logged.',
            'Ang awtorisadong kawani lamang ng iyong munisipyo ang makakabukas ng mga file na ito, at naitatala ang bawat pagtingin.'
          )}
        </p>

        {idTypes.length > 0 && (
          <div>
            <label htmlFor="upload-id-type" className="block text-sm font-medium text-slate-900">{t('Which ID are you using?', 'Anong ID ang gagamitin mo?')}</label>
            <select id="upload-id-type" className="input-field mt-1" value={idType} onChange={(e) => setIdType(e.target.value)}>
              <option value="">{t('Choose an ID type', 'Pumili ng uri ng ID')}</option>
              {idTypes.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
        )}

        <div>
          {current('id_front', !!idFlags.valid_id_front, t('Front of your ID', 'Harap ng ID'), 'upload-front')}
          <PhotoField id="upload-front" kind="id" label={t('Front of your ID', 'Harap ng ID')} value={front} onChange={setFront} />
        </div>
        <div>
          {current('id_back', !!idFlags.valid_id_back, t('Back of your ID', 'Likod ng ID'), 'upload-back')}
          <PhotoField id="upload-back" kind="id" label={t('Back of your ID', 'Likod ng ID')} value={back} onChange={setBack} />
        </div>
        <div>
          {current('selfie', !!idFlags.selfie_with_id, t('Selfie holding your ID', 'Selfie na hawak ang ID'), 'upload-selfie')}
          <PhotoField id="upload-selfie" kind="selfie" label={t('Selfie holding your ID', 'Selfie na hawak ang ID')} value={selfie} onChange={setSelfie} />
        </div>

        <div className="border-t border-slate-200 pt-5">
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!canSubmit || submitting}>
            {submitting ? t('Uploading…', 'Ina-upload…') : t('Upload', 'I-upload')}
          </button>
        </div>
      </form>
    </div>
  )
}
