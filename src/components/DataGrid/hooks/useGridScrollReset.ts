import { useEffect, type RefObject } from 'react'

interface GridScrollResetOptions {
  scrollRef: RefObject<HTMLDivElement | null>
  /** Changes whenever the visible page, sort or filters change. */
  resetKey: string
  /** A reveal already positioned the scroll container; do not undo it. */
  skipRef: RefObject<boolean>
}

/**
 * A fresh page/filter/sort should start at the top of the list, not halfway
 * down a scroll container that is now showing different rows.
 */
export function useGridScrollReset({ scrollRef, resetKey, skipRef }: GridScrollResetOptions) {
  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false
      return
    }
    scrollRef.current?.scrollTo({ top: 0 })
  }, [resetKey, scrollRef, skipRef])
}
