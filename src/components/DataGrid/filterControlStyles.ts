import { cn } from '@/shared/lib/cn'

/**
 * Shared shell for every control in the column-filter row.
 *
 * An idle filter stays quiet; an applied one picks up the accent border and a
 * tinted fill, so scanning the row answers "which columns are narrowing this
 * view?" without reading the chip strip. Padding is set per control instead of
 * with `px-*` so the clear button, chevron and date text never collide.
 */
export const FILTER_CONTROL_CLASS =
  'h-8 w-full rounded-xs border text-[11px] transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 sm:h-7'

const FILTER_IDLE_CLASS =
  'border-line/70 bg-canvas/60 text-muted hover:border-line-strong hover:bg-canvas'

const FILTER_ACTIVE_CLASS = 'border-accent/45 bg-accent/10 text-ink hover:bg-accent/15'

const FILTER_FOCUS_CLASS = 'focus:border-accent/70 focus:bg-canvas focus:ring-accent/25'

export function filterControlClass(active: boolean) {
  return cn(
    FILTER_CONTROL_CLASS,
    active ? FILTER_ACTIVE_CLASS : FILTER_IDLE_CLASS,
    FILTER_FOCUS_CLASS,
  )
}
