import { Link } from 'react-router-dom'
import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLang } from '@/lib/i18n'

// Custom event to close other location dropdowns (shared with ProvinceSelect/MunicipalitySelect)
const CLOSE_LOCATION_DROPDOWNS = 'munlink:closeLocationDropdowns'

export default function ServicesMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close this dropdown when another location dropdown opens
  useEffect(() => {
    const handleCloseOthers = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.source !== 'services') {
        setIsOpen(false)
      }
    }
    window.addEventListener(CLOSE_LOCATION_DROPDOWNS, handleCloseOthers)
    return () => window.removeEventListener(CLOSE_LOCATION_DROPDOWNS, handleCloseOthers)
  }, [])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleToggle = useCallback(() => {
    const newState = !isOpen
    if (newState) {
      // Dispatch event to close other dropdowns
      window.dispatchEvent(new CustomEvent(CLOSE_LOCATION_DROPDOWNS, { detail: { source: 'services' } }))
    }
    setIsOpen(newState)
  }, [isOpen])

  const close = () => setIsOpen(false)
  const { t } = useLang()

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1 px-2.5 py-2 text-sm font-medium rounded-md text-slate-700 hover:text-navy-800 hover:bg-slate-100 transition-colors"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {t('Services', 'Serbisyo')}
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-60 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg z-50" role="menu">
          <Link to="/programs" onClick={close} role="menuitem" className="block rounded px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">{t('Benefit programs', 'Mga programang tulong')}</Link>
          <Link to="/problems" onClick={close} role="menuitem" className="block rounded px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">{t('Report a problem', 'Mag-ulat ng problema')}</Link>
          <Link to="/marketplace" onClick={close} role="menuitem" className="block rounded px-3 py-2 text-sm text-slate-800 hover:bg-slate-100">{t('Community marketplace', 'Palengke ng komunidad')}</Link>
        </div>
      )}
    </div>
  )
}
