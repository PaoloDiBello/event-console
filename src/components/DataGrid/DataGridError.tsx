import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface DataGridErrorProps {
  error: string
  onRetry?: () => void
}

export function DataGridError({ error, onRetry }: DataGridErrorProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div
        role="alert"
        className="max-w-md rounded-lg border border-rose/25 bg-rose/[0.06] p-6 text-center"
      >
        <AlertTriangle aria-hidden="true" className="mx-auto size-6 text-rose" />
        <h2 className="mt-3 text-sm font-semibold text-ink">Could not load rows</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{error}</p>
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
