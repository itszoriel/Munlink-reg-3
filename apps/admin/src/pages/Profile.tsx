import { useEffect, useState } from 'react'
import { useAdminStore } from '../lib/store'
import { authApi, mediaUrl, showToast } from '../lib/api'

export default function Profile() {
  const storeUser = useAdminStore((s) => s.user)
  const updateUser = useAdminStore((s) => s.updateUser)
  const [user, setUser] = useState<any>(storeUser)
  const [form, setForm] = useState<{ first_name: string; middle_name?: string; last_name: string }>(
    { first_name: storeUser?.first_name || '', middle_name: storeUser?.middle_name || '', last_name: storeUser?.last_name || '' }
  )
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await authApi.getProfile()
        const u = (res as any)?.data || res
        setUser(u)
        setForm({ first_name: u.first_name || '', middle_name: u.middle_name || '', last_name: u.last_name || '' })
        updateUser(u)
      } catch {}
    })()
  }, [updateUser])

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
        {/* Header with photo */}
        <div className="flex flex-col items-center text-center mb-8">
          {user?.profile_picture ? (
            <img src={mediaUrl(user.profile_picture)} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-ocean-100" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-700 text-3xl font-semibold mb-4">
              {(user?.first_name?.[0] || 'A')}{(user?.last_name?.[0] || '')}
            </div>
          )}
          <h2 className="text-xl font-semibold text-neutral-900">{user?.first_name} {user?.last_name}</h2>
          <p className="text-neutral-600 text-sm">{user?.email}</p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocean-50 text-ocean-700 text-xs font-medium">
            <span className="capitalize">{user?.role || 'Admin'}</span>
            <span className="text-ocean-300">•</span>
            <span>{user?.admin_municipality_name || user?.municipality_name || 'Unassigned'}</span>
          </div>
          
          {/* Photo upload */}
          <div className="mt-4 flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm transition">
              Change Photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile((e.target.files && e.target.files[0]) || null)} />
            </label>
            {file && (
              <button
                className="px-3 py-1.5 rounded-lg bg-ocean-600 hover:bg-ocean-700 text-white text-sm"
                onClick={async () => {
                  try {
                    const res = await authApi.uploadProfilePhoto(file)
                    const u = (res as any)?.data?.user || (res as any)?.user || res
                    setUser(u)
                    updateUser(u)
                    setFile(null)
                    showToast('Photo updated', 'success')
                  } catch (e: any) {
                    showToast(e?.response?.data?.error || 'Upload failed', 'error')
                  }
                }}
              >Upload</button>
            )}
          </div>
        </div>

        {/* Edit name form */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 border-b pb-2">Edit Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-neutral-500">First name</span>
              <input className="input-field mt-1" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">Middle name</span>
              <input className="input-field mt-1" value={form.middle_name || ''} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">Last name</span>
              <input className="input-field mt-1" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end pt-2">
            <button
              className="px-5 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-60 text-sm font-medium"
              disabled={saving || !form.first_name || !form.last_name}
              onClick={async () => {
                setSaving(true)
                try {
                  const res = await authApi.updateProfile({ first_name: form.first_name, middle_name: form.middle_name, last_name: form.last_name })
                  const u = (res as any)?.data?.user || (res as any)?.user || res
                  setUser(u)
                  updateUser(u)
                  showToast('Profile updated', 'success')
                } catch (e: any) {
                  showToast(e?.response?.data?.error || 'Update failed', 'error')
                } finally {
                  setSaving(false)
                }
              }}
            >{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
