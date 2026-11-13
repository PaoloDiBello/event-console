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
  onChange: (column: Column<TData, unknown>, value: string | undefined) => void
}

/**
 * One control in the filter row. The column definition decides the control
 * type; the header only has to place the cell.
 */
export function DataGridColumnFilter<TData>({
  column,
  disabled,
  onChange,
}: DataGridColumnFilterProps<TData>) {
  const meta = column.columnDef.meta
  const value = column.getFilterValue()
  const stringValue = typeof value === 'string' ? value : ''
  const active = stringValue !== ''
  const align = meta?.align
  const label = columnLabel(column)
  const controlClass = filterControlClass(active)

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
        value={stringValue}
        options={meta.filterOptions ?? []}
        disabled={disabled}
        onChange={(next) => onChange(column, next)}
      />
    )
  }

  if (meta?.filter === 'text') {
    return (
      <div className="relative">
        <input
          type="text"
          aria-label={`Filter by ${label}`}
          value={stringValue}
          placeholder="Filter…"
          disabled={disabled}
          onChange={(event) => onChange(column, event.target.value || undefined)}
          className={cn(controlClass, 'pr-8 pl-2', align === 'right' && 'text-right')}
        />
        {active ? (
          <DataGridFilterClear label={label} onClear={() => onChange(column, undefined)} />
        ) : null}
      </div>
    )
  }

  return null
}
