interface AppToastProps {
  message: string | null
}

/**
 * Success region: always mounted, polite live region. The message appears after
 * the dialog closes, so the user hears confirmation wherever focus was returned.
 */
export function AppToast({ message }: AppToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-20 z-50 flex justify-end px-1 sm:bottom-24"
    >
      {message ? (
        <div className="pointer-events-auto flex max-w-lg items-center gap-2.5 rounded-md border border-accent/30 bg-[#0b1716] px-4 py-2.5 text-xs text-ink shadow-2xl shadow-black/60">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent" />
          {message}
        </div>
      ) : null}
    </div>
  )
}
