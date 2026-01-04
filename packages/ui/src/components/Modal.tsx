import React, { useEffect } from 'react'

export type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  /** Size variant: 'sm' (max-w-md), 'md' (max-w-2xl, default), 'lg' (max-w-4xl), 'xl' (max-w-6xl), 'full' (full screen on all) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-4xl',
  xl: 'sm:max-w-6xl',
  full: 'max-w-full h-full',
}

export const Modal: React.FC<ModalProps> = ({ open, onOpenChange, title, children, footer, className, size = 'md' }) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false) }
    window.addEventListener('keydown', onKey)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  if (!open) return null
  
  const isFullSize = size === 'full'
  
  return (
    <div
      className={`fixed inset-0 z-50 flex ${isFullSize ? 'items-stretch' : 'items-end sm:items-center'} justify-center ${isFullSize ? '' : 'pb-20 md:pb-0'}`}
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[95vh] sm:max-h-[90vh] flex flex-col bg-[var(--color-card,#fff)] text-[var(--color-card-foreground,#111)] border border-[var(--color-border,#e5e7eb)] shadow-2xl ${isFullSize ? 'rounded-none' : 'rounded-t-2xl sm:rounded-2xl'} ${className || ''}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {(title !== undefined) && (
          <div className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b border-[var(--color-border,#e5e7eb)] flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button 
              onClick={() => onOpenChange(false)} 
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</div>
        {footer !== undefined ? (
          <div className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-[var(--color-border,#e5e7eb)] bg-[var(--color-card,#fff)]">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}


