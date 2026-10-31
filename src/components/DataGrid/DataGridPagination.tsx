import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { formatCount } from '@/lib/format'
import { cn } from '@/lib/cn'

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
  const safePageCount = Math.max(pageCount, 1)

  // `null` means "follow the grid"; a string means the user is editing a
  // draft. This avoids an effect that would fight the input on every page
  // change, and a half-typed value never moves the grid.
  const [pageDraft, setPageDraft] = useState<string | null>(null)
  const cancelBlurRef = useRef(false)
  const pageValue = pageDraft ?? String(pageIndex + 1)

  const commitPage = () => {
    const parsed = Number.parseInt(pageDraft ?? String(pageIndex + 1), 10)
    setPageDraft(null)
    if (!Number.isFinite(parsed)) return
    const nextIndex = Math.min(Math.max(parsed, 1), safePageCount) - 1
    if (nextIndex !== pageIndex) onPageChange(nextIndex)
  }

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
        <label className="mr-1 flex shrink-0 items-center gap-1.5 font-mono text-[11px] whitespace-nowrap text-faint">
          <span className="hidden min-[380px]:inline">Page</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            spellCheck={false}
            aria-label={`Page number, 1 to ${formatCount(safePageCount)}`}
            title="Type a page number and press Enter"
            value={pageValue}
            disabled={safePageCount <= 1}
            onChange={(event) => setPageDraft(event.target.value.replace(/\D/g, ''))}
            onFocus={(event) => {
              setPageDraft(String(pageIndex + 1))
              event.currentTarget.select()
            }}
            onBlur={() => {
              if (cancelBlurRef.current) {
                cancelBlurRef.current = false
                setPageDraft(null)
                return
              }
              commitPage()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitPage()
                event.currentTarget.select()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                // Cancel the edit and skip the blur commit that follows.
                cancelBlurRef.current = true
                setPageDraft(null)
                event.currentTarget.blur()
              }
            }}
            className="tnum h-7 w-14 rounded-xs border border-line bg-canvas px-1.5 text-center text-[11px] text-ink transition-colors focus:border-accent/60 focus:outline-none disabled:opacity-50"
          />
          <span className="tnum whitespace-nowrap">/ {formatCount(safePageCount)}</span>
        </label>
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
