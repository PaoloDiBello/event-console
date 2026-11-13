import { X } from 'lucide-react'

interface DataGridFilterClearProps {
  label: string
  onClear: () => void
}

/**
 * The one-click reset that appears inside an applied text or date filter.
 * Selects reset through their own "All" option; every filter type can also be
 * removed from the chip strip above the table.
 */
export function DataGridFilterClear({ label, onClear }: DataGridFilterClearProps) {
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
