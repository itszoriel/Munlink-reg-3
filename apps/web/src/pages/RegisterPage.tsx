import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { authApi, municipalityApi } from '@/lib/api'
import { getProvinces, getMunicipalities } from '@/lib/locations'

// Province seals for visual feedback (use absolute paths from public folder)
const provinceSealMap: Record<string, string> = {
  'aurora': '/logos/provinces/aurora.png',
  'bataan': '/logos/provinces/bataan.png',
  'bulacan': '/logos/provinces/bulacan.png',
  'nueva-ecija': '/logos/provinces/nueva-ecija.png',
  'pampanga': '/logos/provinces/pampanga.png',
  'tarlac': '/logos/provinces/tarlac.png',
  'zambales': '/logos/provinces/zambales.png',
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    province: '',
    municipality: '',
    barangay_id: ''
  })
  const [uploads, setUploads] = useState<{ profile_picture?: File | null; valid_id_front?: File | null; valid_id_back?: File | null }>({})
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [barangays, setBarangays] = useState<{ id: number; name: string }[]>([])
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Use static data - instant load, no API call needed!
  const provinces = useMemo(() => getProvinces(), [])
  const municipalities = useMemo(
    () => formData.province ? getMunicipalities(Number(formData.province)) : [],
    [formData.province]
  )

  // Get the selected province seal
  const selectedProvince = provinces.find(p => p.id === Number(formData.province))
  const provinceSeal = selectedProvince?.slug ? provinceSealMap[selectedProvince.slug] : null

  // Reset municipality and barangay when province changes
  useEffect(() => {
    setFormData(f => ({ ...f, municipality: '', barangay_id: '' }))
    setBarangays([])
  }, [formData.province])

  // Load barangays when a municipality is selected
  useEffect(() => {
    const loadBarangays = async () => {
      try {
        setBarangays([])
        setFormData((f) => ({ ...f, barangay_id: '' }))
        const mun = municipalities.find(m => m.slug === formData.municipality)
        if (!mun) return
        const res = await municipalityApi.getBarangays(mun.id)
        const list = Array.isArray(res.data?.barangays) ? res.data.barangays : []
        setBarangays(list.map((b: any) => ({ id: b.id, name: b.name })))
      } catch (e) {
        setBarangays([])
      }
    }
    if (formData.municipality) {
      loadBarangays()
    } else {
      setBarangays([])
      setFormData((f) => ({ ...f, barangay_id: '' }))
    }
  }, [formData.municipality, municipalities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to create an account')
      return
    }
    
    setSubmitting(true)
    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Password confirmation does not match')
        setSubmitting(false)
        return
      }
      const payload: any = {
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        first_name: formData.firstName,
        middle_name: formData.middleName || undefined,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        municipality_slug: formData.municipality,
      }
      if (formData.barangay_id) payload.barangay_id = Number(formData.barangay_id)
      const res = await authApi.register(payload, {
        profile_picture: uploads.profile_picture || undefined,
        valid_id_front: uploads.valid_id_front || undefined,
        valid_id_back: uploads.valid_id_back || undefined,
      })
      setSuccess(res.data.message || 'Registration successful. Please check your Gmail to verify your email.')
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registration failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-12 px-4">
      <div className="card max-w-2xl mx-auto">
        <div className="w-full flex justify-center pt-6">
          {provinceSeal ? (
            <img
              src={provinceSeal}
              alt={`${selectedProvince?.name} Seal`}
              className="h-16 w-16 object-contain opacity-90 transition-all duration-300"
            />
          ) : (
            <div className="flex gap-1">
              {Object.entries(provinceSealMap).slice(0, 7).map(([slug, src]) => (
                <img
                  key={slug}
                  src={src}
                  alt={`${slug} seal`}
                  className="h-8 w-8 object-contain opacity-60"
                />
              ))}
            </div>
          )}
        </div>
        <h2 className="text-fluid-3xl font-serif font-semibold text-center mb-2 text-ocean-700">
          Create Account
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Join MunLink Region III — serving 7 provinces across Central Luzon
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
          {success && <div className="rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input-field"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Middle Name <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                className="input-field"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input-field"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Username <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(This must be unique and will be used to login)</span></label>
            <input
              type="text"
              className="input-field"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-2 grid place-items-center text-gray-500" onClick={() => setShowPassword(v => !v)}>
                  {/* eye icon */}
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18"/><path d="M10.58 10.58a2 2 0 102.83 2.83"/><path d="M16.68 16.68A8.5 8.5 0 0112 18.5c-5 0-9-4.5-9-6.5a11.77 11.77 0 013.33-3.87"/><path d="M9.88 5.09A8.5 8.5 0 0112 4.5c5 0 9 4.5 9 6.5a11.77 11.77 0 01-2.3 3.2"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="input-field pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button type="button" aria-label={showConfirm ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-2 grid place-items-center text-gray-500" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18"/><path d="M10.58 10.58a2 2 0 102.83 2.83"/><path d="M16.68 16.68A8.5 8.5 0 0112 18.5c-5 0-9-4.5-9-6.5a11.77 11.77 0 013.33-3.87"/><path d="M9.88 5.09A8.5 8.5 0 0112 4.5c5 0 9 4.5 9 6.5a11.77 11.77 0 01-2.3 3.2"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center gap-4">
              <button type="button" className="relative h-20 w-20 rounded-full overflow-hidden border bg-gray-100" onClick={() => document.getElementById('profile-upload')?.click()}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-xs text-gray-500">Profile</span>
                )}
              </button>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Profile Photo</label>
                <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={(e)=>{
                  const f = e.target.files?.[0]||null
                  setUploads({...uploads, profile_picture:f})
                  if (f) setPreviewUrl(URL.createObjectURL(f))
                }} />
                <p className="text-xs text-gray-500">This appears on your profile and marketplace posts.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valid ID (Front) <span className="text-red-500">*</span></label>
                <input type="file" accept="image/*" className="input-field" onChange={(e)=>setUploads({...uploads, valid_id_front:e.target.files?.[0]||null})} required />
                {uploads.valid_id_front && (<img className="mt-2 h-24 w-auto rounded border" src={URL.createObjectURL(uploads.valid_id_front)} alt="Valid ID Front" />)}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valid ID (Back) <span className="text-red-500">*</span></label>
                <input type="file" accept="image/*" className="input-field" onChange={(e)=>setUploads({...uploads, valid_id_back:e.target.files?.[0]||null})} required />
                {uploads.valid_id_back && (<img className="mt-2 h-24 w-auto rounded border" src={URL.createObjectURL(uploads.valid_id_back)} alt="Valid ID Back" />)}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="input-field"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
            />
          </div>
          
          {/* Location Section */}
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Province <span className="text-red-500">*</span></label>
                <select
                  className="input-field"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  required
                >
                  <option value="">Select province</option>
                  {provinces.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Municipality <span className="text-red-500">*</span></label>
                <select
                  className="input-field"
                  value={formData.municipality}
                  onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                  disabled={!formData.province}
                  required
                >
                  <option value="">
                    {!formData.province ? 'Select province first' : 'Select municipality'}
                  </option>
                  {municipalities.map((mun) => (
                    <option key={mun.id} value={mun.slug}>
                      {mun.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Barangay <span className="text-gray-400">(optional)</span></label>
                <select
                  className="input-field"
                  value={formData.barangay_id}
                  onChange={(e) => setFormData({ ...formData, barangay_id: e.target.value })}
                  disabled={!formData.municipality || barangays.length === 0}
                >
                  <option value="">Select barangay</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Terms and Privacy Agreement */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
                required
              />
              <label htmlFor="agree-terms" className="text-sm text-gray-700 cursor-pointer">
                I have read and agree to the{' '}
                <Link to="/terms-of-service" state={{ from: '/register' }} className="text-ocean-600 hover:text-ocean-700 font-semibold underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy-policy" state={{ from: '/register' }} className="text-ocean-600 hover:text-ocean-700 font-semibold underline">
                  Privacy Policy
                </Link>
                . <span className="text-red-500">*</span>
              </label>
            </div>
            <p className="text-xs text-gray-600 ml-7">
              By creating an account, you acknowledge that you understand and accept our Terms of Service and Privacy Policy. 
              Please read them carefully before proceeding.
            </p>
          </div>
          
          <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={submitting || !agreedToTerms}>
            {submitting ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        
        <p className="text-center mt-4 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}

