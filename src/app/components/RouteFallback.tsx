import { Loader2 } from 'lucide-react'
import { panelClass } from '@/components/ui/surfaces'
import { cn } from '@/shared/lib/cn'

export function RouteFallback() {
  return (
    <div role="status" className={cn(panelClass, 'flex-row items-center justify-center gap-2')}>
      <Loader2 aria-hidden="true" className="size-4 animate-spin text-faint" />
      <span className="text-xs text-muted">Loading view…</span>
    </div>
  )
}
