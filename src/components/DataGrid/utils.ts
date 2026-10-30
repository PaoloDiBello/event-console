/** Number of active global + per-column filters, used for the clear-filters badge. */
export function activeFilterCount(
  columnFilters: readonly { id: string; value: unknown }[],
  globalFilter: unknown,
): number {
  const perColumn = columnFilters.filter(
    (filter) => filter.value !== undefined && filter.value !== '',
  ).length
  return perColumn + (globalFilter ? 1 : 0)
}
