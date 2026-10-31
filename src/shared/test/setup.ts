import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// jsdom does not implement the browser APIs Radix and TanStack Virtual touch.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub

Element.prototype.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}

// A non-zero viewport lets the virtualizer render its overscan range in tests.
HTMLElement.prototype.getBoundingClientRect = () => ({
  width: 1200,
  height: 640,
  top: 0,
  left: 0,
  bottom: 640,
  right: 1200,
  x: 0,
  y: 0,
  toJSON: () => ({}),
})
