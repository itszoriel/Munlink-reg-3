/**
 * Static location data for Region 3 (Central Luzon).
 * This data is bundled with the frontend to avoid slow API calls on cold starts.
 * 
 * Note: If you need to update this data, sync it with the database seed data
 * in apps/api/scripts/seed_data.py and data/locations/region3_locations.json
 */

// Type definitions for location data
export type Province = {
  id: number
  name: string
  slug: string
  region_name?: string
}

export type Municipality = {
  id: number
  name: string
  slug: string
  province_id: number
}

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

// Municipality data organized by province ID
const MUNICIPALITIES_DATA: Record<number, Omit<Municipality, 'id'>[]> = {
  // Aurora (province_id: 1)
  1: [
    { name: 'Baler', slug: 'baler', province_id: 1 },
    { name: 'Casiguran', slug: 'casiguran', province_id: 1 },
    { name: 'Dilasag', slug: 'dilasag', province_id: 1 },
    { name: 'Dinalungan', slug: 'dinalungan', province_id: 1 },
    { name: 'Dingalan', slug: 'dingalan', province_id: 1 },
    { name: 'Dipaculao', slug: 'dipaculao', province_id: 1 },
    { name: 'Maria Aurora', slug: 'maria-aurora', province_id: 1 },
    { name: 'San Luis', slug: 'san-luis', province_id: 1 },
  ],
  // Bataan (province_id: 2)
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
  // Bulacan (province_id: 3)
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
  // Nueva Ecija (province_id: 4)
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
    { name: 'San Antonio', slug: 'san-antonio', province_id: 4 },
    { name: 'San Isidro', slug: 'san-isidro', province_id: 4 },
    { name: 'San Jose City', slug: 'san-jose-city', province_id: 4 },
    { name: 'San Leonardo', slug: 'san-leonardo', province_id: 4 },
    { name: 'Santa Rosa', slug: 'santa-rosa', province_id: 4 },
    { name: 'Santo Domingo', slug: 'santo-domingo', province_id: 4 },
    { name: 'Talavera', slug: 'talavera', province_id: 4 },
    { name: 'Talugtug', slug: 'talugtug', province_id: 4 },
    { name: 'Zaragoza', slug: 'zaragoza', province_id: 4 },
  ],
  // Pampanga (province_id: 5)
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
    { name: 'San Luis', slug: 'san-luis', province_id: 5 },
    { name: 'San Simon', slug: 'san-simon', province_id: 5 },
    { name: 'Santa Ana', slug: 'santa-ana', province_id: 5 },
    { name: 'Santa Rita', slug: 'santa-rita', province_id: 5 },
    { name: 'Sto. Tomas', slug: 'sto-tomas', province_id: 5 },
    { name: 'Sasmuan', slug: 'sasmuan', province_id: 5 },
    { name: 'City of Angeles', slug: 'city-of-angeles', province_id: 5 },
  ],
  // Tarlac (province_id: 6)
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
  // Zambales (province_id: 7)
  7: [
    { name: 'Botolan', slug: 'botolan', province_id: 7 },
    { name: 'Cabangan', slug: 'cabangan', province_id: 7 },
    { name: 'Candelaria', slug: 'candelaria', province_id: 7 },
    { name: 'Castillejos', slug: 'castillejos', province_id: 7 },
    { name: 'Iba', slug: 'iba', province_id: 7 },
    { name: 'Masinloc', slug: 'masinloc', province_id: 7 },
    { name: 'Palauig', slug: 'palauig', province_id: 7 },
    { name: 'San Antonio', slug: 'san-antonio', province_id: 7 },
    { name: 'San Felipe', slug: 'san-felipe', province_id: 7 },
    { name: 'San Marcelino', slug: 'san-marcelino', province_id: 7 },
    { name: 'San Narciso', slug: 'san-narciso', province_id: 7 },
    { name: 'Santa Cruz', slug: 'santa-cruz', province_id: 7 },
    { name: 'Subic', slug: 'subic', province_id: 7 },
    { name: 'City of Olongapo', slug: 'city-of-olongapo', province_id: 7 },
  ],
}

// Generate municipalities with sequential IDs
let municipalityId = 1
export const MUNICIPALITIES: Municipality[] = []

for (const provinceId of [1, 2, 3, 4, 5, 6, 7]) {
  const provinceMunicipalities = MUNICIPALITIES_DATA[provinceId] || []
  for (const mun of provinceMunicipalities) {
    MUNICIPALITIES.push({
      id: municipalityId++,
      ...mun,
    })
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



