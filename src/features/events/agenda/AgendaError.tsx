import { ErrorState } from '@/components/ui/ErrorState'
import { panelClass } from '@/components/ui/surfaces'

interface AgendaErrorProps {
  error: string
  onRetry: () => void
}

/**
 * The agenda's load-failure panel. The registry already replaces its rows with
 * an error and a retry; the agenda must do the same instead of rendering an
 * empty (or stale) timeline as if the fetch had succeeded.
 */
export function AgendaError({ error, onRetry }: AgendaErrorProps) {
  return (
    <div className={panelClass}>
      <ErrorState title="Could not load events" hint={error} onRetry={onRetry} />
    </div>
  )
}
