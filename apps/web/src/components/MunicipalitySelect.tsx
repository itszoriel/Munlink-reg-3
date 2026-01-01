import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore, type Municipality } from '@/lib/store'
import { municipalityApi } from '@/lib/api'

export default function MunicipalitySelect() {
  const selected = useAppStore((s) => s.selectedMunicipality)
  const selectedProvince = useAppStore((s) => s.selectedProvince)
  const setMunicipality = useAppStore((s) => s.setMunicipality)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const loadMunicipalities = async () => {
      setLoading(true)
      try {
        const params = selectedProvince ? { province_id: selectedProvince.id } : {}
        const response = await municipalityApi.getAll(params)
        const data = response?.data
        const list = Array.isArray(data?.municipalities) ? data.municipalities : []
        setMunicipalities(list)
      } catch (error) {
        console.error('Failed to load municipalities:', error)
        setMunicipalities([])
      } finally {
        setLoading(false)
      }
    }
    loadMunicipalities()
  }, [selectedProvince])

  useEffect(() => {
    const saved = localStorage.getItem('munlink:selectedMunicipality')
    if (saved) {
      try {
        setMunicipality(JSON.parse(saved))
      } catch {}
    }
  }, [setMunicipality])

  useEffect(() => {
    if (selected) localStorage.setItem('munlink:selectedMunicipality', JSON.stringify(selected))
  }, [selected])

  const filtered = useMemo(() =>
    municipalities.filter(m => m.name.toLowerCase().includes(query.toLowerCase())),
    [municipalities, query]
  )

  if (loading) {
    return <span className="text-sm text-gray-400 font-serif">Loading...</span>
  }

  if (!selectedProvince) {
    return <span className="text-sm text-gray-400 font-serif cursor-not-allowed" title="Select a province first">Municipality ▾</span>
  }

  return (
    <div className="relative">
      <details ref={detailsRef} className="group">
        <summary className="list-none cursor-pointer select-none hover:text-ocean-700 font-serif whitespace-nowrap">
          {selected ? selected.name : 'Municipality'} ▾
        </summary>
        <div className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/50 p-2 z-50">
          <input
            type="text"
            placeholder="Search municipality..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field mb-2"
          />
          <ul className="max-h-64 overflow-auto">
            {filtered.map(m => (
              <li key={m.id}>
                <button
                  onClick={() => { setMunicipality(m); try { if (detailsRef.current) detailsRef.current.open = false } catch {} }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-ocean-50"
                >
                  {m.name}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-sm text-gray-500 px-3 py-2">No results</li>
            )}
          </ul>
        </div>
      </details>
    </div>
  )
}


