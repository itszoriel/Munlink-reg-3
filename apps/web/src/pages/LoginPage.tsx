import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Eye, EyeOff, User, Lock, MapPin, Users, FileText, ShoppingBag } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
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
      
      // Only allow residents to log in via web portal
      if (user?.role === 'admin' || user?.role === 'municipal_admin') {
        setError('This account is for administrative use only. Please log in via the Admin Portal.')
      } else {
        setAuth(user, access_token, refresh_token)
        navigate('/dashboard')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Login failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const features = [
    { icon: FileText, label: 'Documents and certificates', desc: 'Request them online and track their status' },
    { icon: ShoppingBag, label: 'Community marketplace', desc: 'Sell, lend or give away items locally' },
    { icon: Users, label: 'Benefit programs', desc: 'Apply for municipal assistance' },
    { icon: MapPin, label: 'All 13 municipalities', desc: 'From Santa Cruz to Subic' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left panel: plain context, no decoration */}
      <div className="hidden lg:flex lg:w-1/2 relative isolate overflow-hidden bg-navy-900">
        <img
          src="/assets/resident_login.jpg"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-navy-950/80" aria-hidden="true" />
        <div className="flex w-full flex-col justify-center px-12 xl:px-16">
          <div className="flex items-center gap-3">
            <img src="/logos/munlink-logo.png" alt="" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="text-lg font-semibold text-white">MunLink Zambales</p>
              <p className="text-sm text-slate-300">Province of Zambales</p>
            </div>
          </div>
          <h1 className="mt-10 max-w-md text-3xl font-semibold leading-tight text-white">
            Your municipal and barangay services in one account
          </h1>
          <ul className="mt-8 max-w-md space-y-4">
            {features.map((feature) => (
              <li key={feature.label} className="flex gap-3">
                <feature.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy-200" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-white">{feature.label}</p>
                  <p className="text-sm text-slate-300">{feature.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/logos/munlink-logo.png"
                alt=""
                className="h-16 w-16 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">MunLink Zambales</h1>
            <p className="text-gray-600 text-sm">Province of Zambales</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Log in
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Use your MunLink username or email.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter your username or email"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end text-sm">
                <Link
                  to="/forgot-password"
                  className="text-ocean-600 hover:text-ocean-700 font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-ocean-700 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed "
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Log in'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-ocean-600 hover:text-ocean-700 font-semibold hover:underline">
                Create one here
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in, you agree to MunLink's{' '}
            <Link to="/terms-of-service" state={{ from: '/login' }} className="text-ocean-600 hover:text-ocean-700 underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to="/privacy-policy" state={{ from: '/login' }} className="text-ocean-600 hover:text-ocean-700 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
