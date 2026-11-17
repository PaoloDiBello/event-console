/** The three row heights offered by the density menu. */
export type RowDensity = 'compact' | 'comfortable' | 'spacious'

/** Pixel height handed to the grid's virtualizer for each density. */
export const ROW_HEIGHT: Record<RowDensity, number> = {
  compact: 32,
  comfortable: 44,
  spacious: 56,
}

const DENSITIES = Object.keys(ROW_HEIGHT)

/**
 * Guard for the stored preference. An unknown density would hand the
 * virtualizer `undefined` and collapse every row to zero height, so a stale or
 * hand-edited value has to fall back to the default instead.
 */
export function isRowDensity(value: unknown): boolean {
  return typeof value === 'string' && DENSITIES.includes(value)
}
