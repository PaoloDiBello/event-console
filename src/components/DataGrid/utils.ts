import type { Column, Table } from '@tanstack/react-table'

/** Number of active per-column filters. Global search is a query, not a filter. */
export function activeFilterCount(
  columnFilters: readonly { id: string; value: unknown }[],
): number {
  return columnFilters.filter(
    (filter) => filter.value !== undefined && filter.value !== '',
  ).length
}

/**
 * The string label for a column, used by the header and the visibility menu.
 * Header renderers may be nodes; in that case fall back to the column id.
 */
export function columnLabel<TData>(
  column: Column<TData, unknown> | undefined,
  fallback = '',
): string {
  if (!column) return fallback
  return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id
}

/** One active filter, rendered as a removable chip. */
export interface FilterChip {
  id: string
  label: string
  value: string
}

/**
 * Turn filter state into chips the user can read and remove one at a time.
 *
 * This reads `columnFilters`, not the header row, so a filter on a hidden
 * column still gets a chip instead of becoming invisible and stuck.
 */
export function filterChips<TData>(
  table: Table<TData>,
  columnFilters: readonly { id: string; value: unknown }[],
): FilterChip[] {
  return columnFilters
    .filter((filter) => filter.value !== undefined && filter.value !== '')
    .map((filter) => {
      const column = table.getColumn(filter.id)
      const raw = String(filter.value)
      const option = column?.columnDef.meta?.filterOptions?.find(
        (candidate) => candidate.value === raw,
      )
      return {
        id: filter.id,
        label: columnLabel(column, filter.id),
        value: option?.label ?? raw,
      }
    })
}
