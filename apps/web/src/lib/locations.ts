/**
 * Static location data for Region 3 (Central Luzon).
 * Auto-generated from PSGC July 2025 data by scripts/psgc_sync.py
 * 
 * DO NOT EDIT MANUALLY - Run psgc_sync.py to regenerate
 */

import type { Province, Municipality } from './store'

// Barangay type
export type Barangay = {
  id: number
  name: string
  slug: string
  municipality_id: number
}

// Import static barangay data (mapped by municipality slug)
import barangayData from './barangay_ids.json'

// Province data from PSGC
export const PROVINCES: Province[] = [
  { id: 1, name: 'Bataan', slug: 'bataan', region_name: 'Central Luzon' },
  { id: 2, name: 'Bulacan', slug: 'bulacan', region_name: 'Central Luzon' },
  { id: 3, name: 'Nueva Ecija', slug: 'nueva-ecija', region_name: 'Central Luzon' },
  { id: 4, name: 'Pampanga', slug: 'pampanga', region_name: 'Central Luzon' },
  { id: 5, name: 'Tarlac', slug: 'tarlac', region_name: 'Central Luzon' },
  { id: 6, name: 'Zambales', slug: 'zambales', region_name: 'Central Luzon' },
  { id: 7, name: 'Aurora', slug: 'aurora', region_name: 'Central Luzon' },
]

// Municipality ID mapping (slug -> database ID)
const DB_MUNICIPALITY_IDS: Record<string, number> = {
  "abucay": 1,
  "bagac": 2,
  "city-of-balanga": 3,
  "dinalupihan": 4,
  "hermosa": 5,
  "limay": 6,
  "mariveles": 7,
  "morong": 8,
  "orani": 9,
  "orion": 10,
  "pilar": 11,
  "samal": 12,
  "angat": 13,
  "balagtas": 14,
  "city-of-baliwag": 15,
  "bocaue": 16,
  "bulacan": 17,
  "bustos": 18,
  "calumpit": 19,
  "guiguinto": 20,
  "hagonoy": 21,
  "city-of-malolos": 22,
  "marilao": 23,
  "city-of-meycauayan": 24,
  "norzagaray": 25,
  "obando": 26,
  "pandi": 27,
  "paombong": 28,
  "plaridel": 29,
  "pulilan": 30,
  "san-ildefonso": 31,
  "city-of-san-jose-del-monte": 32,
  "san-miguel": 33,
  "san-rafael": 34,
  "santa-maria": 35,
  "dona-remedios-trinidad": 36,
  "aliaga": 37,
  "bongabon": 38,
  "city-of-cabanatuan": 39,
  "cabiao": 40,
  "carranglan": 41,
  "cuyapo": 42,
  "gabaldon": 43,
  "city-of-gapan": 44,
  "general-mamerto-natividad": 45,
  "general-tinio": 46,
  "guimba": 47,
  "jaen": 48,
  "laur": 49,
  "licab": 50,
  "llanera": 51,
  "lupao": 52,
  "science-city-of-munoz": 53,
  "nampicuan": 54,
  "city-of-palayan": 55,
  "pantabangan": 56,
  "penaranda": 57,
  "quezon": 58,
  "rizal": 59,
  "san-antonio-nueva-ecija": 60,
  "san-isidro": 61,
  "san-jose-city": 62,
  "san-leonardo": 63,
  "santa-rosa": 64,
  "santo-domingo": 65,
  "talavera": 66,
  "talugtug": 67,
  "zaragoza": 68,
  "apalit": 69,
  "arayat": 70,
  "bacolor": 71,
  "candaba": 72,
  "floridablanca": 73,
  "guagua": 74,
  "lubao": 75,
  "mabalacat-city": 76,
  "macabebe": 77,
  "magalang": 78,
  "masantol": 79,
  "mexico": 80,
  "minalin": 81,
  "porac": 82,
  "city-of-san-fernando": 83,
  "san-luis-pampanga": 84,
  "san-simon": 85,
  "santa-ana": 86,
  "santa-rita": 87,
  "sto-tomas": 88,
  "sasmuan": 89,
  "anao": 90,
  "bamban": 91,
  "camiling": 92,
  "capas": 93,
  "concepcion": 94,
  "gerona": 95,
  "la-paz": 96,
  "mayantoc": 97,
  "moncada": 98,
  "paniqui": 99,
  "pura": 100,
  "ramos": 101,
  "san-clemente": 102,
  "san-manuel": 103,
  "santa-ignacia": 104,
  "city-of-tarlac": 105,
  "victoria": 106,
  "san-jose": 107,
  "botolan": 108,
  "cabangan": 109,
  "candelaria": 110,
  "castillejos": 111,
  "iba": 112,
  "masinloc": 113,
  "palauig": 114,
  "san-antonio-zambales": 115,
  "san-felipe": 116,
  "san-marcelino": 117,
  "san-narciso": 118,
  "santa-cruz": 119,
  "subic": 120,
  "baler": 121,
  "casiguran": 122,
  "dilasag": 123,
  "dinalungan": 124,
  "dingalan": 125,
  "dipaculao": 126,
  "maria-aurora": 127,
  "san-luis-aurora": 128,
  "city-of-angeles": 129,
  "city-of-olongapo": 130,
}

