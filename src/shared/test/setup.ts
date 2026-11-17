import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// jsdom does not implement the browser APIs Radix and TanStack Virtual touch.
//
// Its `matchMedia` reports "no match" for everything, which would put every
// grid test on the phone layout. Evaluate the width queries the app uses
// against jsdom's 1024px viewport instead, so the default is the desktop
// layout the tests describe; a test that wants a phone stubs this itself.
function viewportMatches(query: string): boolean {
  const min = /min-width:\s*(\d+(?:\.\d+)?)px/.exec(query)
  const max = /max-width:\s*(\d+(?:\.\d+)?)px/.exec(query)
  if (min && window.innerWidth < Number(min[1])) return false
  if (max && window.innerWidth > Number(max[1])) return false
  return true
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: viewportMatches(query),
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
