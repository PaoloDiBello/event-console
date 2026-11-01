import { useEffect, useState } from 'react'

/**
 * A value that clears itself after `durationMs`.
 *
 * Toast messages and temporary row highlights both need the same timer
 * lifecycle; keeping it here means the cleanup rule is written once.
 */
export function useTransientValue<T>(durationMs: number) {
  const [value, setValue] = useState<T | null>(null)

  useEffect(() => {
    if (value === null) return
    const timer = window.setTimeout(() => setValue(null), durationMs)
    return () => window.clearTimeout(timer)
  }, [value, durationMs])

  return [value, setValue] as const
}
