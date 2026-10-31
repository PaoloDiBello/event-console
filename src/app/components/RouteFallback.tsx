import { Loader2 } from 'lucide-react'

export function RouteFallback() {
  return (
    <div
      role="status"
      className="flex h-full items-center justify-center rounded-lg border border-line bg-surface/60"
    >
      <Loader2 aria-hidden="true" className="size-4 animate-spin text-faint" />
      <span className="ml-2 text-xs text-muted">Loading view…</span>
    </div>
  )
}
