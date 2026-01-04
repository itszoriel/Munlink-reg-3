/**
 * Static location data for Region 3 (Central Luzon).
 * This data is bundled with the frontend to avoid slow API calls on cold starts.
 * 
 * Note: If you need to update this data, sync it with the database seed data
 * in apps/api/scripts/seed_data.py and data/locations/region3_locations.json
 * 
 * IMPORTANT: Municipality IDs MUST match the database. Use export_municipality_ids.py
 * to get the latest IDs from the database.
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

// Province data with consistent IDs matching database seeds
export const PROVINCES: Province[] = [
  { id: 1, name: 'Aurora', slug: 'aurora', region_name: 'Central Luzon' },
  { id: 2, name: 'Bataan', slug: 'bataan', region_name: 'Central Luzon' },
  { id: 3, name: 'Bulacan', slug: 'bulacan', region_name: 'Central Luzon' },
  { id: 4, name: 'Nueva Ecija', slug: 'nueva-ecija', region_name: 'Central Luzon' },
  { id: 5, name: 'Pampanga', slug: 'pampanga', region_name: 'Central Luzon' },
  { id: 6, name: 'Tarlac', slug: 'tarlac', region_name: 'Central Luzon' },
  { id: 7, name: 'Zambales', slug: 'zambales', region_name: 'Central Luzon' },
]

/**
 * Database Municipality ID Mapping
 * 
 * This mapping uses REAL database IDs from municipality_ids.json export.
 * Keys are municipality slugs, values are database IDs.
 * 
 * NOTES:
 * - San Luis exists only in Aurora (ID 8) - Pampanga's San Luis needs to be added to DB
 * - San Antonio exists only in Nueva Ecija (ID 68) - Zambales' San Antonio needs to be added to DB
 * - Special characters: peñaranda (65), science-city-of-muñoz (61), doña-remedios-trinidad (44)
 *   use ASCII slugs in frontend for URL compatibility
 */
const DB_MUNICIPALITY_IDS: Record<string, number> = {
  // Aurora (8 municipalities)
  "baler": 1,
  "casiguran": 2,
  "dilasag": 3,
  "dinalungan": 4,
  "dingalan": 5,
  "dipaculao": 6,
  "maria-aurora": 7,
  "san-luis-aurora": 8, // Aurora's San Luis

  // Bataan (12 municipalities)
  "abucay": 9,
  "bagac": 10,
  "city-of-balanga": 11,
  "dinalupihan": 12,
  "hermosa": 13,
  "limay": 14,
  "mariveles": 15,
  "morong": 16,
  "orani": 17,
  "orion": 18,
  "pilar": 19,
  "samal": 20,

  // Bulacan (24 municipalities)
  "angat": 21,
  "balagtas": 22,
  "city-of-baliwag": 23,
  "bocaue": 24,
  "bulacan": 25,
  "bustos": 26,
  "calumpit": 27,
  "guiguinto": 28,
  "hagonoy": 29,
  "city-of-malolos": 30,
  "marilao": 31,
  "city-of-meycauayan": 32,
  "norzagaray": 33,
  "obando": 34,
  "pandi": 35,
  "paombong": 36,
  "plaridel": 37,
  "pulilan": 38,
  "san-ildefonso": 39,
  "city-of-san-jose-del-monte": 40,
  "san-miguel": 41,
  "san-rafael": 42,
  "santa-maria": 43,
  "dona-remedios-trinidad": 44, // ASCII slug for Doña Remedios Trinidad

  // Nueva Ecija (32 municipalities)
  "aliaga": 45,
  "bongabon": 46,
  "city-of-cabanatuan": 47,
  "cabiao": 48,
  "carranglan": 49,
  "cuyapo": 50,
  "gabaldon": 51,
  "city-of-gapan": 52,
  "general-mamerto-natividad": 53,
  "general-tinio": 54,
  "guimba": 55,
  "jaen": 56,
  "laur": 57,
  "licab": 58,
  "llanera": 59,
  "lupao": 60,
  "science-city-of-munoz": 61, // ASCII slug for Muñoz
  "nampicuan": 62,
  "city-of-palayan": 63,
  "pantabangan": 64,
  "penaranda": 65, // ASCII slug for Peñaranda
  "quezon": 66,
  "rizal": 67,
  "san-antonio-nueva-ecija": 68, // Nueva Ecija's San Antonio
  "san-isidro": 69,
  "san-jose-city": 70,
  "san-leonardo": 71,
  "santa-rosa": 72,
  "santo-domingo": 73,
  "talavera": 74,
  "talugtug": 75,
  "zaragoza": 76,

  // Pampanga (21 municipalities - San Luis NOT in DB yet)
  "apalit": 77,
  "arayat": 78,
  "bacolor": 79,
  "candaba": 80,
  "floridablanca": 81,
  "guagua": 82,
  "lubao": 83,
  "mabalacat-city": 84,
  "macabebe": 85,
  "magalang": 86,
  "masantol": 87,
  "mexico": 88,
  "minalin": 89,
  "porac": 90,
  "city-of-san-fernando": 91,
  "san-simon": 92,
  "santa-ana": 93,
  "santa-rita": 94,
  "sto-tomas": 95,
  "sasmuan": 96,
  "city-of-angeles": 97,
  "san-luis-pampanga": 133, // San Luis (Pampanga)

  // Tarlac (18 municipalities)
  "anao": 98,
  "bamban": 99,
  "camiling": 100,
  "capas": 101,
  "concepcion": 102,
  "gerona": 103,
  "la-paz": 104,
  "mayantoc": 105,
  "moncada": 106,
  "paniqui": 107,
  "pura": 108,
  "ramos": 109,
  "san-clemente": 110,
  "san-manuel": 111,
  "santa-ignacia": 112,
  "city-of-tarlac": 113,
  "victoria": 114,
  "san-jose": 115,

  // Zambales (13 municipalities - San Antonio NOT in DB yet)
  "botolan": 116,
  "cabangan": 117,
  "candelaria": 118,
  "castillejos": 119,
  "iba": 120,
  "masinloc": 121,
  "palauig": 122,
  "san-felipe": 123,
  "san-marcelino": 124,
  "san-narciso": 125,
  "santa-cruz": 126,
  "subic": 127,
  "city-of-olongapo": 128,
  "san-antonio-zambales": 134, // San Antonio (Zambales) - newly added
}

