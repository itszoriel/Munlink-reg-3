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

// ============================================================================
// Municipality Seals for Region 3
// ============================================================================
// New consistent path structure: /logos/municipalities/{province-slug}/{municipality-slug}/{filename}
// Keys include both slug and normalized name forms for resilience.

const municipalitySeals: Record<string, string> = {
  // ==========================================
  // ZAMBALES PROVINCE
  // ==========================================
  botolan: '/logos/municipalities/zambales/botolan/Ph_seal_zambales_botolan.png',
  cabangan: '/logos/municipalities/zambales/cabangan/Cabangan_Zambales_seal.png',
  candelaria: '/logos/municipalities/zambales/candelaria/Candelaria_Zambales_Seal.png',
  castillejos: '/logos/municipalities/zambales/castillejos/Castillejos_Zambales_seal.png',
  iba: '/logos/municipalities/zambales/iba/Iba_Zambales_seal.png',
  masinloc: '/logos/municipalities/zambales/masinloc/Masinloc_Zambales_seal.png',
  olongapo: '/logos/municipalities/zambales/city-of-olongapo/Olongapo_Seal.png',
  'city of olongapo': '/logos/municipalities/zambales/city-of-olongapo/Olongapo_Seal.png',
  'city-of-olongapo': '/logos/municipalities/zambales/city-of-olongapo/Olongapo_Seal.png',
  palauig: '/logos/municipalities/zambales/palauig/Palauig_Zambales_seal.png',
  'san antonio zambales': '/logos/municipalities/zambales/san-antonio/SanAntonio,102Zambalesjf.png',
  'san-antonio-zambales': '/logos/municipalities/zambales/san-antonio/SanAntonio,102Zambalesjf.png',
  'san felipe': '/logos/municipalities/zambales/san-felipe/Seal San Felipe.png',
  'san-felipe': '/logos/municipalities/zambales/san-felipe/Seal San Felipe.png',
  'san marcelino': '/logos/municipalities/zambales/san-marcelino/smz-logo-256px.png',
  'san-marcelino': '/logos/municipalities/zambales/san-marcelino/smz-logo-256px.png',
  'san narciso': '/logos/municipalities/zambales/san-narciso/san-narciso-seal 256px.png',
  'san-narciso': '/logos/municipalities/zambales/san-narciso/san-narciso-seal 256px.png',
  'santa cruz': '/logos/municipalities/zambales/santa-cruz/Santa_Cruz_Zambales.png',
  'santa-cruz': '/logos/municipalities/zambales/santa-cruz/Santa_Cruz_Zambales.png',
  'sta cruz': '/logos/municipalities/zambales/santa-cruz/Santa_Cruz_Zambales.png',
  'sta-cruz': '/logos/municipalities/zambales/santa-cruz/Santa_Cruz_Zambales.png',
  subic: '/logos/municipalities/zambales/subic/subic seal 256px.png',
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
  // First try province-qualified lookup if province is provided
  let municipalitySrc: string | null = null
  if (params.municipality && params.province) {
    const provSlug = provinceSlugMap[normalize(params.province)] || slugify(params.province)
    const munRaw = normalize(params.municipality)
    const munSlug = slugify(params.municipality)
    // Try province-qualified keys first
    const qualifiedCandidates = [
      `${munRaw} ${provSlug}`,
      `${munSlug}-${provSlug}`,
    ]
    for (const c of qualifiedCandidates) {
      if (c && municipalitySeals[c]) {
        municipalitySrc = municipalitySeals[c]
        break
      }
    }
  }
  
  // Fall back to generic lookup if province-qualified didn't work
  if (!municipalitySrc) {
    municipalitySrc = getMunicipalitySealSrc(params.municipality)
  }
  
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
