import type { Column } from '@tanstack/react-table'

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
