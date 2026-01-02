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

// Municipality seals for all Region 3 provinces.
// Keys include both slug and normalized name forms for resilience.
const municipalitySeals: Record<string, string> = {
  // ==========================================
  // AURORA PROVINCE
  // ==========================================
  baler: '/logos/Aurora Province/Municipalities of Aurora Province/Ph_seal_aurora_baler.png',
  casiguran: '/logos/Aurora Province/Municipalities of Aurora Province/Seal_of_Casiguran_Aurora.png',
  dilasag: '/logos/Aurora Province/Municipalities of Aurora Province/Dilasag.png',
  dinalungan: '/logos/Aurora Province/Municipalities of Aurora Province/Dinalungan.png',
  dingalan: '/logos/Aurora Province/Municipalities of Aurora Province/Dingalan.png',
  dipaculao: '/logos/Aurora Province/Municipalities of Aurora Province/Dipaculao.png',
  'maria aurora': '/logos/Aurora Province/Municipalities of Aurora Province/Maria_Aurora (1).png',
  'maria-aurora': '/logos/Aurora Province/Municipalities of Aurora Province/Maria_Aurora (1).png',
  'san luis': '/logos/Aurora Province/Municipalities of Aurora Province/San Luis.png',
  'san-luis': '/logos/Aurora Province/Municipalities of Aurora Province/San Luis.png',

  // ==========================================
  // BATAAN PROVINCE
  // ==========================================
  abucay: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Abucay_Bataan.png',
  bagac: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Bagac_Bataan.png',
  dinalupihan: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Dinalupihan_Bataan.png',
  hermosa: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Hermosa_Bataan.png',
  limay: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Limay_Bataan.png',
  mariveles: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/LGULOGO2018240X240.png',
  morong: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Morong_Bataan.png',
  orani: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Orani_Bataan.png',
  orion: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Orion_Bataan.png',
  pilar: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Pilar_Bataan.png',
  samal: '/logos/Bataan Seal & Flag/Bataan Seal & Flag/Samal_Bataan.png',

  // ==========================================
  // BULACAN PROVINCE
  // ==========================================
  angat: '/logos/Bulacan/Bulacan/Municipalities/Angat_Bulacan.png',
  balagtas: '/logos/Bulacan/Bulacan/Municipalities/Balagtas.png',
  baliuag: '/logos/Bulacan/Bulacan/Municipalities/Ph_seal_bulacan_baliuag.png',
  bocaue: '/logos/Bulacan/Bulacan/Municipalities/Bocaue_Bulacan.png',
  bulakan: '/logos/Bulacan/Bulacan/Municipalities/1280px-Seal_of_Bulakan.png',
  bustos: '/logos/Bulacan/Bulacan/Municipalities/Official_Seal_of_Bustos,_Bulacan_(2010-Smaller_Size).png',
  calumpit: '/logos/Bulacan/Bulacan/Municipalities/Calumpit_Bulacan.png',
  'dona remedios trinidad': '/logos/Bulacan/Bulacan/Municipalities/Doña Remedios Trinidad.png',
  'dona-remedios-trinidad': '/logos/Bulacan/Bulacan/Municipalities/Doña Remedios Trinidad.png',
  drt: '/logos/Bulacan/Bulacan/Municipalities/Doña Remedios Trinidad.png',
  guiguinto: '/logos/Bulacan/Bulacan/Municipalities/Guiguinto.png',
  hagonoy: '/logos/Bulacan/Bulacan/Municipalities/Hagonoy_Bulacan.png',
  malolos: '/logos/Bulacan/Bulacan/Municipalities/Ph_seal_bulacan_malolos.png',
  marilao: '/logos/Bulacan/Bulacan/Municipalities/Marilao_Bulacan.png',
  meycauayan: '/logos/Bulacan/Bulacan/Municipalities/City_of_Meycauayan_Seal.png',
  norzagaray: '/logos/Bulacan/Bulacan/Municipalities/Norzagaray_Bulacan.png',
  obando: '/logos/Bulacan/Bulacan/Municipalities/Obando_Bulacan.png',
  pandi: '/logos/Bulacan/Bulacan/Municipalities/Pandi_Bulacan.png',
  paombong: '/logos/Bulacan/Bulacan/Municipalities/Paombong_Bulacan.png',
  plaridel: '/logos/Bulacan/Bulacan/Municipalities/Plaridel_Bulacan.png',
  pulilan: '/logos/Bulacan/Bulacan/Municipalities/Pulilan_Bulacan_Official_Logo.png',
  'san ildefonso': '/logos/Bulacan/Bulacan/Municipalities/San_Ildefonso_Bulacan.png',
  'san-ildefonso': '/logos/Bulacan/Bulacan/Municipalities/San_Ildefonso_Bulacan.png',
  'san jose del monte': '/logos/Bulacan/Bulacan/Municipalities/Ph_seal_bulacan_sanjose.png',
  'san-jose-del-monte': '/logos/Bulacan/Bulacan/Municipalities/Ph_seal_bulacan_sanjose.png',
  'san miguel': '/logos/Bulacan/Bulacan/Municipalities/San_Miguel_Bulacan.png',
  'san-miguel': '/logos/Bulacan/Bulacan/Municipalities/San_Miguel_Bulacan.png',
  'san rafael': '/logos/Bulacan/Bulacan/Municipalities/San_Rafael_Bulacan.png',
  'san-rafael': '/logos/Bulacan/Bulacan/Municipalities/San_Rafael_Bulacan.png',
  'santa maria': '/logos/Bulacan/Bulacan/Municipalities/Ph_seal_bulacan_santamaria.png',
  'santa-maria': '/logos/Bulacan/Bulacan/Municipalities/Ph_seal_bulacan_santamaria.png',

  // ==========================================
  // NUEVA ECIJA PROVINCE
  // ==========================================
  aliaga: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Aliaga_Nueva_Ecija.png',
  bongabon: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Bongabon_Nueva_Ecija.png',
  cabanatuan: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Cabanatuan_City.png',
  cabiao: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Cabiao_Nueva_Ecija.png',
  carranglan: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Carranglan_Nueva_Ecija.png',
  cuyapo: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Cuyapo_Nueva_Ecija.png',
  gabaldon: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Gabaldon_Nueva_Ecija.png',
  gapan: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Ph_seal_nueva_ecija_gapan.png',
  'general mamerto natividad': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/General_Mamerto_Natividad_Nueva_Ecija.png',
  'general-mamerto-natividad': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/General_Mamerto_Natividad_Nueva_Ecija.png',
  'gen mamerto natividad': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/General_Mamerto_Natividad_Nueva_Ecija.png',
  'general tinio': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/General_Tinio_Nueva_Ecija.png',
  'general-tinio': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/General_Tinio_Nueva_Ecija.png',
  'gen tinio': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/General_Tinio_Nueva_Ecija.png',
  guimba: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Guimba_Nueva_Ecija.png',
  jaen: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Jaen_Nueva_Ecija.png',
  laur: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Laur_Nueva_Ecija.png',
  licab: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Licab_Municipal_Seal.png',
  llanera: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Llanera_Nueva_Ecija.png',
  lupao: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Lupao_Nueva_Ecija.png',
  munoz: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Munoz_Nueva_Ecija.png',
  'science city of munoz': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Munoz_Nueva_Ecija.png',
  nampicuan: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Nampicuan_Nueva_Ecija.png',
  palayan: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Palayan_City,_Nueva_Ecija_new_seal.svg.png',
  pantabangan: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Pantabangan_Nueva_Ecija.png',
  penaranda: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Peñaranda_Nueva_Ecija.png',
  quezon: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Quezon_Nueva_Ecija.png',
  rizal: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Rizal_Nueva_Ecija.png',
  'san antonio': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/San_Antonio_Nueva_Ecija.png',
  'san isidro': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/San Isidro.png',
  'san-isidro': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/San Isidro.png',
  'san jose city': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/San_Jose_City.png',
  'san-jose-city': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/San_Jose_City.png',
  'san leonardo': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/San_Leonardo_Nueva_Ecija.png',
  'san-leonardo': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/San_Leonardo_Nueva_Ecija.png',
  'santa rosa': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Santa_Rosa_Nueva_Ecija.png',
  'santa-rosa': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Santa_Rosa_Nueva_Ecija.png',
  'santo domingo': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Santo_Domingo_Nueva_Ecija.png',
  'santo-domingo': '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Santo_Domingo_Nueva_Ecija.png',
  talavera: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Talavera_Nueva_Ecija.png',
  talugtug: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Talugtug_Nueva_Ecija.png',
  zaragoza: '/logos/Nueva Ecija/Nueva Ecija/Municipalities/Zaragoza_Nueva_Ecija.png',

  // ==========================================
  // PAMPANGA PROVINCE
  // ==========================================
  apalit: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Ph_seal_pampanga_apalit.png',
  arayat: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Arayat_Pampanga.png',
  bacolor: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Bacolor_Pampanga.svg',
  candaba: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/candaba-c079e91e.jpeg',
  floridablanca: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Floridablanca_Pampanga.png',
  guagua: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/guagualogo.png',
  lubao: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Lubao_Pampanga.svg',
  macabebe: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/macabebe.jpg',
  magalang: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Magalang_Pampanga.png',
  masantol: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Masantol_Pampanga.png',
  mexico: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Mexico_Pampanga.png',
  minalin: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Minalin_Pampanga.jpg',
  porac: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Porac.png',
  'san fernando': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Ph_seal_pampanga.png',
  'san-fernando': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Ph_seal_pampanga.png',
  'san simon': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/San_Simon_Pampanga.png',
  'san-simon': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/San_Simon_Pampanga.png',
  'santa ana': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Santa_Ana_Pampanga.png',
  'santa-ana': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Santa_Ana_Pampanga.png',
  'santa rita': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Santa_Rita_Pampanga.png',
  'santa-rita': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Santa_Rita_Pampanga.png',
  'santo tomas': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Santo_Tomas_Pampanga.svg',
  'santo-tomas': '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Santo_Tomas_Pampanga.svg',
  sasmuan: '/logos/Pampanga Flag & Seal/Pampanga Flag & Seal/Sasmuan.jpg',

  // ==========================================
  // TARLAC PROVINCE
  // ==========================================
  anao: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Anao_Tarlac.png',
  bamban: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Bamban_Tarlac.png',
  camiling: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Camiling_Tarlac.png',
  capas: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Capas_Tarlac.png',
  concepcion: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Seal_-_Concepcion_Tarlac_SVG.svg.png',
  gerona: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Gerona_Tarlac.png',
  'la paz': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/La_Paz_Tarlac.png',
  'la-paz': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/La_Paz_Tarlac.png',
  mayantoc: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Mayantoc_Tarlac.png',
  moncada: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Moncada_Tarlac.png',
  paniqui: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Paniqui_Tarlac.png',
  pura: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Pura_Tarlac.png',
  'san clemente': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/San_Clemente_Tarlac.png',
  'san-clemente': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/San_Clemente_Tarlac.png',
  'san manuel': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/San_Manuel_Tarlac.png',
  'san-manuel': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/San_Manuel_Tarlac.png',
  'santa ignacia': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Santa_Ignacia_Tarlac.png',
  'santa-ignacia': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Santa_Ignacia_Tarlac.png',
  'tarlac city': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Tarlac_Province_Seal.svg.png',
  'tarlac-city': '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Tarlac_Province_Seal.svg.png',
  victoria: '/logos/TarlacFlag & Seal/TarlacFlag & Seal/Victoria_Tarlac.png',

  // ==========================================
  // ZAMBALES PROVINCE
  // ==========================================
  // Province fallback (legacy asset kept for Zambales)
  zambales: '/logos/zambales/64px-Seal_of_Province_of_Zambales.svg.png',

  // Zambales municipalities
  botolan: '/logos/municipalities/Botolan/Ph_seal_zambales_botolan.png',
  cabangan: '/logos/municipalities/Cabangan/Cabangan_Zambales_seal.png',
  candelaria: '/logos/municipalities/Candelaria/Candelaria_Zambales_Seal.png',
  castillejos: '/logos/municipalities/Castillejos/Castillejos_Zambales_seal.png',
  iba: '/logos/municipalities/Iba/Iba_Zambales_seal.png',
  masinloc: '/logos/municipalities/Masinloc/Masinloc_Zambales_seal.png',
  olongapo: '/logos/municipalities/Subic/subic seal 256px.png',
  palauig: '/logos/municipalities/Palauig/Palauig_Zambales_seal.png',
  'san-antonio': '/logos/municipalities/SanAntonio/SanAntonio,102Zambalesjf.png',
  'san-felipe': '/logos/municipalities/San Felipe/Seal San Felipe.png',
  'san-marcelino': '/logos/municipalities/San Marcelino/smz-logo-256px.png',
  'san-narciso': '/logos/municipalities/San Narciso/san-narciso-seal 256px.png',
  'santa-cruz': '/logos/municipalities/Santa-Cruz/Santa_Cruz_Zambales.png',
  'sta cruz': '/logos/municipalities/Santa-Cruz/Santa_Cruz_Zambales.png',
  'sta-cruz': '/logos/municipalities/Santa-Cruz/Santa_Cruz_Zambales.png',
  subic: '/logos/municipalities/Subic/subic seal 256px.png',
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


