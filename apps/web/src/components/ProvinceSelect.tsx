import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore, type Province } from '@/lib/store'
import { provinceApi } from '@/lib/api'

// Province seal mapping
const provinceSealMap: Record<string, string> = {
  'aurora': new URL('../../../../public/logos/provinces/aurora.png', import.meta.url).toString(),
  'bataan': new URL('../../../../public/logos/provinces/bataan.png', import.meta.url).toString(),
  'bulacan': new URL('../../../../public/logos/provinces/bulacan.png', import.meta.url).toString(),
  'nueva-ecija': new URL('../../../../public/logos/provinces/nueva-ecija.png', import.meta.url).toString(),
  'pampanga': new URL('../../../../public/logos/provinces/pampanga.png', import.meta.url).toString(),
  'tarlac': new URL('../../../../public/logos/provinces/tarlac.png', import.meta.url).toString(),
  'zambales': new URL('../../../../public/logos/provinces/zambales.png', import.meta.url).toString(),
}

function getProvinceSeal(slug?: string): string | undefined {
  if (!slug) return undefined
  return provinceSealMap[slug.toLowerCase()]
}

export default function ProvinceSelect() {
  const selected = useAppStore((s) => s.selectedProvince)
  const setProvince = useAppStore((s) => s.setProvince)
  const setMunicipality = useAppStore((s) => s.setMunicipality)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await provinceApi.getAll()
        const data = response?.data
        const list = Array.isArray(data?.provinces) ? data.provinces : []
        setProvinces(list)
      } catch (error) {
        console.error('Failed to load provinces:', error)
        setProvinces([])
      } finally {
        setLoading(false)
      }
    }
    loadProvinces()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('munlink:selectedProvince')
    if (saved) {
      try {
        setProvince(JSON.parse(saved))
      } catch {}
    }
  }, [setProvince])

  const filtered = useMemo(() =>
    provinces.filter(p => p.name.toLowerCase().includes(query.toLowerCase())),
    [provinces, query]
  )

  const selectedSeal = getProvinceSeal(selected?.slug)

  if (loading) {
    return <div className="text-sm text-gray-500">Loading provinces...</div>
  }

  return (
    <div className="relative">
      <details ref={detailsRef} className="group">
        <summary className="list-none cursor-pointer select-none hover:text-ocean-700 font-serif flex items-center gap-2">
          {selectedSeal && (
            <img src={selectedSeal} alt="" className="h-5 w-5 rounded-full object-contain" />
          )}
          {selected ? selected.name : 'Province'} ▾
        </summary>
        <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/50 p-2 z-50">
          <input
            type="text"
            placeholder="Search province..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field mb-2"
          />
          {/* Clear selection option */}
          {selected && (
            <button
              onClick={() => {
                setProvince(undefined)
                setMunicipality(undefined)
                localStorage.removeItem('munlink:selectedProvince')
                localStorage.removeItem('munlink:selectedMunicipality')
                try { if (detailsRef.current) detailsRef.current.open = false } catch {}
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-red-50 text-red-600 text-sm mb-1 border-b"
            >
              ✕ Clear selection (show all Region 3)
            </button>
          )}
          <ul className="max-h-64 overflow-auto">
            {filtered.map(p => {
              const seal = getProvinceSeal(p.slug)
              return (
                <li key={p.id}>
                  <button
                    onClick={() => { 
                      setProvince(p)
                      setMunicipality(undefined) // Clear municipality when province changes
                      localStorage.removeItem('munlink:selectedMunicipality')
                      try { if (detailsRef.current) detailsRef.current.open = false } catch {} 
                    }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-ocean-50 flex items-center gap-3 ${
                      selected?.id === p.id ? 'bg-ocean-100 font-medium' : ''
                    }`}
                  >
                    {seal && (
                      <img src={seal} alt="" className="h-6 w-6 rounded-full object-contain flex-shrink-0" />
                    )}
                    <span>{p.name}</span>
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="text-sm text-gray-500 px-3 py-2">No results</li>
            )}
          </ul>
        </div>
      </details>
    </div>
  )
}





