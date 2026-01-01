import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'

const provinces = ['aurora', 'bataan', 'bulacan', 'nueva-ecija', 'pampanga', 'tarlac', 'zambales'];

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
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

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="card max-w-md w-full">
        {/* Province seals row */}
        <div className="w-full flex justify-center gap-1.5 pt-6 pb-2">
          {provinces.map((province) => (
            <img
              key={province}
              src={`/logos/provinces/${province}.png`}
              alt={`${province} Seal`}
              className="h-8 w-8 object-contain opacity-80 hover:opacity-100 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ))}
        </div>
        
        <h2 className="text-fluid-3xl font-serif font-semibold text-center mb-2 text-gray-900">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Sign in to MunLink Region 3
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username or Email</label>
            <input
              type="text"
              className="input-field"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              autoComplete="username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center mt-4 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-ocean-600 hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
