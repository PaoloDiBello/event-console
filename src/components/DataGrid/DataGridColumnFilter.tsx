import type { Column } from '@tanstack/react-table'
import { cn } from '@/shared/lib/cn'
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
  const align = meta?.align
  const label = columnLabel(column)

  if (meta?.filter === 'select') {
    return (
      <select
        aria-label={`Filter by ${label}`}
        value={stringValue}
        disabled={disabled}
        onChange={(event) => onChange(column, event.target.value || undefined)}
        className={cn(
          'h-7 w-full rounded-xs border border-line bg-canvas px-1.5 text-[11px] text-muted',
          'focus:border-accent/60 focus:text-ink focus:outline-none disabled:opacity-50',
        )}
      >
        <option value="">All</option>
        {(meta.filterOptions ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (meta?.filter === 'text' || meta?.filter === 'date') {
    return (
      <input
        type={meta.filter === 'date' ? 'date' : 'text'}
        aria-label={`Filter by ${label}`}
        value={stringValue}
        placeholder={meta.filter === 'text' ? 'Filter…' : undefined}
        disabled={disabled}
        onChange={(event) => onChange(column, event.target.value || undefined)}
        className={cn(
          'h-7 w-full rounded-xs border border-line bg-canvas px-1.5 text-[11px] text-ink placeholder:text-faint/70',
          'focus:border-accent/60 focus:outline-none disabled:opacity-50',
          align === 'right' && 'text-right',
        )}
      />
    )
  }

  return null
}
