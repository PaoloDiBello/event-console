import { AlertTriangle, RotateCcw } from 'lucide-react'

interface DataGridErrorProps {
  error: string
  onRetry?: () => void
}

export function DataGridError({ error, onRetry }: DataGridErrorProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div
        role="alert"
        className="max-w-md rounded-md border border-rose/25 bg-rose/[0.06] p-6 text-center"
      >
        <AlertTriangle aria-hidden="true" className="mx-auto size-6 text-rose" />
        <h2 className="mt-3 text-sm font-semibold text-ink">Could not load rows</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-sm border border-rose/30 bg-rose/10 px-3 text-xs font-medium text-rose transition-colors hover:bg-rose/15"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Retry
          </button>
        ) : null}
      </div>
    </div>
  )
}
