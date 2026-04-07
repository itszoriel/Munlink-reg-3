export type MunicipalityTheme = {
  pageGradient: string
  badgeClass: string
  panelClass: string
  iconClass: string
  chipClass: string
}

export type MunicipalityVisual = {
  name: string
  slug: string
  landmark: string
  isCapital?: boolean
  spotlight: string
  fact: string
  theme: MunicipalityTheme
}

const themes = {
  coast: {
    pageGradient: 'from-sky-50 via-white to-cyan-100/60',
    badgeClass: 'border-sky-200 bg-sky-100/90 text-sky-800',
    panelClass: 'border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50',
    iconClass: 'bg-sky-100 text-sky-700',
    chipClass: 'bg-sky-600 text-white',
  },
  civic: {
    pageGradient: 'from-ocean-50 via-white to-emerald-100/50',
    badgeClass: 'border-ocean-200 bg-ocean-100/90 text-ocean-800',
    panelClass: 'border-ocean-100 bg-gradient-to-br from-ocean-50 to-emerald-50',
    iconClass: 'bg-ocean-100 text-ocean-700',
    chipClass: 'bg-ocean-600 text-white',
  },
  forest: {
    pageGradient: 'from-emerald-50 via-white to-lime-100/50',
    badgeClass: 'border-emerald-200 bg-emerald-100/90 text-emerald-800',
    panelClass: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50',
    iconClass: 'bg-emerald-100 text-emerald-700',
    chipClass: 'bg-emerald-600 text-white',
  },
  sunset: {
    pageGradient: 'from-amber-50 via-white to-orange-100/50',
    badgeClass: 'border-amber-200 bg-amber-100/90 text-amber-900',
    panelClass: 'border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50',
    iconClass: 'bg-amber-100 text-amber-700',
    chipClass: 'bg-amber-600 text-white',
  },
  royal: {
    pageGradient: 'from-indigo-50 via-white to-violet-100/50',
    badgeClass: 'border-indigo-200 bg-indigo-100/90 text-indigo-800',
    panelClass: 'border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50',
    iconClass: 'bg-indigo-100 text-indigo-700',
    chipClass: 'bg-indigo-600 text-white',
  },
} satisfies Record<string, MunicipalityTheme>

const defaultSpotlight = (name: string) => `${name} is one of the 13 municipalities served by MunLink Zambales.`

export const ZAMBALES_MUNICIPALITY_VISUALS: MunicipalityVisual[] = [
  {
    name: 'Botolan',
    slug: 'botolan',
    landmark: '/landmarks/zambales/botolan/botolan_mt_pinatubo.png',
    spotlight: 'Your dashboard highlights Botolan using the same landmark artwork shown on the About page.',
    fact: defaultSpotlight('Botolan'),
    theme: themes.sunset,
  },
  {
    name: 'Cabangan',
    slug: 'cabangan',
    landmark: '/landmarks/zambales/cabangan/cabangan_municipal.png',
    spotlight: 'Cabangan residents can quickly spot local services, announcements, and requests from one home screen.',
    fact: defaultSpotlight('Cabangan'),
    theme: themes.coast,
  },
  {
    name: 'Candelaria',
    slug: 'candelaria',
    landmark: '/landmarks/zambales/candelaria/candelaria_municipal.png',
    spotlight: 'Candelaria gets a clean municipal-first dashboard so residents can recognize their local area immediately after login.',
    fact: defaultSpotlight('Candelaria'),
    theme: themes.forest,
  },
  {
    name: 'Castillejos',
    slug: 'castillejos',
    landmark: '/landmarks/zambales/castillejos/Castillejos_Ramon_Magsaysay_Ancestral_House,_Castillejos.jpg',
    spotlight: 'Castillejos uses its About-page heritage image as the resident dashboard hero for a more local identity.',
    fact: defaultSpotlight('Castillejos'),
    theme: themes.royal,
  },
  {
    name: 'Iba',
    slug: 'iba',
    landmark: '/landmarks/zambales/iba/iba_municipal.png',
    isCapital: true,
    spotlight: 'Iba residents see the provincial capital called out directly in the dashboard hero.',
    fact: 'Iba is the capital of Zambales.',
    theme: themes.civic,
  },
  {
    name: 'Masinloc',
    slug: 'masinloc',
    landmark: '/landmarks/zambales/masinloc/masinloc_church.png',
    spotlight: 'Masinloc residents get a municipality-aware dashboard built from the same local visuals used on the About page.',
    fact: defaultSpotlight('Masinloc'),
    theme: themes.coast,
  },
  {
    name: 'Palauig',
    slug: 'palauig',
    landmark: '/landmarks/zambales/palauig/palauig_municipal.png',
    spotlight: 'Palauig residents can identify their municipality quickly through a dedicated hero image and spotlight panel.',
    fact: defaultSpotlight('Palauig'),
    theme: themes.forest,
  },
  {
    name: 'San Antonio',
    slug: 'san-antonio',
    landmark: '/landmarks/zambales/san-antonio/san_antonio_municipal.png',
    spotlight: 'San Antonio is presented with a brighter, easier-to-read dashboard that still keeps the core actions simple.',
    fact: defaultSpotlight('San Antonio'),
    theme: themes.coast,
  },
  {
    name: 'San Felipe',
    slug: 'san-felipe',
    landmark: '/landmarks/zambales/san-felipe/san_felipe_arko.png',
    spotlight: 'San Felipe residents see a local hero image, clearer hierarchy, and a guided “start here” section.',
    fact: defaultSpotlight('San Felipe'),
    theme: themes.sunset,
  },
  {
    name: 'San Marcelino',
    slug: 'san-marcelino',
    landmark: '/landmarks/zambales/san-marcelino/san_marcelino_municipal.png',
    spotlight: 'San Marcelino gets the same local-first treatment so the dashboard feels tied to the resident’s municipality.',
    fact: defaultSpotlight('San Marcelino'),
    theme: themes.forest,
  },
  {
    name: 'San Narciso',
    slug: 'san-narciso',
    landmark: '/landmarks/zambales/san-narciso/san_narciso_municipal.png',
    spotlight: 'San Narciso residents are welcomed with a municipality-aware hero instead of a generic banner.',
    fact: defaultSpotlight('San Narciso'),
    theme: themes.coast,
  },
  {
    name: 'Santa Cruz',
    slug: 'santa-cruz',
    landmark: '/landmarks/zambales/santa-cruz/Santa_Cruz_Municipal.png',
    spotlight: 'Santa Cruz uses the same About-page landmark artwork to make the resident dashboard feel more local and recognizable.',
    fact: defaultSpotlight('Santa Cruz'),
    theme: themes.royal,
  },
  {
    name: 'Subic',
    slug: 'subic',
    landmark: '/landmarks/zambales/subic/subic_municipality.png',
    spotlight: 'Subic residents get a stronger home screen with local branding, clearer actions, and first-step guidance.',
    fact: defaultSpotlight('Subic'),
    theme: themes.civic,
  },
]

const fallbackVisual: MunicipalityVisual = {
  name: 'Zambales',
  slug: 'zambales',
  landmark: '/assets/about.jpg',
  spotlight: 'MunLink connects residents to municipal services, updates, and community tools across Zambales.',
  fact: 'MunLink currently serves the 13 municipalities of Zambales.',
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
      spotlight: `${params.municipalityName} is connected to MunLink's resident services, updates, and community tools.`,
      fact: `${params.municipalityName} is part of the Zambales resident network in MunLink.`,
    }
  }

  return fallbackVisual
}
