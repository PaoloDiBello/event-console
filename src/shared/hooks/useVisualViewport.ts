import { useEffect } from 'react'

/**
 * Publishes the visual viewport to CSS as `--vv-height` and `--vv-offset-top`.
 *
 * On iOS the layout viewport does not shrink when the on-screen keyboard opens
 * — only the visual viewport does — so a panel sized in `dvh` keeps its footer
 * underneath the keyboard. Fixed elements are also laid out against the layout
 * viewport, which is why the offset is published too.
 *
 * The variables are read with a `100dvh`/`0px` fallback, so browsers without
 * `visualViewport` (and tests) keep the previous behaviour.
 */
export function useVisualViewport() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const root = document.documentElement
    const sync = () => {
      root.style.setProperty('--vv-height', `${viewport.height}px`)
      root.style.setProperty('--vv-offset-top', `${viewport.offsetTop}px`)
    }

    sync()
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)

    return () => {
      viewport.removeEventListener('resize', sync)
      viewport.removeEventListener('scroll', sync)
      root.style.removeProperty('--vv-height')
      root.style.removeProperty('--vv-offset-top')
    }
  }, [])
}
