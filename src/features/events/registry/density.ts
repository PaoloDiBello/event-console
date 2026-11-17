/** The three row heights offered by the density menu. */
export type RowDensity = 'compact' | 'comfortable' | 'spacious'

/** Pixel height handed to the grid's virtualizer for each density. */
export const ROW_HEIGHT: Record<RowDensity, number> = {
  compact: 32,
  comfortable: 44,
  spacious: 56,
}