// Municipality data organized by province ID
const MUNICIPALITIES_DATA: Record<number, Omit<Municipality, 'id'>[]> = {
  // Bataan (province_id: 1) - 12 municipalities
  1: [
    { name: 'Abucay', slug: 'abucay', province_id: 1 },
    { name: 'Bagac', slug: 'bagac', province_id: 1 },
    { name: 'City of Balanga', slug: 'city-of-balanga', province_id: 1 },
    { name: 'Dinalupihan', slug: 'dinalupihan', province_id: 1 },
    { name: 'Hermosa', slug: 'hermosa', province_id: 1 },
    { name: 'Limay', slug: 'limay', province_id: 1 },
    { name: 'Mariveles', slug: 'mariveles', province_id: 1 },
    { name: 'Morong', slug: 'morong', province_id: 1 },
    { name: 'Orani', slug: 'orani', province_id: 1 },
    { name: 'Orion', slug: 'orion', province_id: 1 },
    { name: 'Pilar', slug: 'pilar', province_id: 1 },
    { name: 'Samal', slug: 'samal', province_id: 1 },
  ],
  // Bulacan (province_id: 2) - 24 municipalities
  2: [
    { name: 'Angat', slug: 'angat', province_id: 2 },
    { name: 'Balagtas', slug: 'balagtas', province_id: 2 },
    { name: 'Bocaue', slug: 'bocaue', province_id: 2 },
    { name: 'Bulacan', slug: 'bulacan', province_id: 2 },
    { name: 'Bustos', slug: 'bustos', province_id: 2 },
    { name: 'Calumpit', slug: 'calumpit', province_id: 2 },
    { name: 'City of Baliwag', slug: 'city-of-baliwag', province_id: 2 },
    { name: 'City of Malolos', slug: 'city-of-malolos', province_id: 2 },
    { name: 'City of Meycauayan', slug: 'city-of-meycauayan', province_id: 2 },
    { name: 'City of San Jose Del Monte', slug: 'city-of-san-jose-del-monte', province_id: 2 },
    { name: 'Doña Remedios Trinidad', slug: 'dona-remedios-trinidad', province_id: 2 },
    { name: 'Guiguinto', slug: 'guiguinto', province_id: 2 },
    { name: 'Hagonoy', slug: 'hagonoy', province_id: 2 },
    { name: 'Marilao', slug: 'marilao', province_id: 2 },
    { name: 'Norzagaray', slug: 'norzagaray', province_id: 2 },
    { name: 'Obando', slug: 'obando', province_id: 2 },
    { name: 'Pandi', slug: 'pandi', province_id: 2 },
    { name: 'Paombong', slug: 'paombong', province_id: 2 },
    { name: 'Plaridel', slug: 'plaridel', province_id: 2 },
    { name: 'Pulilan', slug: 'pulilan', province_id: 2 },
    { name: 'San Ildefonso', slug: 'san-ildefonso', province_id: 2 },
    { name: 'San Miguel', slug: 'san-miguel', province_id: 2 },
    { name: 'San Rafael', slug: 'san-rafael', province_id: 2 },
    { name: 'Santa Maria', slug: 'santa-maria', province_id: 2 },
  ],
  // Nueva Ecija (province_id: 3) - 32 municipalities
  3: [
    { name: 'Aliaga', slug: 'aliaga', province_id: 3 },
    { name: 'Bongabon', slug: 'bongabon', province_id: 3 },
    { name: 'Cabiao', slug: 'cabiao', province_id: 3 },
    { name: 'Carranglan', slug: 'carranglan', province_id: 3 },
    { name: 'City of Cabanatuan', slug: 'city-of-cabanatuan', province_id: 3 },
    { name: 'City of Gapan', slug: 'city-of-gapan', province_id: 3 },
    { name: 'City of Palayan', slug: 'city-of-palayan', province_id: 3 },
    { name: 'Cuyapo', slug: 'cuyapo', province_id: 3 },
    { name: 'Gabaldon', slug: 'gabaldon', province_id: 3 },
    { name: 'General Mamerto Natividad', slug: 'general-mamerto-natividad', province_id: 3 },
    { name: 'General Tinio', slug: 'general-tinio', province_id: 3 },
    { name: 'Guimba', slug: 'guimba', province_id: 3 },
    { name: 'Jaen', slug: 'jaen', province_id: 3 },
    { name: 'Laur', slug: 'laur', province_id: 3 },
    { name: 'Licab', slug: 'licab', province_id: 3 },
    { name: 'Llanera', slug: 'llanera', province_id: 3 },
    { name: 'Lupao', slug: 'lupao', province_id: 3 },
    { name: 'Nampicuan', slug: 'nampicuan', province_id: 3 },
    { name: 'Pantabangan', slug: 'pantabangan', province_id: 3 },
    { name: 'Peñaranda', slug: 'penaranda', province_id: 3 },
    { name: 'Quezon', slug: 'quezon', province_id: 3 },
    { name: 'Rizal', slug: 'rizal', province_id: 3 },
    { name: 'San Antonio (Nueva Ecija)', slug: 'san-antonio-nueva-ecija', province_id: 3 },
    { name: 'San Isidro', slug: 'san-isidro', province_id: 3 },
    { name: 'San Jose City', slug: 'san-jose-city', province_id: 3 },
    { name: 'San Leonardo', slug: 'san-leonardo', province_id: 3 },
    { name: 'Santa Rosa', slug: 'santa-rosa', province_id: 3 },
    { name: 'Santo Domingo', slug: 'santo-domingo', province_id: 3 },
    { name: 'Science City of Muñoz', slug: 'science-city-of-munoz', province_id: 3 },
    { name: 'Talavera', slug: 'talavera', province_id: 3 },
    { name: 'Talugtug', slug: 'talugtug', province_id: 3 },
    { name: 'Zaragoza', slug: 'zaragoza', province_id: 3 },
  ],
  // Pampanga (province_id: 4) - 22 municipalities
  4: [
    { name: 'Apalit', slug: 'apalit', province_id: 4 },
    { name: 'Arayat', slug: 'arayat', province_id: 4 },
    { name: 'Bacolor', slug: 'bacolor', province_id: 4 },
    { name: 'Candaba', slug: 'candaba', province_id: 4 },
    { name: 'City of Angeles', slug: 'city-of-angeles', province_id: 4 },
    { name: 'City of San Fernando', slug: 'city-of-san-fernando', province_id: 4 },
    { name: 'Floridablanca', slug: 'floridablanca', province_id: 4 },
    { name: 'Guagua', slug: 'guagua', province_id: 4 },
    { name: 'Lubao', slug: 'lubao', province_id: 4 },
    { name: 'Mabalacat City', slug: 'mabalacat-city', province_id: 4 },
    { name: 'Macabebe', slug: 'macabebe', province_id: 4 },
    { name: 'Magalang', slug: 'magalang', province_id: 4 },
    { name: 'Masantol', slug: 'masantol', province_id: 4 },
    { name: 'Mexico', slug: 'mexico', province_id: 4 },
    { name: 'Minalin', slug: 'minalin', province_id: 4 },
    { name: 'Porac', slug: 'porac', province_id: 4 },
    { name: 'San Luis (Pampanga)', slug: 'san-luis-pampanga', province_id: 4 },
    { name: 'San Simon', slug: 'san-simon', province_id: 4 },
    { name: 'Santa Ana', slug: 'santa-ana', province_id: 4 },
    { name: 'Santa Rita', slug: 'santa-rita', province_id: 4 },
    { name: 'Sasmuan', slug: 'sasmuan', province_id: 4 },
    { name: 'Sto. Tomas', slug: 'sto-tomas', province_id: 4 },
  ],
  // Tarlac (province_id: 5) - 18 municipalities
  5: [
    { name: 'Anao', slug: 'anao', province_id: 5 },
    { name: 'Bamban', slug: 'bamban', province_id: 5 },
    { name: 'Camiling', slug: 'camiling', province_id: 5 },
    { name: 'Capas', slug: 'capas', province_id: 5 },
    { name: 'City of Tarlac', slug: 'city-of-tarlac', province_id: 5 },
    { name: 'Concepcion', slug: 'concepcion', province_id: 5 },
    { name: 'Gerona', slug: 'gerona', province_id: 5 },
    { name: 'La Paz', slug: 'la-paz', province_id: 5 },
    { name: 'Mayantoc', slug: 'mayantoc', province_id: 5 },
    { name: 'Moncada', slug: 'moncada', province_id: 5 },
    { name: 'Paniqui', slug: 'paniqui', province_id: 5 },
    { name: 'Pura', slug: 'pura', province_id: 5 },
    { name: 'Ramos', slug: 'ramos', province_id: 5 },
    { name: 'San Clemente', slug: 'san-clemente', province_id: 5 },
    { name: 'San Jose', slug: 'san-jose', province_id: 5 },
    { name: 'San Manuel', slug: 'san-manuel', province_id: 5 },
    { name: 'Santa Ignacia', slug: 'santa-ignacia', province_id: 5 },
    { name: 'Victoria', slug: 'victoria', province_id: 5 },
  ],
  // Zambales (province_id: 6) - 14 municipalities
  6: [
    { name: 'Botolan', slug: 'botolan', province_id: 6 },
    { name: 'Cabangan', slug: 'cabangan', province_id: 6 },
    { name: 'Candelaria', slug: 'candelaria', province_id: 6 },
    { name: 'Castillejos', slug: 'castillejos', province_id: 6 },
    { name: 'City of Olongapo', slug: 'city-of-olongapo', province_id: 6 },
    { name: 'Iba', slug: 'iba', province_id: 6 },
    { name: 'Masinloc', slug: 'masinloc', province_id: 6 },
    { name: 'Palauig', slug: 'palauig', province_id: 6 },
    { name: 'San Antonio (Zambales)', slug: 'san-antonio-zambales', province_id: 6 },
    { name: 'San Felipe', slug: 'san-felipe', province_id: 6 },
    { name: 'San Marcelino', slug: 'san-marcelino', province_id: 6 },
    { name: 'San Narciso', slug: 'san-narciso', province_id: 6 },
    { name: 'Santa Cruz', slug: 'santa-cruz', province_id: 6 },
    { name: 'Subic', slug: 'subic', province_id: 6 },
  ],
  // Aurora (province_id: 7) - 8 municipalities
  7: [
    { name: 'Baler', slug: 'baler', province_id: 7 },
    { name: 'Casiguran', slug: 'casiguran', province_id: 7 },
    { name: 'Dilasag', slug: 'dilasag', province_id: 7 },
    { name: 'Dinalungan', slug: 'dinalungan', province_id: 7 },
    { name: 'Dingalan', slug: 'dingalan', province_id: 7 },
    { name: 'Dipaculao', slug: 'dipaculao', province_id: 7 },
    { name: 'Maria Aurora', slug: 'maria-aurora', province_id: 7 },
    { name: 'San Luis (Aurora)', slug: 'san-luis-aurora', province_id: 7 },
  ],
}

