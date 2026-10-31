/** Number of active per-column filters. Global search is a query, not a filter. */
export function activeFilterCount(
  columnFilters: readonly { id: string; value: unknown }[],
): number {
  return columnFilters.filter(
    (filter) => filter.value !== undefined && filter.value !== '',
  ).length
}
