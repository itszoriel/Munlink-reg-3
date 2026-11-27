export type MunicipalityTheme = {
  pageGradient: string
  badgeClass: string
  panelClass: string
  iconClass: string
}

export type MunicipalityVisual = {
  name: string
  slug: string
  landmark: string
  landmarkLabel: string
  isCapital?: boolean
  spotlight: string
  operationsNote: string
  fact: string
  sourceLabel: string
  sourceUrl: string
  theme: MunicipalityTheme
}

const civic: MunicipalityTheme = {
  pageGradient: '',
  badgeClass: 'border-white/30 bg-slate-950/40 text-white',
  panelClass: 'border-slate-200 bg-white',
  iconClass: 'bg-navy-50 text-navy-700',
}

// One civic look for every municipality; the landmark photo is what sets them apart.
const themes = {
  coast: civic,
  civic,
  forest: civic,
  sunset: civic,
  royal: civic,
} satisfies Record<string, MunicipalityTheme>

export const ZAMBALES_MUNICIPALITY_VISUALS: MunicipalityVisual[] = [
  {
    name: 'Botolan',
    slug: 'botolan',
    landmark: '/landmarks/zambales/botolan/botolan_mt_pinatubo.webp',
    landmarkLabel: 'Mt. Pinatubo, Botolan',
    spotlight: 'Botolan is a coastal municipality with 31 barangays and the largest land area in Zambales.',
    operationsNote: 'Botolan covers about 735.28 square kilometers, around 20.25% of Zambales total land area.',
    fact: 'Botolan had 66,739 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/botolan.html',
    theme: themes.sunset,
  },
  {
    name: 'Cabangan',
    slug: 'cabangan',
    landmark: '/landmarks/zambales/cabangan/cabangan_municipal.webp',
    landmarkLabel: 'Cabangan Municipal Hall',
    spotlight: 'Cabangan is a coastal municipality with 22 barangays along the South China Sea.',
    operationsNote: 'Cabangan has about 175.29 square kilometers of land area.',
    fact: 'Cabangan had 28,118 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/cabangan.html',
    theme: themes.coast,
  },
  {
    name: 'Candelaria',
    slug: 'candelaria',
    landmark: '/landmarks/zambales/candelaria/candelaria_municipal.webp',
    landmarkLabel: 'Candelaria Municipal Hall',
    spotlight: 'Candelaria is a coastal municipality with 16 barangays.',
    operationsNote: 'Candelaria covers about 333.59 square kilometers, around 9.19% of Zambales total land area.',
    fact: 'Candelaria had 30,263 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/candelaria.html',
    theme: themes.forest,
  },
  {
    name: 'Castillejos',
    slug: 'castillejos',
    landmark: '/landmarks/zambales/castillejos/Castillejos_Ramon_Magsaysay_Ancestral_House,_Castillejos.webp',
    landmarkLabel: 'Ramon Magsaysay Ancestral House, Castillejos',
    spotlight: 'Castillejos is a landlocked municipality with 14 barangays.',
    operationsNote: 'Castillejos has about 92.99 square kilometers of land area.',
    fact: 'Castillejos had 67,889 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/castillejos.html',
    theme: themes.royal,
  },
  {
    name: 'Iba',
    slug: 'iba',
    landmark: '/landmarks/zambales/iba/iba_municipal.webp',
    landmarkLabel: 'Iba Municipal Hall',
    isCapital: true,
    spotlight: 'Iba is a coastal municipality and serves as the provincial capital of Zambales.',
    operationsNote: 'Iba has 14 barangays and about 153.38 square kilometers of land area.',
    fact: 'Iba had 55,581 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/iba.html',
    theme: themes.civic,
  },
  {
    name: 'Masinloc',
    slug: 'masinloc',
    landmark: '/landmarks/zambales/masinloc/masinloc_church.webp',
    landmarkLabel: 'San Andres Church, Masinloc',
    spotlight: 'Masinloc is a coastal municipality with 13 barangays.',
    operationsNote: 'Masinloc covers about 316.02 square kilometers, around 8.70% of Zambales total land area.',
    fact: 'Masinloc had 54,529 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/masinloc.html',
    theme: themes.coast,
  },
  {
    name: 'Palauig',
    slug: 'palauig',
    landmark: '/landmarks/zambales/palauig/palauig_municipal.webp',
    landmarkLabel: 'Palauig Municipal Hall',
    spotlight: 'Palauig is a coastal municipality with 19 barangays.',
    operationsNote: 'Palauig has about 310.00 square kilometers of land area.',
    fact: 'Palauig had 39,784 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/palauig.html',
    theme: themes.forest,
  },
  {
    name: 'San Antonio',
    slug: 'san-antonio',
    landmark: '/landmarks/zambales/san-antonio/san_antonio_municipal.webp',
    landmarkLabel: 'San Antonio Municipal Hall',
    spotlight: 'San Antonio is a coastal municipality with 14 barangays.',
    operationsNote: 'San Antonio has about 188.12 square kilometers of land area.',
    fact: 'San Antonio had 37,450 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/san-antonio.html',
    theme: themes.coast,
  },
  {
    name: 'San Felipe',
    slug: 'san-felipe',
    landmark: '/landmarks/zambales/san-felipe/san_felipe_arko.webp',
    landmarkLabel: 'San Felipe Arch',
    spotlight: 'San Felipe is a coastal municipality with 11 barangays.',
    operationsNote: 'San Felipe has about 111.60 square kilometers of land area.',
    fact: 'San Felipe had 25,033 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/san-felipe.html',
    theme: themes.sunset,
  },
  {
    name: 'San Marcelino',
    slug: 'san-marcelino',
    landmark: '/landmarks/zambales/san-marcelino/san_marcelino_municipal.webp',
    landmarkLabel: 'San Marcelino Municipal Hall',
    spotlight: 'San Marcelino is a landlocked municipality with 18 barangays.',
    operationsNote: 'San Marcelino covers about 416.86 square kilometers, around 11.48% of Zambales total land area.',
    fact: 'San Marcelino had 37,719 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/san-marcelino.html',
    theme: themes.forest,
  },
  {
    name: 'San Narciso',
    slug: 'san-narciso',
    landmark: '/landmarks/zambales/san-narciso/san_narciso_municipal.webp',
    landmarkLabel: 'San Narciso Municipal Hall',
    spotlight: 'San Narciso is a coastal municipality with 17 barangays.',
    operationsNote: 'San Narciso has about 71.60 square kilometers of land area.',
    fact: 'San Narciso had 30,759 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/san-narciso.html',
    theme: themes.coast,
  },
  {
    name: 'Santa Cruz',
    slug: 'santa-cruz',
    landmark: '/landmarks/zambales/santa-cruz/Santa_Cruz_Municipal.webp',
    landmarkLabel: 'Santa Cruz Municipal Hall',
    spotlight: 'Santa Cruz is a coastal municipality with 25 barangays.',
    operationsNote: 'Santa Cruz covers about 438.46 square kilometers, around 12.08% of Zambales total land area.',
    fact: 'Santa Cruz had 63,839 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/santa-cruz.html',
    theme: themes.royal,
  },
  {
    name: 'Subic',
    slug: 'subic',
    landmark: '/landmarks/zambales/subic/subic_municipality.webp',
    landmarkLabel: 'Subic Municipal Hall',
    spotlight: 'Subic is a coastal municipality on Subic Bay with 16 barangays.',
    operationsNote: 'Subic has about 287.16 square kilometers of land area.',
    fact: 'Subic had 111,912 residents in the 2020 Census.',
    sourceLabel: 'Source: PhilAtlas municipal profile',
    sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales/subic.html',
    theme: themes.civic,
  },
]

