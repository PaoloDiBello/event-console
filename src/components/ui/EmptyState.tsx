import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  hint: string
  action?: ReactNode
  className?: string
  hintClassName?: string
}

/**
 * Shared layout for the "nothing to show" cases. The copy and the action stay
 * with the caller; this only owns the vertical rhythm and alignment.
 */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
  hintClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-24 text-center',
        className,
      )}
    >
      {icon}
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      <p className={cn('mt-1 max-w-sm text-xs text-muted', hintClassName)}>{hint}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