// Municipality data organized by province ID
// IMPORTANT: Slugs must match the keys in DB_MUNICIPALITY_IDS above
const MUNICIPALITIES_DATA: Record<number, Omit<Municipality, 'id'>[]> = {
  // Aurora (province_id: 1) - 8 municipalities
  1: [
    { name: 'Baler', slug: 'baler', province_id: 1 },
    { name: 'Casiguran', slug: 'casiguran', province_id: 1 },
    { name: 'Dilasag', slug: 'dilasag', province_id: 1 },
    { name: 'Dinalungan', slug: 'dinalungan', province_id: 1 },
    { name: 'Dingalan', slug: 'dingalan', province_id: 1 },
    { name: 'Dipaculao', slug: 'dipaculao', province_id: 1 },
    { name: 'Maria Aurora', slug: 'maria-aurora', province_id: 1 },
    { name: 'San Luis', slug: 'san-luis-aurora', province_id: 1 },
  ],
  // Bataan (province_id: 2) - 12 municipalities
  2: [
    { name: 'Abucay', slug: 'abucay', province_id: 2 },
    { name: 'Bagac', slug: 'bagac', province_id: 2 },
    { name: 'City of Balanga', slug: 'city-of-balanga', province_id: 2 },
    { name: 'Dinalupihan', slug: 'dinalupihan', province_id: 2 },
    { name: 'Hermosa', slug: 'hermosa', province_id: 2 },
    { name: 'Limay', slug: 'limay', province_id: 2 },
    { name: 'Mariveles', slug: 'mariveles', province_id: 2 },
    { name: 'Morong', slug: 'morong', province_id: 2 },
    { name: 'Orani', slug: 'orani', province_id: 2 },
    { name: 'Orion', slug: 'orion', province_id: 2 },
    { name: 'Pilar', slug: 'pilar', province_id: 2 },
    { name: 'Samal', slug: 'samal', province_id: 2 },
  ],
  // Bulacan (province_id: 3) - 24 municipalities
  3: [
    { name: 'Angat', slug: 'angat', province_id: 3 },
    { name: 'Balagtas', slug: 'balagtas', province_id: 3 },
    { name: 'City of Baliwag', slug: 'city-of-baliwag', province_id: 3 },
    { name: 'Bocaue', slug: 'bocaue', province_id: 3 },
    { name: 'Bulacan', slug: 'bulacan', province_id: 3 },
    { name: 'Bustos', slug: 'bustos', province_id: 3 },
    { name: 'Calumpit', slug: 'calumpit', province_id: 3 },
    { name: 'Guiguinto', slug: 'guiguinto', province_id: 3 },
    { name: 'Hagonoy', slug: 'hagonoy', province_id: 3 },
    { name: 'City of Malolos', slug: 'city-of-malolos', province_id: 3 },
    { name: 'Marilao', slug: 'marilao', province_id: 3 },
    { name: 'City of Meycauayan', slug: 'city-of-meycauayan', province_id: 3 },
    { name: 'Norzagaray', slug: 'norzagaray', province_id: 3 },
    { name: 'Obando', slug: 'obando', province_id: 3 },
    { name: 'Pandi', slug: 'pandi', province_id: 3 },
    { name: 'Paombong', slug: 'paombong', province_id: 3 },
    { name: 'Plaridel', slug: 'plaridel', province_id: 3 },
    { name: 'Pulilan', slug: 'pulilan', province_id: 3 },
    { name: 'San Ildefonso', slug: 'san-ildefonso', province_id: 3 },
    { name: 'City of San Jose Del Monte', slug: 'city-of-san-jose-del-monte', province_id: 3 },
    { name: 'San Miguel', slug: 'san-miguel', province_id: 3 },
    { name: 'San Rafael', slug: 'san-rafael', province_id: 3 },
    { name: 'Santa Maria', slug: 'santa-maria', province_id: 3 },
    { name: 'Doña Remedios Trinidad', slug: 'dona-remedios-trinidad', province_id: 3 },
  ],
  // Nueva Ecija (province_id: 4) - 32 municipalities
  4: [
    { name: 'Aliaga', slug: 'aliaga', province_id: 4 },
    { name: 'Bongabon', slug: 'bongabon', province_id: 4 },
    { name: 'City of Cabanatuan', slug: 'city-of-cabanatuan', province_id: 4 },
    { name: 'Cabiao', slug: 'cabiao', province_id: 4 },
    { name: 'Carranglan', slug: 'carranglan', province_id: 4 },
    { name: 'Cuyapo', slug: 'cuyapo', province_id: 4 },
    { name: 'Gabaldon', slug: 'gabaldon', province_id: 4 },
    { name: 'City of Gapan', slug: 'city-of-gapan', province_id: 4 },
    { name: 'General Mamerto Natividad', slug: 'general-mamerto-natividad', province_id: 4 },
    { name: 'General Tinio', slug: 'general-tinio', province_id: 4 },
    { name: 'Guimba', slug: 'guimba', province_id: 4 },
    { name: 'Jaen', slug: 'jaen', province_id: 4 },
    { name: 'Laur', slug: 'laur', province_id: 4 },
    { name: 'Licab', slug: 'licab', province_id: 4 },
    { name: 'Llanera', slug: 'llanera', province_id: 4 },
    { name: 'Lupao', slug: 'lupao', province_id: 4 },
    { name: 'Science City of Muñoz', slug: 'science-city-of-munoz', province_id: 4 },
    { name: 'Nampicuan', slug: 'nampicuan', province_id: 4 },
    { name: 'City of Palayan', slug: 'city-of-palayan', province_id: 4 },
    { name: 'Pantabangan', slug: 'pantabangan', province_id: 4 },
    { name: 'Peñaranda', slug: 'penaranda', province_id: 4 },
    { name: 'Quezon', slug: 'quezon', province_id: 4 },
    { name: 'Rizal', slug: 'rizal', province_id: 4 },
    { name: 'San Antonio', slug: 'san-antonio-nueva-ecija', province_id: 4 },
    { name: 'San Isidro', slug: 'san-isidro', province_id: 4 },
    { name: 'San Jose City', slug: 'san-jose-city', province_id: 4 },
    { name: 'San Leonardo', slug: 'san-leonardo', province_id: 4 },
    { name: 'Santa Rosa', slug: 'santa-rosa', province_id: 4 },
    { name: 'Santo Domingo', slug: 'santo-domingo', province_id: 4 },
    { name: 'Talavera', slug: 'talavera', province_id: 4 },
    { name: 'Talugtug', slug: 'talugtug', province_id: 4 },
    { name: 'Zaragoza', slug: 'zaragoza', province_id: 4 },
  ],
  // Pampanga (province_id: 5) - 21 municipalities (San Luis NOT in DB yet)
  5: [
    { name: 'Apalit', slug: 'apalit', province_id: 5 },
    { name: 'Arayat', slug: 'arayat', province_id: 5 },
    { name: 'Bacolor', slug: 'bacolor', province_id: 5 },
    { name: 'Candaba', slug: 'candaba', province_id: 5 },
    { name: 'Floridablanca', slug: 'floridablanca', province_id: 5 },
    { name: 'Guagua', slug: 'guagua', province_id: 5 },
    { name: 'Lubao', slug: 'lubao', province_id: 5 },
    { name: 'Mabalacat City', slug: 'mabalacat-city', province_id: 5 },
    { name: 'Macabebe', slug: 'macabebe', province_id: 5 },
    { name: 'Magalang', slug: 'magalang', province_id: 5 },
    { name: 'Masantol', slug: 'masantol', province_id: 5 },
    { name: 'Mexico', slug: 'mexico', province_id: 5 },
    { name: 'Minalin', slug: 'minalin', province_id: 5 },
    { name: 'Porac', slug: 'porac', province_id: 5 },
    { name: 'City of San Fernando', slug: 'city-of-san-fernando', province_id: 5 },
    { name: 'San Simon', slug: 'san-simon', province_id: 5 },
    { name: 'Santa Ana', slug: 'santa-ana', province_id: 5 },
    { name: 'Santa Rita', slug: 'santa-rita', province_id: 5 },
    { name: 'Sto. Tomas', slug: 'sto-tomas', province_id: 5 },
    { name: 'Sasmuan', slug: 'sasmuan', province_id: 5 },
    { name: 'City of Angeles', slug: 'city-of-angeles', province_id: 5 },
    { name: 'San Luis', slug: 'san-luis-pampanga', province_id: 5 },
  ],
  // Tarlac (province_id: 6) - 18 municipalities
  6: [
    { name: 'Anao', slug: 'anao', province_id: 6 },
    { name: 'Bamban', slug: 'bamban', province_id: 6 },
    { name: 'Camiling', slug: 'camiling', province_id: 6 },
    { name: 'Capas', slug: 'capas', province_id: 6 },
    { name: 'Concepcion', slug: 'concepcion', province_id: 6 },
    { name: 'Gerona', slug: 'gerona', province_id: 6 },
    { name: 'La Paz', slug: 'la-paz', province_id: 6 },
    { name: 'Mayantoc', slug: 'mayantoc', province_id: 6 },
    { name: 'Moncada', slug: 'moncada', province_id: 6 },
    { name: 'Paniqui', slug: 'paniqui', province_id: 6 },
    { name: 'Pura', slug: 'pura', province_id: 6 },
    { name: 'Ramos', slug: 'ramos', province_id: 6 },
    { name: 'San Clemente', slug: 'san-clemente', province_id: 6 },
    { name: 'San Manuel', slug: 'san-manuel', province_id: 6 },
    { name: 'Santa Ignacia', slug: 'santa-ignacia', province_id: 6 },
    { name: 'City of Tarlac', slug: 'city-of-tarlac', province_id: 6 },
    { name: 'Victoria', slug: 'victoria', province_id: 6 },
    { name: 'San Jose', slug: 'san-jose', province_id: 6 },
  ],
  // Zambales (province_id: 7) - 13 municipalities (San Antonio NOT in DB yet)
  7: [
    { name: 'Botolan', slug: 'botolan', province_id: 7 },
    { name: 'Cabangan', slug: 'cabangan', province_id: 7 },
    { name: 'Candelaria', slug: 'candelaria', province_id: 7 },
    { name: 'Castillejos', slug: 'castillejos', province_id: 7 },
    { name: 'Iba', slug: 'iba', province_id: 7 },
    { name: 'Masinloc', slug: 'masinloc', province_id: 7 },
    { name: 'Palauig', slug: 'palauig', province_id: 7 },
    { name: 'San Felipe', slug: 'san-felipe', province_id: 7 },
    { name: 'San Marcelino', slug: 'san-marcelino', province_id: 7 },
    { name: 'San Narciso', slug: 'san-narciso', province_id: 7 },
    { name: 'Santa Cruz', slug: 'santa-cruz', province_id: 7 },
    { name: 'Subic', slug: 'subic', province_id: 7 },
    { name: 'City of Olongapo', slug: 'city-of-olongapo', province_id: 7 },
    { name: 'San Antonio', slug: 'san-antonio-zambales', province_id: 7 },
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
      id: dbId || 0, // Use real database ID, fallback to 0 if not found
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
