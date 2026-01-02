import React from 'react'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
  /** Optional icon to show at the start of the input */
  leadingIcon?: React.ReactNode
  /** Optional icon to show at the end of the input */
  trailingIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leadingIcon, trailingIcon, ...props },
  ref
) {
  const base = 'w-full rounded-md border px-3 py-2 bg-[var(--color-card)] text-[var(--color-card-foreground)] placeholder:text-[color:var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]'
  const border = invalid ? 'border-red-500 focus:ring-red-500' : 'border-[var(--color-border)]'
  const paddingLeft = leadingIcon ? 'pl-10' : ''
  const paddingRight = trailingIcon ? 'pr-10' : ''
  
  if (leadingIcon || trailingIcon) {
    return (
      <div className="relative">
        {leadingIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[color:var(--color-muted)]">
            {leadingIcon}
          </div>
        )}
        <input ref={ref} className={`${base} ${border} ${paddingLeft} ${paddingRight} ${className || ''}`.trim()} {...props} />
        {trailingIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[color:var(--color-muted)]">
            {trailingIcon}
          </div>
        )}
      </div>
    )
  }
  
  return <input ref={ref} className={`${base} ${border} ${className || ''}`.trim()} {...props} />
})