const fallbackVisual: MunicipalityVisual = {
  name: 'Zambales',
  slug: 'zambales',
  landmark: '/assets/about.webp',
  landmarkLabel: 'Zambales landmark',
  spotlight: 'Zambales has 13 municipalities within MunLink current scope.',
  operationsNote: 'Verified municipality facts appear here when a local profile is available.',
  fact: 'This admin workspace uses local geography and census facts for each municipality profile.',
  sourceLabel: 'Source: PhilAtlas',
  sourceUrl: 'https://www.philatlas.com/luzon/r03/zambales.html',
  theme: themes.civic,
}

const normalize = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const slugify = (value?: string) =>
  normalize(value)
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')

export function getMunicipalityVisual(params: {
  municipalityName?: string
  municipalitySlug?: string
}): MunicipalityVisual {
  const bySlug = slugify(params.municipalitySlug)
  const byName = normalize(params.municipalityName)

  const match = ZAMBALES_MUNICIPALITY_VISUALS.find((item) => {
    return item.slug === bySlug || normalize(item.name) === byName || item.slug === slugify(params.municipalityName)
  })

  if (match) return match

  if (params.municipalityName) {
    return {
      ...fallbackVisual,
      name: params.municipalityName,
      spotlight: `${params.municipalityName} is one of the municipalities currently served by MunLink in Zambales.`,
      operationsNote: `A verified local fact for ${params.municipalityName} will appear here when its dashboard profile is available.`,
      fact: `${params.municipalityName} is part of the current Zambales municipal scope in MunLink.`,
      sourceLabel: 'Source: Local municipality profile',
    }
  }

  return fallbackVisual
}
