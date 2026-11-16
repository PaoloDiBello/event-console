import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/shared/lib/cn'

interface ErrorStateProps {
  title: string
  hint: string
  onRetry?: () => void
  className?: string
}

/**
 * The one load-failure panel. Both views use it, so a failed fetch looks the
 * same whether it happened behind the table or behind the agenda.
 */
export function ErrorState({ title, hint, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex h-full items-center justify-center p-8', className)}>
      <div
        role="alert"
        className="max-w-md rounded-lg border border-rose/25 bg-rose/[0.06] p-6 text-center"
      >
        <AlertTriangle aria-hidden="true" className="mx-auto size-6 text-rose" />
        <h2 className="mt-3 text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>
        {onRetry ? (
          <Button variant="danger" onClick={onRetry} className="mt-4">
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  )
}
