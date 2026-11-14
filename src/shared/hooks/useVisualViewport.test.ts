import { renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useVisualViewport } from './useVisualViewport'

const root = document.documentElement

afterEach(() => {
  vi.unstubAllGlobals()
  root.style.removeProperty('--vv-height')
  root.style.removeProperty('--vv-offset-top')
})

it('publishes the visual viewport to CSS and follows keyboard resizes', () => {
  const listeners = new Map<string, () => void>()
  const viewport = {
    height: 420,
    offsetTop: 60,
    addEventListener: (type: string, handler: () => void) => {
      listeners.set(type, handler)
    },
    removeEventListener: (type: string) => {
      listeners.delete(type)
    },
  }
  vi.stubGlobal('visualViewport', viewport)

  const { unmount } = renderHook(() => useVisualViewport())

  expect(root.style.getPropertyValue('--vv-height')).toBe('420px')
  expect(root.style.getPropertyValue('--vv-offset-top')).toBe('60px')

  // The on-screen keyboard opens: the visual viewport shrinks and scrolls.
  viewport.height = 300
  viewport.offsetTop = 120
  listeners.get('resize')?.()

  expect(root.style.getPropertyValue('--vv-height')).toBe('300px')
  expect(root.style.getPropertyValue('--vv-offset-top')).toBe('120px')

  unmount()

  expect(root.style.getPropertyValue('--vv-height')).toBe('')
  expect(root.style.getPropertyValue('--vv-offset-top')).toBe('')
  expect(listeners.size).toBe(0)
})

it('does nothing where the visual viewport is unavailable', () => {
  vi.stubGlobal('visualViewport', undefined)

  renderHook(() => useVisualViewport())

  expect(root.style.getPropertyValue('--vv-height')).toBe('')
})
