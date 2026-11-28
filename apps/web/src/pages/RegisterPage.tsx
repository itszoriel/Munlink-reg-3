import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { authApi } from '@/lib/api'
import { getMunicipalities, getBarangaysByMunicipalitySlug } from '@/lib/locations'
import { getMunicipalitySeal } from '@/lib/municipalityVisuals'
import { useLang } from '@/lib/i18n'
import PhotoField from '@/components/PhotoField'

const DRAFT_KEY = 'munlink:register-draft'

type Form = {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  username: string
  email: string
  mobileNumber: string
  password: string
  confirmPassword: string
  municipality: string
  barangay_id: string
  validIdType: string
}

type Files = {
  valid_id_front?: File | null
  valid_id_back?: File | null
  selfie_with_id?: File | null
  profile_picture?: File | null
}

const EMPTY: Form = {
  firstName: '', middleName: '', lastName: '', dateOfBirth: '',
  username: '', email: '', mobileNumber: '', password: '', confirmPassword: '',
  municipality: '', barangay_id: '', validIdType: '',
}

// Fallback list if /api/auth/valid-id-types cannot be reached; the API is the source of truth.
const FALLBACK_ID_TYPES = [
  { value: 'philsys', label: 'PhilSys National ID (PhilID / ePhilID)' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'umid', label: 'UMID / SSS ID' },
  { value: 'passport', label: 'Philippine Passport' },
  { value: 'voters_id', label: "Voter's ID or Voter's Certification" },
  { value: 'postal_id', label: 'Postal ID' },
  { value: 'senior_citizen_id', label: 'Senior Citizen ID' },
  { value: 'other', label: 'Other government-issued ID' },
]

function loadDraft(): Form {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return { ...EMPTY, ...JSON.parse(raw), password: '', confirmPassword: '' }
  } catch { /* ignore */ }
  return EMPTY
}

/** Strip the "field: " prefix the API puts on validation errors. */
function apiMessage(err: any, fallback: string) {
  const raw = String(err?.response?.data?.error || '')
  return raw ? raw.replace(/^[a-z_]+:\s*/i, '') : fallback
}

const STEP_FIELDS: Record<number, (keyof Form | keyof Files)[]> = {
  1: ['firstName', 'lastName', 'dateOfBirth', 'username', 'email', 'mobileNumber', 'password', 'confirmPassword'],
  2: ['municipality', 'barangay_id'],
  3: ['validIdType', 'valid_id_front', 'valid_id_back', 'selfie_with_id'],
}

