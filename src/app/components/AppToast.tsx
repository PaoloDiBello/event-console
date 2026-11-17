import { X } from 'lucide-react'

interface AppToastProps {
  message: string | null
  /** Optional inline action, such as undoing the change being announced. */
  action?: { label: string; onClick: () => void }
  /** Puts the message away instead of waiting for it to expire. */
  onDismiss: () => void
}

/**
 * Success region: always mounted, so the live region exists before a message
 * arrives. The message appears after the dialog closes, so the user hears the
 * confirmation wherever focus was returned.
 *
 * Only the sentence is live. An interactive Undo inside a `role="status"` is
 * announced as part of the text and is awkward to reach while the announcement
 * is still being read, so the button sits beside the region, not in it. The
 * message can also be dismissed: six seconds is a long time to have something
 * sitting over the last rows, and the user may have already read it.
 */
export function AppToast({ message, action, onDismiss }: AppToastProps) {
  return (
    <div className="pointer-events-none fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex justify-end px-1 sm:bottom-[calc(6rem+env(safe-area-inset-bottom))]">
      {message ? (
        <div className="pointer-events-auto flex max-w-lg items-center gap-2 rounded-md border border-accent/30 bg-[#0b1716] py-2 pr-1.5 pl-3.5 text-xs text-ink shadow-2xl shadow-black/60">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent" />
          <p role="status" aria-live="polite" className="min-w-0">
            {message}
          </p>
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              className="ml-0.5 shrink-0 rounded-xs px-1.5 py-0.5 text-[11px] font-semibold text-accent underline-offset-2 hover:underline focus-visible:ring-1 focus-visible:ring-accent/60 focus-visible:outline-none"
            >
              {action.label}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            title="Dismiss"
            className="grid size-6 shrink-0 place-items-center rounded-xs text-faint transition-colors hover:bg-raised hover:text-ink focus-visible:ring-1 focus-visible:ring-accent/60 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
