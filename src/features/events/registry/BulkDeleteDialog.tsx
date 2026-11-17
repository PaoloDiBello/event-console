import * as Dialog from '@radix-ui/react-dialog'
import { Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import type { EventRecord } from '@/features/events/model'
import { formatDayShort, formatMinute } from '@/shared/lib/dates'
import { pluralize } from '@/shared/lib/format'

interface BulkDeleteDialogProps {
  open: boolean
  /** The selected records. Only the first few are previewed. */
  events: readonly EventRecord[]
  /** Selected records the current filters no longer show. */
  outsideCount?: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** Enough to recognise the selection without turning the dialog into a table. */
const PREVIEW_LIMIT = 5

/**
 * Bulk delete asks before acting and names what it is about to remove. A bare
 * count is easy to trust and hard to verify, especially after the selection has
 * survived a page change or a filter; the preview is the check.
 */
export function BulkDeleteDialog({
  open,
  events,
  outsideCount = 0,
  onOpenChange,
  onConfirm,
}: BulkDeleteDialogProps) {
  const count = events.length
  const preview = events.slice(0, PREVIEW_LIMIT)
  const remaining = count - preview.length
  // The dialog is opened by state, not by a Radix trigger, so Radix cannot
  // infer where focus should go when it closes. Remember the control that had
  // it (the bar's Delete button) and hand it back.
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/65 backdrop-blur-[3px]" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            className="dialog-content pointer-events-auto w-full max-w-md overflow-hidden rounded-lg border border-line-strong bg-surface shadow-2xl shadow-black/70"
            onCloseAutoFocus={(event) => {
              if (!openerRef.current?.isConnected) return
              event.preventDefault()
              openerRef.current.focus({ preventScroll: true })
            }}
          >
            <div className="flex items-start gap-3 border-b border-line px-5 py-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-sm border border-rose/30 bg-rose/10">
                <Trash2 aria-hidden="true" className="size-4 text-rose" />
              </span>
              <div className="min-w-0">
                <Dialog.Title className="text-sm font-semibold text-ink">
                  Delete {count} {pluralize(count, 'event')}?
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-muted">
                  {count === 1 ? 'It is' : 'They are'} removed from the registry and the agenda.
                  {outsideCount > 0
                    ? ` ${outsideCount} of them ${outsideCount === 1 ? 'is' : 'are'} outside the current search and filters.`
                    : ''}{' '}
                  Undo stays available in the toast for a few seconds.
                </Dialog.Description>
              </div>
            </div>

            <ul
              aria-label="Events to delete"
              className="scrollbar-thin max-h-52 overflow-y-auto overscroll-contain px-5 py-3"
            >
              {preview.map((event) => (
                <li key={event.id} className="flex items-baseline gap-3 py-1 text-xs">
                  <span className="min-w-0 flex-1 truncate text-ink" title={event.title}>
                    {event.title}
                  </span>
                  <span className="tnum shrink-0 font-mono text-[10px] text-faint">
                    {formatDayShort(event.date)} · {formatMinute(event.startMinute)}
                  </span>
                </li>
              ))}
              {remaining > 0 ? (
                <li className="pt-1 font-mono text-[10px] tracking-wide text-faint">
                  and {remaining} more…
                </li>
              ) : null}
            </ul>

            <div className="flex items-center justify-end gap-2 border-t border-line bg-raised/40 px-5 py-3">
              <Dialog.Close asChild>
                <Button size="md" className="bg-canvas px-4">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                variant="danger"
                size="md"
                onClick={onConfirm}
                className="gap-1.5 px-4 font-semibold"
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
                Delete {count} {pluralize(count, 'event')}
              </Button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
