import type { FilterFn, Row } from '@tanstack/react-table'
import {
  asText,
  cellValue,
  columnId,
  valueById,
  type AnyColumn,
  type RowShim,
} from './accessors'

function includes(value: unknown, filterValue: unknown): boolean {
  return asText(value).toLowerCase().includes(asText(filterValue).toLowerCase())
}

function equalsString(value: unknown, filterValue: unknown): boolean {
  return asText(value).toLowerCase() === asText(filterValue).toLowerCase()
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
  if (filterFn === 'equals') return value === filterValue
  if (filterFn === 'weakEquals') return asText(value) === asText(filterValue)

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
