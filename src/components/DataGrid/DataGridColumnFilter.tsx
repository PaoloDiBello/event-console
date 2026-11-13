import type { Column } from '@tanstack/react-table'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { columnLabel } from './utils'

interface DataGridColumnFilterProps<TData> {
  column: Column<TData, unknown>
  disabled: boolean
  onChange: (column: Column<TData, unknown>, value: string | undefined) => void
}

/**
 * Shared shell for every filter control.
 *
 * An idle filter stays quiet; an applied one picks up the accent border and a
 * tinted fill, so scanning the row answers "which columns are narrowing this
 * view?" without reading the chip strip. Padding is set per control instead of
 * with `px-*` so the clear button and chevron never collide with text.
 */
const CONTROL_CLASS =
  'h-7 w-full rounded-xs border text-[11px] transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50'
const IDLE_CLASS = 'border-line/70 bg-canvas/60 text-muted hover:border-line-strong hover:bg-canvas'
const ACTIVE_CLASS = 'border-accent/45 bg-accent/10 text-ink hover:bg-accent/15'
const FOCUS_CLASS = 'focus:border-accent/70 focus:bg-canvas focus:ring-accent/25'

function ClearFilterButton({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear ${label} filter`}
      title={`Clear ${label} filter`}
      className="absolute top-1/2 right-0.5 grid size-6 -translate-y-1/2 place-items-center rounded-xs text-faint transition-colors hover:bg-raised hover:text-ink"
    >
      <X aria-hidden="true" className="size-3" />
    </button>
  )
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
  const controlClass = cn(CONTROL_CLASS, active ? ACTIVE_CLASS : IDLE_CLASS, FOCUS_CLASS)

  if (meta?.filter === 'select') {
    return (
      <div className="relative">
        <select
          aria-label={`Filter by ${label}`}
          value={stringValue}
          disabled={disabled}
          onChange={(event) => onChange(column, event.target.value || undefined)}
          className={cn(controlClass, 'cursor-pointer appearance-none pr-6 pl-2')}
        >
          <option value="">All</option>
          {(meta.filterOptions ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2 transition-colors',
            active ? 'text-accent' : 'text-faint',
          )}
        />
      </div>
    )
  }

  if (meta?.filter === 'text' || meta?.filter === 'date') {
    const isDate = meta.filter === 'date'
    return (
      <div className="relative">
        <input
          type={isDate ? 'date' : 'text'}
          aria-label={`Filter by ${label}`}
          value={stringValue}
          placeholder={isDate ? undefined : 'Filter…'}
          disabled={disabled}
          onChange={(event) => onChange(column, event.target.value || undefined)}
          className={cn(
            controlClass,
            isDate ? 'px-2' : 'pr-8 pl-2',
            align === 'right' && 'text-right',
          )}
        />
        {!isDate && active ? (
          <ClearFilterButton label={label} onClear={() => onChange(column, undefined)} />
        ) : null}
      </div>
    )
  }

  return null
}