export default function RegisterPage() {
  const { t } = useLang()
  const [form, setForm] = useState<Form>(loadDraft)
  const [files, setFiles] = useState<Files>({})
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState<{ emailSent: boolean } | null>(null)
  const [idTypes, setIdTypes] = useState(FALLBACK_ID_TYPES)
  const [draftSaved, setDraftSaved] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const municipalities = useMemo(() => getMunicipalities(), [])
  const barangays = useMemo(() => (form.municipality ? getBarangaysByMunicipalitySlug(form.municipality) : []), [form.municipality])
  const town = municipalities.find((m) => m.slug === form.municipality)
  const barangay = barangays.find((b) => String(b.id) === form.barangay_id)
  const idTypeLabel = idTypes.find((x) => x.value === form.validIdType)?.label
  const backOptional = form.validIdType === 'passport'

  useEffect(() => {
    authApi.getValidIdTypes()
      .then((res: any) => { const list = res?.data?.types; if (Array.isArray(list) && list.length) setIdTypes(list) })
      .catch(() => { /* keep fallback */ })
  }, [])

  // Save the draft (never the password) so a dropped connection does not lose the form.
  useEffect(() => {
    const { password: _p, confirmPassword: _c, ...rest } = form
    const empty = Object.values(rest).every((v) => !v)
    try {
      if (empty) localStorage.removeItem(DRAFT_KEY)
      else { localStorage.setItem(DRAFT_KEY, JSON.stringify(rest)); setDraftSaved(true) }
    } catch { /* ignore */ }
  }, [form])

  // Move focus to the heading when the step changes (not on first load).
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    headingRef.current?.focus()
  }, [step, done])

  const set = (key: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === 'municipality' ? { barangay_id: '' } : {}) }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }
  const setFile = (key: keyof Files, file: File | null) => {
    setFiles((f) => ({ ...f, [key]: file }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  function validate(s: number): Record<string, string> {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName = t('Enter your first name.', 'Ilagay ang iyong pangalan.')
      if (!form.lastName.trim()) e.lastName = t('Enter your last name.', 'Ilagay ang iyong apelyido.')
      if (!form.dateOfBirth) e.dateOfBirth = t('Enter your date of birth.', 'Ilagay ang petsa ng kapanganakan.')
      if (!/^[A-Za-z0-9_]{3,30}$/.test(form.username)) e.username = t('3 to 30 letters, numbers or underscores.', '3 hanggang 30 titik, numero o underscore.')
      if (!/^[^\s@]+@(gmail|googlemail)\.com$/i.test(form.email.trim())) e.email = t('Use a Gmail address (ends in @gmail.com).', 'Gumamit ng Gmail (nagtatapos sa @gmail.com).')
      if (form.mobileNumber && !/^(09|\+639)\d{9}$/.test(form.mobileNumber.replace(/[\s-]/g, ''))) e.mobileNumber = t('Use the format 09XXXXXXXXX.', 'Gamitin ang format na 09XXXXXXXXX.')
      if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
        e.password = t('At least 8 characters with an uppercase letter, a lowercase letter and a number.', 'Hindi bababa sa 8 character, may malaking titik, maliit na titik at numero.')
      }
      if (form.confirmPassword !== form.password) e.confirmPassword = t('The passwords do not match.', 'Hindi magkatugma ang password.')
    }
    if (s === 2) {
      if (!form.municipality) e.municipality = t('Choose your municipality.', 'Piliin ang iyong munisipyo.')
      if (!form.barangay_id) e.barangay_id = t('Choose your barangay.', 'Piliin ang iyong barangay.')
    }
    if (s === 3) {
      if (!form.validIdType) e.validIdType = t('Choose which ID you are uploading.', 'Piliin kung anong ID ang iyong ia-upload.')
      if (!files.valid_id_front) e.valid_id_front = t('Add a photo of the front of your ID.', 'Maglagay ng litrato ng harap ng ID.')
      if (!files.valid_id_back && !backOptional) e.valid_id_back = t('Add a photo of the back of your ID.', 'Maglagay ng litrato ng likod ng ID.')
      if (!files.selfie_with_id) e.selfie_with_id = t('Add a selfie holding your ID.', 'Maglagay ng selfie na hawak ang ID.')
    }
    return e
  }

  const next = () => {
    const e = validate(step)
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) {
      document.getElementById(`reg-${first}`)?.focus()
      return
    }
    setStep((s) => Math.min(4, s + 1))
    window.scrollTo({ top: 0 })
  }
  const back = () => { setStep((s) => Math.max(1, s - 1)); window.scrollTo({ top: 0 }) }

  const submit = async () => {
    setSubmitError(null)
    for (const s of [1, 2, 3]) {
      const e = validate(s)
      if (Object.keys(e).length) { setErrors(e); setStep(s); return }
    }
    if (!agreed) { setSubmitError(t('Please agree to the Terms of Service and Privacy Policy.', 'Pakisang-ayunan ang Terms of Service at Privacy Policy.')); return }
    setSubmitting(true)
    try {
      const payload: Record<string, string | number> = {
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        date_of_birth: form.dateOfBirth,
        municipality_slug: form.municipality,
        barangay_id: Number(form.barangay_id),
        valid_id_type: form.validIdType,
      }
      if (form.middleName.trim()) payload.middle_name = form.middleName.trim()
      if (form.mobileNumber.trim()) payload.mobile_number = form.mobileNumber.replace(/[\s-]/g, '')
      const res = await authApi.register(payload, {
        profile_picture: files.profile_picture || undefined,
        valid_id_front: files.valid_id_front || undefined,
        valid_id_back: files.valid_id_back || undefined,
        selfie_with_id: files.selfie_with_id || undefined,
      })
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
      setDone({ emailSent: res?.data?.email_sent !== false })
    } catch (err: any) {
      const field = String(err?.response?.data?.error || '').split(':')[0]
      const stepFor = Object.entries(STEP_FIELDS).find(([, keys]) => keys.some((k) => k.toLowerCase().includes(field.replace('_', ''))))
      setSubmitError(apiMessage(err, t('Registration could not be completed. Check your connection and try again.', 'Hindi natapos ang pagpaparehistro. Suriin ang koneksyon at subukang muli.')))
      if (field === 'username' || field === 'email' || err?.response?.status === 409) setStep(1)
      else if (stepFor && field) setStep(Number(stepFor[0]))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="container-responsive max-w-2xl py-12">
        <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Check className="h-6 w-6" aria-hidden="true" /></span>
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-semibold text-slate-900 outline-none">{t('Your account was created', 'Nagawa na ang iyong account')}</h1>
          <ol className="mt-6 space-y-5 text-sm text-slate-700">
            <li>
              <p className="font-semibold text-slate-900">{t('1. Confirm your email', '1. Kumpirmahin ang iyong email')}</p>
              <p className="mt-1">
                {done.emailSent
                  ? t(`We sent a link to ${form.email}. Open it to confirm your address.`, `Nagpadala kami ng link sa ${form.email}. Buksan ito para makumpirma ang address.`)
                  : t('The confirmation email could not be sent yet. Log in and use "Resend verification".', 'Hindi pa naipadala ang email. Mag-log in at piliin ang "Resend verification".')}
              </p>
            </li>
            <li>
              <p className="font-semibold text-slate-900">{t('2. Wait for ID review', '2. Hintayin ang pagsusuri ng ID')}</p>
              <p className="mt-1">
                {t(
                  `Staff of ${town?.name || 'your municipality'} check your ID and selfie, usually within 1 to 3 working days. You get an email when it is done.`,
                  `Susuriin ng kawani ng ${town?.name || 'iyong munisipyo'} ang iyong ID at selfie, karaniwang sa loob ng 1 hanggang 3 araw ng trabaho. Makakatanggap ka ng email kapag tapos na.`
                )}
              </p>
            </li>
            <li>
              <p className="font-semibold text-slate-900">{t('3. Request documents', '3. Humiling ng dokumento')}</p>
              <p className="mt-1">{t('Once verified, you can request documents and apply to programs online.', 'Kapag beripikado na, maaari ka nang humiling ng dokumento at mag-apply sa mga programa online.')}</p>
            </li>
          </ol>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="btn-primary">{t('Go to log in', 'Pumunta sa log in')}</Link>
            <Link to="/services" className="btn-secondary">{t('See documents and fees', 'Tingnan ang mga dokumento at singil')}</Link>
          </div>
        </div>
      </div>
    )
  }

  const STEPS = [t('Account', 'Account'), t('Address', 'Tirahan'), t('Valid ID', 'Valid ID'), t('Review', 'Suriin')]

  return (
    <div className="container-responsive max-w-2xl py-10 sm:py-12">
      <div className="flex items-center gap-3">
        <img src="/logos/provinces/zambales.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-slate-900 outline-none">{t('Create your account', 'Gumawa ng account')}</h1>
          <p className="text-sm text-slate-600">{t('For residents of the 13 municipalities of Zambales.', 'Para sa mga residente ng 13 bayan ng Zambales.')}</p>
        </div>
      </div>

      <ol className="mt-6 grid grid-cols-4 gap-2" aria-label={t('Registration steps', 'Mga hakbang')}>
        {STEPS.map((label, i) => {
          const n = i + 1
          return (
            <li key={label} aria-current={n === step ? 'step' : undefined}>
              <div className={`h-1.5 rounded-full ${n <= step ? 'bg-navy-700' : 'bg-slate-200'}`} />
              <span className={`mt-1.5 block text-xs ${n === step ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{n}. {label}</span>
            </li>
          )
        })}
      </ol>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        {submitError && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{submitError}</div>
        )}

        {step === 1 && (
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-slate-900">{t('Your name and account', 'Pangalan at account')}</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="firstName" label={t('First name', 'Pangalan')} required value={form.firstName} onChange={(v) => set('firstName', v)} error={errors.firstName} autoComplete="given-name" />
              <Field id="middleName" label={t('Middle name', 'Gitnang pangalan')} value={form.middleName} onChange={(v) => set('middleName', v)} autoComplete="additional-name" />
              <Field id="lastName" label={t('Last name', 'Apelyido')} required value={form.lastName} onChange={(v) => set('lastName', v)} error={errors.lastName} autoComplete="family-name" />
            </div>
            <Field id="dateOfBirth" type="date" label={t('Date of birth', 'Petsa ng kapanganakan')} required value={form.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} error={errors.dateOfBirth} autoComplete="bday" />
            <Field id="email" type="email" label={t('Gmail address', 'Gmail address')} hint={t('We send your confirmation link and request updates here.', 'Dito namin ipapadala ang link ng kumpirmasyon at mga update.')} required value={form.email} onChange={(v) => set('email', v)} error={errors.email} autoComplete="email" inputMode="email" />
            <Field id="mobileNumber" type="tel" label={t('Mobile number', 'Numero ng mobile')} hint={t('For text updates on your requests. Format: 09XXXXXXXXX.', 'Para sa text update ng iyong kahilingan. Format: 09XXXXXXXXX.')} value={form.mobileNumber} onChange={(v) => set('mobileNumber', v)} error={errors.mobileNumber} autoComplete="tel" inputMode="tel" />
            <Field id="username" label={t('Username', 'Username')} hint={t('You log in with this or your email.', 'Ito o ang email ang gagamitin sa pag-log in.')} required value={form.username} onChange={(v) => set('username', v)} error={errors.username} autoComplete="username" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="password" type={showPassword ? 'text' : 'password'} label={t('Password', 'Password')} hint={t('8+ characters, with A–Z, a–z and 0–9.', '8+ character, may A–Z, a–z at 0–9.')} required value={form.password} onChange={(v) => set('password', v)} error={errors.password} autoComplete="new-password" />
              <Field id="confirmPassword" type={showPassword ? 'text' : 'password'} label={t('Confirm password', 'Ulitin ang password')} required value={form.confirmPassword} onChange={(v) => set('confirmPassword', v)} error={errors.confirmPassword} autoComplete="new-password" />
            </div>
            <button type="button" className="btn-ghost min-h-[40px] px-2 text-sm" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}>
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              {showPassword ? t('Hide passwords', 'Itago ang password') : t('Show passwords', 'Ipakita ang password')}
            </button>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-slate-900">{t('Where you live', 'Saan ka nakatira')}</legend>
            <p className="text-sm text-slate-600">{t('Province: Zambales. Your requests go to the offices of the town and barangay you choose here.', 'Lalawigan: Zambales. Mapupunta ang iyong mga kahilingan sa opisina ng bayan at barangay na pipiliin mo rito.')}</p>
            <div>
              <label htmlFor="reg-municipality" className="block text-sm font-medium text-slate-900">{t('Municipality', 'Munisipyo')} <span className="text-red-700" aria-hidden="true">*</span></label>
              <div className="mt-1 flex items-center gap-3">
                {town && <img src={getMunicipalitySeal(town.slug)} alt="" width={40} height={40} className="h-10 w-10 object-contain" />}
                <select id="reg-municipality" className={`input-field ${errors.municipality ? 'input-field-error' : ''}`} value={form.municipality} onChange={(e) => set('municipality', e.target.value)} aria-invalid={!!errors.municipality} aria-describedby={errors.municipality ? 'reg-municipality-error' : undefined}>
                  <option value="">{t('Choose municipality', 'Piliin ang munisipyo')}</option>
                  {municipalities.map((m) => <option key={m.id} value={m.slug}>{m.name}</option>)}
                </select>
              </div>
              {errors.municipality && <p id="reg-municipality-error" className="mt-1 text-sm text-red-700">{errors.municipality}</p>}
            </div>
            <div>
              <label htmlFor="reg-barangay_id" className="block text-sm font-medium text-slate-900">{t('Barangay', 'Barangay')} <span className="text-red-700" aria-hidden="true">*</span></label>
              <select id="reg-barangay_id" className={`input-field mt-1 ${errors.barangay_id ? 'input-field-error' : ''}`} value={form.barangay_id} onChange={(e) => set('barangay_id', e.target.value)} disabled={!form.municipality} aria-invalid={!!errors.barangay_id} aria-describedby={errors.barangay_id ? 'reg-barangay_id-error' : undefined}>
                <option value="">{form.municipality ? t('Choose barangay', 'Piliin ang barangay') : t('Choose a municipality first', 'Piliin muna ang munisipyo')}</option>
                {barangays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.barangay_id && <p id="reg-barangay_id-error" className="mt-1 text-sm text-red-700">{errors.barangay_id}</p>}
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="space-y-6">
            <legend className="text-lg font-semibold text-slate-900">{t('Proof of identity', 'Patunay ng pagkakakilanlan')}</legend>
            <p className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
              {t(
                'Your ID and selfie go to private storage. Only authorized staff of your own municipality can open them, and every view is logged (Data Privacy Act of 2012).',
                'Mapupunta sa pribadong storage ang iyong ID at selfie. Ang awtorisadong kawani lamang ng iyong munisipyo ang makakabukas nito, at naitatala ang bawat pagtingin (Data Privacy Act of 2012).'
              )}
            </p>
            <div>
              <label htmlFor="reg-validIdType" className="block text-sm font-medium text-slate-900">{t('Which ID are you using?', 'Anong ID ang gagamitin mo?')} <span className="text-red-700" aria-hidden="true">*</span></label>
              <select id="reg-validIdType" className={`input-field mt-1 ${errors.validIdType ? 'input-field-error' : ''}`} value={form.validIdType} onChange={(e) => set('validIdType', e.target.value)} aria-invalid={!!errors.validIdType} aria-describedby={errors.validIdType ? 'reg-validIdType-error' : undefined}>
                <option value="">{t('Choose an ID type', 'Pumili ng uri ng ID')}</option>
                {idTypes.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
              {errors.validIdType && <p id="reg-validIdType-error" className="mt-1 text-sm text-red-700">{errors.validIdType}</p>}
            </div>
            <PhotoField id="reg-valid_id_front" kind="id" label={t('Front of your ID', 'Harap ng ID')} required value={files.valid_id_front} onChange={(f) => setFile('valid_id_front', f)} error={errors.valid_id_front} />
            <PhotoField id="reg-valid_id_back" kind="id" label={t('Back of your ID', 'Likod ng ID')} required={!backOptional} value={files.valid_id_back} onChange={(f) => setFile('valid_id_back', f)} error={errors.valid_id_back} />
            <PhotoField id="reg-selfie_with_id" kind="selfie" label={t('Selfie holding your ID', 'Selfie na hawak ang ID')} required value={files.selfie_with_id} onChange={(f) => setFile('selfie_with_id', f)} error={errors.selfie_with_id} />
            <PhotoField id="reg-profile_picture" kind="photo" label={t('Profile photo', 'Larawan sa profile')} hint={t('Shown on your profile and marketplace posts.', 'Makikita sa iyong profile at mga post sa palengke.')} value={files.profile_picture} onChange={(f) => setFile('profile_picture', f)} />
          </fieldset>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">{t('Check your details', 'Suriin ang iyong detalye')}</h2>
            <dl className="divide-y divide-slate-200 rounded-md border border-slate-200 text-sm">
              <Row label={t('Name', 'Pangalan')} value={[form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')} onEdit={() => setStep(1)} />
              <Row label={t('Date of birth', 'Kapanganakan')} value={form.dateOfBirth} onEdit={() => setStep(1)} />
              <Row label={t('Email', 'Email')} value={form.email} onEdit={() => setStep(1)} />
              <Row label={t('Mobile', 'Mobile')} value={form.mobileNumber || t('Not given', 'Wala')} onEdit={() => setStep(1)} />
              <Row label={t('Username', 'Username')} value={form.username} onEdit={() => setStep(1)} />
              <Row label={t('Address', 'Tirahan')} value={`${barangay?.name || ''}, ${town?.name || ''}, Zambales`} onEdit={() => setStep(2)} />
              <Row label={t('Valid ID', 'Valid ID')} value={`${idTypeLabel || ''} · ${[files.valid_id_front && t('front', 'harap'), files.valid_id_back && t('back', 'likod'), files.selfie_with_id && 'selfie'].filter(Boolean).join(', ')}`} onEdit={() => setStep(3)} />
            </dl>
            <label className="flex items-start gap-3 text-sm text-slate-800">
              <input type="checkbox" className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-slate-400 text-navy-700" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                {t('I have read and agree to the ', 'Nabasa ko at sumasang-ayon ako sa ')}
                <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer" className="font-medium text-navy-700 underline">{t('Terms of Service', 'Terms of Service')}</Link>
                {t(' and the ', ' at sa ')}
                <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-medium text-navy-700 underline">{t('Privacy Policy', 'Privacy Policy')}</Link>.
              </span>
            </label>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-600" aria-live="polite">
            {draftSaved && step < 4 && t('Draft saved on this device. You can continue later.', 'Naka-save sa device na ito. Maaari mong ituloy mamaya.')}
          </div>
          <div className="flex gap-3">
            {step > 1 && <button type="button" className="btn-secondary" onClick={back}>{t('Back', 'Bumalik')}</button>}
            {step < 4 ? (
              <button type="button" className="btn-primary" onClick={next}>{t('Continue', 'Magpatuloy')}</button>
            ) : (
              <button type="button" className="btn-primary" onClick={submit} disabled={submitting} aria-disabled={submitting}>
                {submitting ? t('Creating account…', 'Ginagawa ang account…') : t('Create account', 'Gumawa ng account')}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-slate-700">
        {t('Already have an account? ', 'May account ka na? ')}
        <Link to="/login" className="font-medium text-navy-700 underline">{t('Log in', 'Mag-log in')}</Link>
      </p>
    </div>
  )
}

function Field({
  id, label, hint, error, required, value, onChange, type = 'text', autoComplete, inputMode,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  inputMode?: 'email' | 'tel' | 'text'
}) {
  const { t } = useLang()
  const inputId = `reg-${id}`
  const describedBy = [hint ? `${inputId}-hint` : '', error ? `${inputId}-error` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-900">
        {label}{' '}
        {required ? <span className="text-red-700" aria-hidden="true">*</span> : <span className="font-normal text-slate-600">({t('optional', 'opsyonal')})</span>}
      </label>
      {hint && <p id={`${inputId}-hint`} className="mt-0.5 text-sm text-slate-600">{hint}</p>}
      <input
        id={inputId}
        type={type}
        className={`input-field mt-1 ${error ? 'input-field-error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        autoComplete={autoComplete}
        inputMode={inputMode}
      />
      {error && <p id={`${inputId}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  const { t } = useLang()
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
      <dt className="text-slate-600">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-slate-900">{value}</dd>
      <button type="button" className="text-sm font-medium text-navy-700 underline" onClick={onEdit}>{t('Edit', 'Baguhin')}</button>
    </div>
  )
}
