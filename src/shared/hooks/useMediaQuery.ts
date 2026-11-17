import { useEffect, useState } from 'react'

/**
 * Track a CSS media query from JS.
 *
 * The grid uses this for decisions CSS cannot make on its own: which columns
 * are worth rendering on a phone, and whether the in-table filter row is
 * replaced by the filter sheet. Environments without `matchMedia` (jsdom, very
 * old browsers) report `true`, so the desktop layout — the one every control
 * is documented against — stays the default.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}
