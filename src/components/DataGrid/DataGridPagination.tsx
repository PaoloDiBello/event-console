import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { buttonClass } from '@/components/ui/buttonStyles'
import { footerClass } from '@/components/ui/surfaces'
import { formatCount } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { DataGridPageJump } from './DataGridPageJump'
import { DataGridPageSize } from './DataGridPageSize'

interface DataGridPaginationProps {
  pageIndex: number
  pageSize: number
  pageCount: number
  totalRows: number
  /** Rows before search and filters, used to explain a narrowed result set. */
  sourceRows?: number
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
        buttonClass({ size: 'icon-sm' }),
        'rounded-xs',
        'disabled:cursor-not-allowed disabled:opacity-35',
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
  sourceRows,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'rows',
}: DataGridPaginationProps) {
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min(totalRows, (pageIndex + 1) * pageSize)

  return (
    <div className={footerClass}>
      <p className="tnum">
        <span className="font-mono text-ink">
          {formatCount(firstRow)}–{formatCount(lastRow)}
        </span>{' '}
        of <span className="font-mono text-ink">{formatCount(totalRows)}</span> {itemLabel}
      </p>

      {sourceRows !== undefined && sourceRows !== totalRows ? (
        <p className="text-faint">
          filtered from <span className="font-mono">{formatCount(sourceRows)}</span>
        </p>
      ) : null}

      <DataGridPageSize
        pageSize={pageSize}
        options={pageSizeOptions}
        onChange={onPageSizeChange}
      />

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
