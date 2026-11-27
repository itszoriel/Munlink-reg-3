import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CitizensCharter from '@/components/CitizensCharter'
import { getMunicipalityBySlug } from '@/lib/locations'
import { useAppStore } from '@/lib/store'

/**
 * Public Citizen's Charter: every online document per town, no login needed.
 * `/services?town=<slug>` opens a town directly, so an office can share a link
 * to its own list (for example /services?town=iba).
 */
export default function ServicesPage() {
  const [params] = useSearchParams()
  const setMunicipality = useAppStore((s) => s.setMunicipality)
  const townSlug = params.get('town')

  useEffect(() => {
    if (!townSlug) return
    const slug = townSlug.toLowerCase()
    const town = getMunicipalityBySlug(slug) || getMunicipalityBySlug(`${slug}-zambales`)
    if (town) setMunicipality(town)
  }, [townSlug, setMunicipality])

  return (
    <div className="bg-white">
      <div className="container-responsive py-10 sm:py-14">
        <CitizensCharter headingLevel="h1" />
      </div>
    </div>
  )
}
