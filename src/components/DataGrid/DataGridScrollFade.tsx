import { cn } from '@/shared/lib/cn'

interface DataGridScrollFadeProps {
  side: 'left' | 'right'
  /** Lets the caller hide a fade at a breakpoint where nothing is pinned. */
  className?: string
}

/**
 * The visual half of the scroll hint: a soft fade at the edge with more
 * columns. Decorative only — the rows themselves stay the interactive surface.
 */
export function DataGridScrollFade({ side, className }: DataGridScrollFadeProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 z-30 w-10',
        side === 'left'
          ? 'left-0 bg-linear-to-r from-surface via-surface/60 to-transparent'
          : 'right-0 bg-linear-to-l from-surface via-surface/60 to-transparent',
        className,
      )}
    />
  )
}
