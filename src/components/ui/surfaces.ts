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

/**
 * The selected segment of a switcher: the accent itself, not a slightly lighter
 * grey. A raised chip inside a recessed track reads as a box in a box, and on a
 * dark surface the 6% step between `raised` and `canvas` is almost invisible, so
 * the choice had to be hunted for in the label weight. A tinted capsule with a
 * one-pixel accent edge says "you are here" at a glance, and both switchers —
 * the registry/agenda lens and the agenda's day window — speak it.
 */
export const selectedSegmentClass =
  'bg-gradient-to-b from-accent/20 to-accent/[0.07] text-ink ring-1 ring-accent/60 ring-inset shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06),0_0_16px_-8px_var(--color-accent)]'

/** Track that holds the segments of a view switcher: recessed capsule. */
export const segmentTrackClass =
  'flex h-8 items-center overflow-hidden rounded-full border border-line bg-canvas p-0.5 shadow-[inset_0_1px_2px_rgb(0_0_0_/_0.4)]'

/** One segment inside a switcher track. */
export const segmentClass = 'h-7 rounded-full px-2.5 transition-colors'
