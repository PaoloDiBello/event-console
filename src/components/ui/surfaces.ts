/**
 * The shell shared by both lenses on the event set: the registry table and the
 * agenda timeline are the same object — a panel with a toolbar, a scrolling
 * body and a status footer. Keeping the classes here means the chrome cannot
 * drift apart again.
 */

/** Outer panel: one rounded surface, one border, one shadow. */
export const panelClass =
  'flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-surface/60 shadow-2xl shadow-black/30'

/** Top row of a panel: search, view controls, actions. */
export const toolbarClass =
  'flex flex-wrap items-center gap-2 border-b border-line bg-surface/80 px-3 py-2.5'

/** Bottom status row of a panel: counts, paging, keyboard help. */
export const footerClass =
  'flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-surface/80 px-3 py-2.5 text-xs text-muted'

/** The raised pill used for the selected segment in a view switcher. */
export const selectedSegmentClass =
  'bg-raised text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)]'

/** Track that holds the segments of a view switcher. */
export const segmentTrackClass =
  'flex h-9 items-center rounded-md border border-line bg-canvas p-0.5'

/** One segment inside a switcher track. */
export const segmentClass = 'h-8 rounded-[5px] px-2.5 transition-colors'
