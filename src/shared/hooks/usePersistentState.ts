import { useEffect, useState } from 'react'

/**
 * State that outlives the tab.
 *
 * Display preferences — row density, which columns are shown — are decisions
 * the user makes once. Re-deciding them on every reload is the kind of small
 * tax that makes a tool feel like a demo, so they are stored here. This is
 * deliberately *not* view state: search, filters, sort and page belong in the
 * URL, where they can be shared and undone with the Back button.
 *
 * Reads are defensive. A hand-edited, corrupt or out-of-date value falls back
 * to the default rather than putting the UI into a state its controls cannot
 * express. Writes are best-effort: storage can be full, or blocked entirely.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  isValid: (value: unknown) => boolean,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return initial
      const parsed: unknown = JSON.parse(raw)
      return isValid(parsed) ? (parsed as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // A lost preference is not worth failing the page over.
    }
  }, [key, value])

  return [value, setValue] as const
}
