/**
 * The first visible column stays put while the rest of the table scrolls under
 * it, so a row keeps its identity mid-scan. The border is the frozen-pane cue:
 * it gives the passing columns a hard edge to disappear behind. (A drop shadow
 * is not an option — Chrome clips box-shadow on table cells.)
 *
 * Applied from `sm` up only. On a phone the first column is most of the
 * viewport, so pinning it would leave almost nothing to scroll through.
 */
export const pinnedColumnClass = 'sm:sticky sm:left-0 sm:border-r sm:border-line'
