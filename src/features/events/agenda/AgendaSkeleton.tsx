import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { panelClass } from '@/components/ui/surfaces'

interface AgendaSkeletonProps {
  /** Keep the toolbar interactive while the rows load. */
  toolbar?: ReactNode
}

export function AgendaSkeleton({ toolbar }: AgendaSkeletonProps) {
  return (
    <div className={panelClass}>
      {toolbar}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
        <p className="mb-1 inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-faint uppercase">
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          Loading agenda
        </p>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-16 shrink-0 animate-pulse rounded-md border border-line/70 bg-raised/60"
            style={{ opacity: 1 - index * 0.12 }}
          />
        ))}
      </div>
    </div>
  )
}
