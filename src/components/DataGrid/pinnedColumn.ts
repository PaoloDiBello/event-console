/**
 * The first rendered column stays put while the rest of the table scrolls
 * under it, so a row keeps its identity mid-scan. The border is the frozen-pane
 * cue: it gives the passing columns a hard edge to disappear behind. (A drop
 * shadow is not an option — Chrome clips box-shadow on table cells.)
 *
 * Pinned at every width. In the registry the first column is the 32px
 * selection gutter, so pinning it costs almost nothing on a phone and keeps
 * the checkboxes from scrolling away with the data.
 *
 * The sticky cell must paint an opaque background; see the callers for that.
 */
export const pinnedColumnClass = 'sticky left-0 border-r border-line'
