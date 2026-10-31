import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 font-mono text-[10px] font-medium tracking-[0.12em] text-faint uppercase"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="text-accent">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        // role=alert: the message is announced as soon as it appears, including
        // after a submit that never left the dialog.
        <p id={`${htmlFor}-error`} role="alert" className="text-[11px] leading-snug text-rose">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[11px] leading-snug text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
