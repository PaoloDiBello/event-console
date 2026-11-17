import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from './useMediaQuery'

type Listener = () => void

function stubMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>()
  const list = {
    matches: initial,
    media: '(min-width: 768px)',
    addEventListener: (_event: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_event: string, listener: Listener) => listeners.delete(listener),
  }
  window.matchMedia = vi.fn(() => list) as unknown as typeof window.matchMedia
  return {
    set(next: boolean) {
      list.matches = next
      for (const listener of listeners) listener()
    },
    listenerCount: () => listeners.size,
  }
}

const original = window.matchMedia

afterEach(() => {
  window.matchMedia = original
})

describe('useMediaQuery', () => {
  it('defaults to the desktop layout without matchMedia', () => {
    // jsdom has no matchMedia unless a test provides one; the grid relies on
    // this fallback so its filter-row tests keep exercising the wide layout.
    // @ts-expect-error - removing a DOM API for the duration of the test
    delete window.matchMedia

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(true)
  })

  it('reads the query and follows changes', () => {
    const media = stubMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)

    act(() => media.set(true))
    expect(result.current).toBe(true)

    act(() => media.set(false))
    expect(result.current).toBe(false)
  })

  it('stops listening when unmounted', () => {
    const media = stubMatchMedia(true)
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(media.listenerCount()).toBe(1)
    unmount()
    expect(media.listenerCount()).toBe(0)
  })
})
