import { useRef, useState } from 'react'
import { formatCount } from '@/shared/lib/format'

interface DataGridPageJumpProps {
  pageIndex: number
  pageCount: number
  onPageChange: (pageIndex: number) => void
}

/**
 * Typed page navigation.
 *
 * `null` means "follow the grid"; a string means the user is editing a draft.
 * That avoids an effect fighting the input on every page change, and a
 * half-typed value never moves the grid.
 */
export function DataGridPageJump({
  pageIndex,
  pageCount,
  onPageChange,
}: DataGridPageJumpProps) {
  const safePageCount = Math.max(pageCount, 1)
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
  )
}