// Generate municipalities with real database IDs
export const MUNICIPALITIES: Municipality[] = []

for (const provinceId of [1, 2, 3, 4, 5, 6, 7]) {
  const provinceMunicipalities = MUNICIPALITIES_DATA[provinceId] || []
  for (const mun of provinceMunicipalities) {
    const dbId = DB_MUNICIPALITY_IDS[mun.slug]
    if (!dbId) {
      console.warn(`[locations.ts] No DB ID found for municipality slug: ${mun.slug}`)
    }
    MUNICIPALITIES.push({
      id: dbId || 0,
      ...mun,
    })
  }
}

// Validate that all municipalities have valid IDs (dev helper)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  const missingIds = MUNICIPALITIES.filter(m => m.id === 0)
  if (missingIds.length > 0) {
    console.warn('[locations.ts] Municipalities missing DB IDs:', missingIds.map(m => m.slug))
  }
}

/**
 * Get all provinces (static data, instant load)
 */
export function getProvinces(): Province[] {
  return PROVINCES
}

/**
 * Get municipalities filtered by province ID (static data, instant load)
 */
export function getMunicipalities(provinceId?: number): Municipality[] {
  if (!provinceId) {
    return MUNICIPALITIES
  }
  return MUNICIPALITIES.filter(m => m.province_id === provinceId)
}

