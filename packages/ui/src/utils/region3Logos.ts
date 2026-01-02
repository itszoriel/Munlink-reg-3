export type Region3Seal = {
  src: string
  alt: string
  kind: 'municipality' | 'province' | 'fallback'
}

// Region 3 municipality→province map source of truth (used for reliable province fallback)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JSON import is handled by Vite in app builds
import region3Locations from '../../../../data/locations/region3_locations.json'

function normalize(input?: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, ' ')
}

function slugify(input?: string): string {
  return normalize(input)
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

const provinceSlugMap: Record<string, string> = {
  aurora: 'aurora',
  bataan: 'bataan',
  bulacan: 'bulacan',
  'nueva ecija': 'nueva-ecija',
  'nueva-ecija': 'nueva-ecija',
  pampanga: 'pampanga',
  tarlac: 'tarlac',
  zambales: 'zambales',
}

function buildMunicipalityToProvinceSlug(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const data = region3Locations as Record<string, Record<string, unknown>>
    for (const provinceName of Object.keys(data || {})) {
      const provSlug = provinceSlugMap[normalize(provinceName)] || slugify(provinceName)
      const municipalities = Object.keys((data as any)[provinceName] || {})
      for (const m of municipalities) {
        const n = normalize(m)
        const s = slugify(m)
        if (n) out[n] = provSlug
        if (s) out[s] = provSlug
      }
    }
  } catch {
    // ignore – fallback logic will cover
  }
  return out
}

const municipalityToProvinceSlug = buildMunicipalityToProvinceSlug()

function deriveProvinceFromMunicipality(municipality?: string): string | null {
  const raw = normalize(municipality)
  const candidates = [raw, slugify(raw)]
  for (const c of candidates) {
    if (c && municipalityToProvinceSlug[c]) return municipalityToProvinceSlug[c]
  }
  return null
}

// Municipality seals we have available (currently Zambales is complete in repo).
// Keys include both slug and normalized name forms for resilience.
const municipalitySeals: Record<string, string> = {
  // Province fallback (legacy asset kept for Zambales)
  zambales: '/logos/zambales/64px-Seal_of_Province_of_Zambales.svg.png',

  // Zambales municipalities (slug keys)
  botolan: '/logos/municipalities/Botolan/Ph_seal_zambales_botolan.png',
  cabangan: '/logos/municipalities/Cabangan/Cabangan_Zambales_seal.png',
  candelaria: '/logos/municipalities/Candelaria/Candelaria_Zambales_Seal.png',
  castillejos: '/logos/municipalities/Castillejos/Castillejos_Zambales_seal.png',
  iba: '/logos/municipalities/Iba/Iba_Zambales_seal.png',
  masinloc: '/logos/municipalities/Masinloc/Masinloc_Zambales_seal.png',
  palauig: '/logos/municipalities/Palauig/Palauig_Zambales_seal.png',
  'san-antonio': '/logos/municipalities/SanAntonio/SanAntonio,102Zambalesjf.png',
  'san-felipe': '/logos/municipalities/San Felipe/Seal San Felipe.png',
  'san-marcelino': '/logos/municipalities/San Marcelino/smz-logo-256px.png',
  'san-narciso': '/logos/municipalities/San Narciso/san-narciso-seal 256px.png',
  'santa-cruz': '/logos/municipalities/Santa-Cruz/Santa_Cruz_Zambales.png',
  subic: '/logos/municipalities/Subic/subic seal 256px.png',

  // Zambales municipalities (normalized name keys)
  'san antonio': '/logos/municipalities/SanAntonio/SanAntonio,102Zambalesjf.png',
  'san felipe': '/logos/municipalities/San Felipe/Seal San Felipe.png',
  'san marcelino': '/logos/municipalities/San Marcelino/smz-logo-256px.png',
  'san narciso': '/logos/municipalities/San Narciso/san-narciso-seal 256px.png',
  'santa cruz': '/logos/municipalities/Santa-Cruz/Santa_Cruz_Zambales.png',
}

export function getProvinceSealSrc(province?: string): string | null {
  const key = normalize(province)
  const slug = provinceSlugMap[key] || provinceSlugMap[slugify(key)]
  if (!slug) return null
  return `/logos/provinces/${slug}.png`
}

export function getMunicipalitySealSrc(municipality?: string): string | null {
  const raw = normalize(municipality)
  const candidates = [raw, slugify(raw)]
  for (const c of candidates) {
    if (c && municipalitySeals[c]) return municipalitySeals[c]
  }
  return null
}

/**
 * Returns the best seal available:
 * - municipality seal if known (e.g., Masinloc)
 * - otherwise province seal
 * - otherwise a safe fallback (Zambales province seal)
 */
export function getBestRegion3Seal(params: {
  municipality?: string
  province?: string
  fallbackProvince?: string
}): Region3Seal {
  const municipalitySrc = getMunicipalitySealSrc(params.municipality)
  if (municipalitySrc) {
    const name = (params.municipality || '').trim() || 'Municipality'
    return { src: municipalitySrc, alt: `${name} Seal`, kind: 'municipality' }
  }

  const inferredProvince = params.province || deriveProvinceFromMunicipality(params.municipality) || undefined
  const provinceSrc = getProvinceSealSrc(inferredProvince)
  if (provinceSrc) {
    const name = (inferredProvince || '').trim() || 'Province'
    return { src: provinceSrc, alt: `${name} Seal`, kind: 'province' }
  }

  const fallbackProvince = params.fallbackProvince || 'zambales'
  const fallbackSrc = getProvinceSealSrc(fallbackProvince) || '/logos/provinces/zambales.png'
  return { src: fallbackSrc, alt: 'Region 3 Seal', kind: 'fallback' }
}


