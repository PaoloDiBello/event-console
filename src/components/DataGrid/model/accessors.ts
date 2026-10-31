import type { ColumnDef } from '@tanstack/react-table'

export type AnyColumn<TData> = ColumnDef<TData, unknown>

export interface RowShim<TData> {
  original: TData
  getValue: (columnId: string) => unknown
}

export function columnId<TData>(column: AnyColumn<TData>): string {
  if (column.id) return column.id
  if ('accessorKey' in column && typeof column.accessorKey === 'string') {
    return column.accessorKey
  }
  return ''
}

function readPath(row: unknown, path: string): unknown {
  if (!path.includes('.')) return (row as Record<string, unknown>)[path]
  let current: unknown = row
  for (const part of path.split('.')) {
    if (current == null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function cellValue<TData>(
  row: TData,
  column: AnyColumn<TData>,
  index = 0,
): unknown {
  if ('accessorFn' in column && column.accessorFn) {
    return column.accessorFn(row, index)
  }
  if ('accessorKey' in column && typeof column.accessorKey === 'string') {
    return readPath(row, column.accessorKey)
  }
  return undefined
}

export function valueById<TData>(
  row: TData,
  id: string,
  columns: readonly AnyColumn<TData>[],
  index = 0,
): unknown {
  const column = columns.find((candidate) => columnId(candidate) === id)
  return column ? cellValue(row, column, index) : undefined
}

export function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

export function asText(value: unknown): string {
  return value == null ? '' : String(value)
}
