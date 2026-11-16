import { ErrorState } from '@/components/ui/ErrorState'

interface DataGridErrorProps {
  error: string
  onRetry?: () => void
}

export function DataGridError({ error, onRetry }: DataGridErrorProps) {
  return <ErrorState title="Could not load rows" hint={error} onRetry={onRetry} />
}
