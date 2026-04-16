const DEFAULT_PUBLIC_SITE_URL = 'https://munlink.up.railway.app'

function normalizeAbsoluteUrl(raw?: string | null): string | null {
  const value = raw?.trim()
  if (!value) return null

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function getRuntimeConfigPublicSiteUrl(): string | null {
  if (typeof window === 'undefined') return null
  return normalizeAbsoluteUrl(window.__MUNLINK_CONFIG__?.VITE_PUBLIC_SITE_URL)
}

function stripPrefixedSubdomain(hostname: string, prefix: string): string | null {
  if (hostname.startsWith(`${prefix}-`)) return hostname.slice(prefix.length + 1)
  if (hostname.startsWith(`${prefix}.`)) return hostname.slice(prefix.length + 1)
  return null
}

function inferFromCurrentLocation(): string | null {
  if (typeof window === 'undefined') return null

  const { protocol, hostname, port } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const currentPort = Number(port)
    const publicPort = !Number.isNaN(currentPort) && currentPort > 0
      ? (currentPort >= 3001 ? String(currentPort - 1) : '3000')
      : '3000'
    return `${protocol}//${hostname}:${publicPort}`
  }

  const publicHostname = stripPrefixedSubdomain(hostname, 'admin')
  if (!publicHostname) return null

  return `${protocol}//${publicHostname}`
}

function inferFromApiUrl(): string | null {
  const apiUrl = normalizeAbsoluteUrl(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)
  if (!apiUrl) return null

  try {
    const url = new URL(apiUrl)
    const publicHostname = stripPrefixedSubdomain(url.hostname, 'api')
    if (!publicHostname) return null
    url.hostname = publicHostname
    return url.origin
  } catch {
    return null
  }
}

export function resolvePublicSiteUrl(): string {
  return (
    getRuntimeConfigPublicSiteUrl() ||
    normalizeAbsoluteUrl(import.meta.env.VITE_PUBLIC_SITE_URL) ||
    inferFromCurrentLocation() ||
    inferFromApiUrl() ||
    DEFAULT_PUBLIC_SITE_URL
  )
}
