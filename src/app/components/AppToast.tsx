interface AppToastProps {
  message: string | null
  /** Optional inline action, such as undoing the change being announced. */
  action?: { label: string; onClick: () => void }
}

/**
 * Success region: always mounted, polite live region. The message appears after
 * the dialog closes, so the user hears confirmation wherever focus was returned.
 */
export function AppToast({ message, action }: AppToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex justify-end px-1 sm:bottom-[calc(6rem+env(safe-area-inset-bottom))]"
    >
      {message ? (
        <div className="pointer-events-auto flex max-w-lg items-center gap-2.5 rounded-md border border-accent/30 bg-[#0b1716] px-4 py-2.5 text-xs text-ink shadow-2xl shadow-black/60">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent" />
          {message}
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              className="ml-1 shrink-0 rounded-xs px-1.5 py-0.5 text-[11px] font-semibold text-accent underline-offset-2 hover:underline focus-visible:ring-1 focus-visible:ring-accent/60 focus-visible:outline-none"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
