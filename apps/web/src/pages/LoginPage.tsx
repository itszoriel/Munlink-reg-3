import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Eye, EyeOff } from 'lucide-react'
import { useLang } from '@/lib/i18n'

// A real Zambales landmark, loaded only where the panel is shown (desktop).
const PANEL_PHOTO = '/landmarks/zambales/masinloc/masinloc_church.webp'
// 1x1 transparent GIF so phones never download the panel photo.
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

export default function LoginPage() {
  const { t } = useLang()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAppStore((s) => s.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await authApi.login({ username: formData.username, password: formData.password })
      const { access_token, refresh_token, user } = res.data
      // Only residents log in through the resident site.
      if (user?.role === 'admin' || user?.role === 'municipal_admin') {
        setError(t('This is a staff account. Use the staff portal to log in.', 'Account ito ng kawani. Gamitin ang staff portal para mag-log in.'))
      } else {
        setAuth(user, access_token, refresh_token)
        navigate('/dashboard')
      }
    } catch (err: any) {
      const status = err?.response?.status
      const msg = err?.response?.data?.error
      setError(
        status === 401
          ? t('That username or password is not correct.', 'Mali ang username o password.')
          : msg || t('Could not log in. Check your connection and try again.', 'Hindi makapag-log in. Suriin ang koneksyon at subukang muli.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop context panel: a Zambales landmark, text on a solid band */}
      <div className="relative hidden flex-col justify-end overflow-hidden bg-navy-900 lg:flex lg:w-1/2">
        <picture>
          <source media="(min-width: 1024px)" srcSet={PANEL_PHOTO} />
          <img src={BLANK} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
        <div className="relative bg-navy-950/90 px-12 py-10 xl:px-16">
          <p className="text-2xl font-semibold leading-snug text-white">
            {t('One account for your barangay and municipal requests', 'Isang account para sa mga kahilingan sa barangay at munisipyo')}
          </p>
          <p className="mt-2 text-sm text-navy-100">
            {t('Photo: Masinloc Church, Masinloc, Zambales', 'Larawan: Simbahan ng Masinloc, Masinloc, Zambales')}
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <img src="/logos/provinces/zambales.png" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{t('Log in', 'Mag-log in')}</h1>
              <p className="text-sm text-slate-600">MunLink Zambales</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="login-username" className="block text-sm font-medium text-slate-900">
                  {t('Username or Gmail address', 'Username o Gmail address')}
                </label>
                <input
                  id="login-username"
                  type="text"
                  className="input-field mt-1"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="login-password" className="block text-sm font-medium text-slate-900">{t('Password', 'Password')}</label>
                  <Link to="/forgot-password" className="text-sm font-medium text-navy-700 underline">{t('Forgot password?', 'Nakalimutan ang password?')}</Link>
                </div>
                <div className="relative mt-1">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-12"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-600 hover:text-slate-900"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('Hide password', 'Itago ang password') : t('Show password', 'Ipakita ang password')}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? t('Logging in…', 'Nagla-log in…') : t('Log in', 'Mag-log in')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-700">
              {t('No account yet? ', 'Wala pang account? ')}
              <Link to="/register" className="font-medium text-navy-700 underline">{t('Create an account', 'Gumawa ng account')}</Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            {t('By logging in, you agree to the ', 'Sa pag-log in, sumasang-ayon ka sa ')}
            <Link to="/terms-of-service" state={{ from: '/login' }} className="text-navy-700 underline">{t('Terms of Service', 'Terms of Service')}</Link>
            {t(' and ', ' at ')}
            <Link to="/privacy-policy" state={{ from: '/login' }} className="text-navy-700 underline">{t('Privacy Policy', 'Privacy Policy')}</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
