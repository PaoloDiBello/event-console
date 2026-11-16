import { useEffect, useState, type RefObject } from 'react'

export interface ScrollEdges {
  canScrollLeft: boolean
  canScrollRight: boolean
}

interface ScrollMetrics {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
}

/**
 * Which directions still have content. A one-pixel tolerance absorbs the
 * rounding difference browsers report at the end of a scroll.
 *
 * Pure and exported so it can be tested without a layout engine.
 */
export function scrollEdges({ scrollLeft, scrollWidth, clientWidth }: ScrollMetrics): ScrollEdges {
  const max = scrollWidth - clientWidth
  if (max <= 1) return { canScrollLeft: false, canScrollRight: false }
  return {
    canScrollLeft: scrollLeft > 1,
    canScrollRight: scrollLeft < max - 1,
  }
}

/**
 * Tracks whether a horizontally scrollable region has content off either edge.
 * The grid uses it to fade the edges, so a table wider than the phone is
 * visible as something you can swipe instead of a hard cut.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>): ScrollEdges {
  const [edges, setEdges] = useState<ScrollEdges>({ canScrollLeft: false, canScrollRight: false })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => setEdges(scrollEdges(element))
    update()

    element.addEventListener('scroll', update, { passive: true })

    // Toggling columns changes the table's width without resizing the
    // container, so observe both.
    const observer = new ResizeObserver(update)
    observer.observe(element)
    const table = element.querySelector('table')
    if (table) observer.observe(table)

    return () => {
      element.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [ref])

  return edges
}
