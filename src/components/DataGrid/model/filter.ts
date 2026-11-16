import type { FilterFn, Row } from '@tanstack/react-table'
import {
  asText,
  cellValue,
  columnId,
  valueById,
  type AnyColumn,
  type RowShim,
} from './accessors'

/**
 * Select filters hold a list of chosen values, so "Meetings or Deploys" is one
 * filter with two values rather than two filters fighting each other. A single
 * value keeps working: a quick filter, a date and a shared link that names one
 * option all still produce scalar values.
 */
function matchesAny(filterValue: unknown, test: (candidate: unknown) => boolean): boolean {
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true
    return filterValue.some((candidate) => test(candidate))
  }
  return test(filterValue)
}

function includes(value: unknown, filterValue: unknown): boolean {
  return matchesAny(filterValue, (candidate) =>
    asText(value).toLowerCase().includes(asText(candidate).toLowerCase()),
  )
}

function equalsString(value: unknown, filterValue: unknown): boolean {
  return matchesAny(
    filterValue,
    (candidate) => asText(value).toLowerCase() === asText(candidate).toLowerCase(),
  )
}

/**
 * Evaluate one column filter. Custom functions receive the same shape they
 * would from TanStack (`row.original`, `row.getValue`) so column definitions
 * remain portable.
 */
function matchesColumnFilter<TData>(
  row: TData,
  column: AnyColumn<TData>,
  filterValue: unknown,
  columns: readonly AnyColumn<TData>[],
  index: number,
): boolean {
  const id = columnId(column)
  const value = cellValue(row, column, index)
  const filterFn = column.filterFn

  if (typeof filterFn === 'function') {
    const shim: RowShim<TData> = {
      original: row,
      getValue: (columnId) => valueById(row, columnId, columns, index),
    }
    return filterFn(
      shim as unknown as Row<TData>,
      id,
      filterValue,
      () => undefined,
    )
  }

  if (filterFn === 'equalsString') return equalsString(value, filterValue)
  if (filterFn === 'includesString') return includes(value, filterValue)
  if (filterFn === 'equals') return matchesAny(filterValue, (candidate) => value === candidate)
  if (filterFn === 'weakEquals')
    return matchesAny(filterValue, (candidate) => asText(value) === asText(candidate))

  // No explicit function: fall back to the filter control's semantics.
  switch (column.meta?.filter) {
    case 'select':
      return equalsString(value, filterValue)
    case 'date':
      return (
        asText(value) === asText(filterValue) ||
        asText(value).startsWith(`${asText(filterValue)}T`)
      )
    default:
      return includes(value, filterValue)
  }
}

function matchesGlobalFilter<TData>(
  row: TData,
  columns: readonly AnyColumn<TData>[],
  value: string,
  globalFilterFn: FilterFn<TData> | undefined,
  index: number,
): boolean {
  if (typeof globalFilterFn === 'function') {
    const shim: RowShim<TData> = {
      original: row,
      getValue: (columnId) => valueById(row, columnId, columns, index),
    }
    return globalFilterFn(
      shim as unknown as Row<TData>,
      '',
      value,
      () => undefined,
    )
  }

  // TanStack's default `auto` filter searches every column.
  return columns.some((column) => includes(cellValue(row, column, index), value))
}

export function rowMatchesFilters<TData>(
  row: TData,
  columns: readonly AnyColumn<TData>[],
  filters: readonly { id: string; value: unknown }[],
  query: string,
  globalFilterFn: FilterFn<TData> | undefined,
  index: number,
): boolean {
  for (const filter of filters) {
    const column = columns.find((candidate) => columnId(candidate) === filter.id)
    if (!column) continue
    if (!matchesColumnFilter(row, column, filter.value, columns, index)) return false
  }

  return query ? matchesGlobalFilter(row, columns, query, globalFilterFn, index) : true
}
