import { cn } from '@/shared/lib/cn'

/**
 * The visual half of the scroll hint: a soft fade at the edge with more
 * columns. Decorative only — the rows themselves stay the interactive surface.
 */
export function DataGridScrollFade({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-0 z-30 w-10',
        side === 'left'
          ? 'left-0 bg-linear-to-r from-surface via-surface/60 to-transparent'
          : 'right-0 bg-linear-to-l from-surface via-surface/60 to-transparent',
      )}
    />
  )
}
