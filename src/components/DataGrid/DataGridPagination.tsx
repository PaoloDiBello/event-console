import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { formatCount } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { DataGridPageJump } from './DataGridPageJump'

interface DataGridPaginationProps {
  pageIndex: number
  pageSize: number
  pageCount: number
  totalRows: number
  pageSizeOptions: readonly number[]
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  itemLabel?: string
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-xs border border-line bg-raised text-muted transition-colors',
        'hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-35',
      )}
    >
      {children}
    </button>
  )
}

export function DataGridPagination({
  pageIndex,
  pageSize,
  pageCount,
  totalRows,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'rows',
}: DataGridPaginationProps) {
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-surface/80 px-3 py-2.5 text-xs text-muted">
      <p className="tnum">
        <span className="font-mono text-ink">
          {formatCount(firstRow)}–{formatCount(lastRow)}
        </span>{' '}
        of <span className="font-mono text-ink">{formatCount(totalRows)}</span> {itemLabel}
      </p>

      <label className="flex items-center gap-2">
        <span className="text-faint">Rows per page</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-8 rounded-xs border border-line bg-canvas px-2 font-mono text-xs text-ink focus:border-accent/60 focus:outline-none"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
        <DataGridPageJump
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
        <div className="flex items-center gap-1.5">
          <NavButton
            label="First page"
            disabled={pageIndex === 0}
            onClick={() => onPageChange(0)}
          >
            <ChevronsLeft aria-hidden="true" className="size-4" />
          </NavButton>
          <NavButton
            label="Previous page"
            disabled={pageIndex === 0}
            onClick={() => onPageChange(pageIndex - 1)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </NavButton>
          <NavButton
            label="Next page"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => onPageChange(pageIndex + 1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </NavButton>
          <NavButton
            label="Last page"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => onPageChange(Math.max(pageCount - 1, 0))}
          >
            <ChevronsRight aria-hidden="true" className="size-4" />
          </NavButton>
        </div>
      </div>
    </div>
  )
}
