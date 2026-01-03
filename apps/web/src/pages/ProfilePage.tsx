import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { authApi, mediaUrl, transferApi, showToast, municipalityApi } from '@/lib/api'
import { ProfileCard, Form, FormField, Input, Button } from '@munlink/ui'
import { getProvinces, getMunicipalities } from '@/lib/locations'

type Profile = {
  first_name?: string
  last_name?: string
  username?: string
  email?: string
  phone?: string
  profile_picture?: string
  province_id?: number
  province_name?: string
  municipality_id?: number
  municipality_name?: string
  barangay_id?: number
  barangay_name?: string
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [form, setForm] = useState<Profile>({})
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferOk, setTransferOk] = useState<string | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferForm, setTransferForm] = useState({ province_id: '', to_municipality_id: '', notes: '' })
  const [barangays, setBarangays] = useState<any[]>([])

  // Static province and municipality data
  const provinces = getProvinces()
  const transferMunicipalities = transferForm.province_id 
    ? getMunicipalities(Number(transferForm.province_id)) 
    : []

  // Compute the full address from location parts
  const fullAddress = [
    form.barangay_name ? `Brgy. ${form.barangay_name}` : null,
    form.municipality_name,
    form.province_name
  ].filter(Boolean).join(', ')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [profileRes, muniRes] = await Promise.all([
          authApi.getProfile(),
          municipalityApi.getAll().then(r => r.data)
        ])
        const data = (profileRes as any).data || profileRes
        // Find province from municipality
        const userMuni = (muniRes.municipalities || []).find((m: any) => m.id === data.municipality_id)
        const provinceName = userMuni?.province_name || ''
        const provinceId = userMuni?.province_id
        if (!cancelled) {
          setForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            username: data.username || '',
            email: data.email || '',
            phone: data.phone_number || '',
            profile_picture: data.profile_picture || '',
            province_id: provinceId,
            province_name: provinceName,
            municipality_id: data.municipality_id,
            municipality_name: data.municipality_name,
            barangay_id: data.barangay_id,
            barangay_name: data.barangay_name,
          })
          if (data.municipality_id) {
            try {
              const resB = await municipalityApi.getBarangays(data.municipality_id)
              setBarangays(resB.data?.barangays || [])
            } catch { setBarangays([]) }
          }
        }
      } catch (e: any) {
        if (!cancelled) setError('Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setOk(null)
    try {
      const payload: any = {
        first_name: form.first_name,
        last_name: form.last_name,
      }
      if (form.username) payload.username = form.username
      if (form.email) payload.email = form.email
      if (form.phone !== undefined) payload.phone_number = form.phone
      if (form.barangay_id) payload.barangay_id = form.barangay_id
      await authApi.updateProfile(payload)
      setOk('Profile updated')
      showToast('Profile updated successfully', 'success')
    } catch (e: any) {
      setError('Failed to update profile')
      showToast('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferForm.to_municipality_id) {
      setTransferError('Please select a municipality')
      return
    }
    setTransferring(true)
    setTransferError(null)
    setTransferOk(null)
    try {
      await transferApi.request(Number(transferForm.to_municipality_id), transferForm.notes)
      setTransferOk('Transfer request submitted successfully')
      setShowTransferModal(false)
      setTransferForm({ province_id: '', to_municipality_id: '', notes: '' })
      showToast('Transfer request submitted successfully', 'success')
    } catch (e: any) {
      setTransferError(e?.response?.data?.error || 'Failed to submit transfer request')
      showToast(e?.response?.data?.error || 'Failed to submit transfer request', 'error')
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="container-responsive py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <ProfileCard
          role="resident"
          name={`${form.first_name || ''} ${form.last_name || ''}`.trim() || (form.username || 'My Profile')}
          email={form.email}
          phone={form.phone}
          avatarUrl={form.profile_picture ? mediaUrl(form.profile_picture) : undefined}
          editable={false}
        />
        {error && <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
        {ok && <div className="rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{ok}</div>}

        {/* Location / Address Section */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Your Address</h3>
          <div className="bg-ocean-50 rounded-lg p-4 border border-ocean-200 mb-4">
            <div className="text-sm font-medium text-ocean-800 mb-1">Current Address</div>
            <div className="text-ocean-900 font-semibold">
              {fullAddress || 'No address set - please complete your location details'}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <input 
                type="text" 
                value={form.province_name || ''} 
                disabled 
                className="input-field bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
              <input 
                type="text" 
                value={form.municipality_name || ''} 
                disabled 
                className="input-field bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
              <select
                value={form.barangay_id || ''}
                onChange={(e) => {
                  const selectedId = Number(e.target.value || '0') || undefined
                  const selectedBarangay = barangays.find(b => b.id === selectedId)
                  setForm((f) => ({ 
                    ...f, 
                    barangay_id: selectedId,
                    barangay_name: selectedBarangay?.name || ''
                  }))
                }}
                disabled={loading || saving || !form.municipality_id}
                className="input-field"
              >
                <option value="">Select barangay</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {!form.barangay_id && (
                <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1 mt-1">
                  Please select your barangay to request documents.
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
            <div>
              <Button 
                onClick={async () => {
                  if (!form.barangay_id) {
                    showToast('Please select a barangay', 'error')
                    return
                  }
                  setSaving(true)
                  setError(null)
                  setOk(null)
                  try {
                    await authApi.updateProfile({ barangay_id: form.barangay_id })
                    setOk('Address updated successfully')
                    showToast('Address updated successfully', 'success')
                  } catch (e: any) {
                    setError('Failed to update address')
                    showToast('Failed to update address', 'error')
                  } finally {
                    setSaving(false)
                  }
                }} 
                disabled={saving || loading || !form.barangay_id}
              >
                {saving ? 'Saving...' : 'Save Barangay'}
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              <span>Need to move to a different municipality or province? </span>
              <button 
                type="button"
                onClick={() => setShowTransferModal(true)} 
                className="text-ocean-600 hover:text-ocean-700 font-medium underline"
              >
                Request a transfer
              </button>
            </div>
          </div>
        </div>

        {/* Personal Info Form */}
        <Form onSubmit={onSubmit} className="max-w-2xl" columns={2}>
          <FormField label="First name">
            <Input name="first_name" value={form.first_name || ''} onChange={onChange} disabled={loading || saving} />
          </FormField>
          <FormField label="Last name">
            <Input name="last_name" value={form.last_name || ''} onChange={onChange} disabled={loading || saving} />
          </FormField>
          <FormField label="Username">
            <Input name="username" value={form.username || ''} onChange={onChange} disabled={loading || saving} />
          </FormField>
          <FormField label="Email">
            <Input name="email" type="email" value={form.email || ''} onChange={onChange} disabled={loading || saving} />
          </FormField>
          <FormField label="Phone">
            <Input name="phone" value={form.phone || ''} onChange={onChange} disabled={loading || saving} />
          </FormField>
          <div className="col-span-full">
            <Button type="submit" disabled={saving || loading}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </Form>
      </div>

      {/* Transfer Modal with Province Selection */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Request Location Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select your new province and municipality. This will require approval from your current admin and acceptance by the new municipality.
            </p>
            {transferError && <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{transferError}</div>}
            {transferOk && <div className="mb-4 rounded-md border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{transferOk}</div>}
            <form onSubmit={handleTransferSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Target Province</label>
                <select
                  value={transferForm.province_id}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, province_id: e.target.value, to_municipality_id: '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select province</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Target Municipality</label>
                <select
                  value={transferForm.to_municipality_id}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, to_municipality_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!transferForm.province_id}
                  required
                >
                  <option value="">{transferForm.province_id ? 'Select municipality' : 'Select province first'}</option>
                  {transferMunicipalities.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Reason for transfer..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={transferring}>
                  {transferring ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
