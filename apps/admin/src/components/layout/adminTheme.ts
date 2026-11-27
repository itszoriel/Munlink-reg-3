import type { CSSProperties } from 'react'

export type AdminThemeName = 'super' | 'provincial' | 'municipal' | 'barangay'

type AdminThemeVars = CSSProperties & Record<`--${string}`, string>

// Every admin role shares the MunLink Zambales navy; the role is named in the
// header instead of being colour-coded.
const civicNavy: AdminThemeVars = {
    '--admin-accent-from': '#243d6b',
    '--admin-accent-to': '#243d6b',
    '--admin-accent-50': '#f2f5fa',
    '--admin-accent-100': '#e3e9f3',
    '--admin-accent-200': '#c5d1e5',
    '--admin-accent-600': '#2f4d82',
    '--admin-accent-700': '#243d6b',
    '--admin-accent-shadow': 'rgba(20, 35, 63, 0.18)',
    '--color-primary': '#243d6b',
    '--color-primary-hover': '#1c3157',
    '--color-primary-light': '#e3e9f3',
    '--ring': '#2f4d82',
  }

export const adminThemes: Record<AdminThemeName, AdminThemeVars> = {
  super: civicNavy,
  provincial: civicNavy,
  municipal: civicNavy,
  barangay: civicNavy,
} as const