/**
 * Get a province by ID
 */
export function getProvinceById(id: number): Province | undefined {
  return PROVINCES.find(p => p.id === id)
}

/**
 * Get a province by slug
 */
export function getProvinceBySlug(slug: string): Province | undefined {
  return PROVINCES.find(p => p.slug === slug.toLowerCase())
}

/**
 * Get a municipality by ID
 */
export function getMunicipalityById(id: number): Municipality | undefined {
  return MUNICIPALITIES.find(m => m.id === id)
}

/**
 * Get a municipality by slug
 */
export function getMunicipalityBySlug(slug: string): Municipality | undefined {
  return MUNICIPALITIES.find(m => m.slug === slug.toLowerCase())
}

// Static barangay data mapping
const DB_BARANGAY_IDS: Record<string, Barangay[]> = barangayData as any

/**
 * Get barangays by municipality slug (static data, instant load)
 */
export function getBarangaysByMunicipalitySlug(municipalitySlug: string): Barangay[] {
  const slug = municipalitySlug.toLowerCase()
  return DB_BARANGAY_IDS[slug] || []
}

/**
 * Get barangays by municipality ID (static data, instant load)
 */
export function getBarangaysByMunicipalityId(municipalityId: number): Barangay[] {
  const municipality = getMunicipalityById(municipalityId)
  if (!municipality) return []
  return getBarangaysByMunicipalitySlug(municipality.slug)
}
