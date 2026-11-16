import type { Column } from '@tanstack/react-table'
import { cn } from '@/shared/lib/cn'
import { DataGridDateFilter } from './DataGridDateFilter'
import { DataGridFilterClear } from './DataGridFilterClear'
import { DataGridSelectFilter } from './DataGridSelectFilter'
import { filterControlClass } from './filterControlStyles'
import { columnLabel } from './utils'

interface DataGridColumnFilterProps<TData> {
  column: Column<TData, unknown>
  disabled: boolean
  onChange: (column: Column<TData, unknown>, value: string | string[] | undefined) => void
  /** Row counts for a select column's options, read when its menu opens. */
  getFacetCounts?: (columnId: string) => Record<string, number>
}

/**
 * One control in the filter row. The column definition decides the control
 * type; the header only has to place the cell.
 */
export function DataGridColumnFilter<TData>({
  column,
  disabled,
  onChange,
  getFacetCounts,
}: DataGridColumnFilterProps<TData>) {
  const meta = column.columnDef.meta
  const value = column.getFilterValue()
  const stringValue = typeof value === 'string' ? value : ''
  const values = Array.isArray(value) ? value.map(String) : stringValue ? [stringValue] : []
  const align = meta?.align
  const label = columnLabel(column)

  if (meta?.filter === 'date') {
    return (
      <DataGridDateFilter
        label={label}
        value={stringValue}
        disabled={disabled}
        onChange={(next) => onChange(column, next)}
      />
    )
  }

  if (meta?.filter === 'select') {
    return (
      <DataGridSelectFilter
        label={label}
        values={values}
        options={meta.filterOptions ?? []}
        disabled={disabled}
        onChange={(next) => onChange(column, next)}
        getCounts={getFacetCounts ? () => getFacetCounts(column.id) : undefined}
      />
    )
  }

  if (meta?.filter === 'text') {
    const active = stringValue !== ''
    return (
      <div className="relative">
        <input
          type="text"
          aria-label={`Filter by ${label}`}
          value={stringValue}
          placeholder="Filter…"
          disabled={disabled}
          data-grid-filter=""
          onChange={(event) => onChange(column, event.target.value || undefined)}
          className={cn(
            filterControlClass(active),
            'pr-8 pl-2',
            align === 'right' && 'text-right',
          )}
        />
        {active ? (
          <DataGridFilterClear label={label} onClear={() => onChange(column, undefined)} />
        ) : null}
      </div>
    )
  }

  return null
}
