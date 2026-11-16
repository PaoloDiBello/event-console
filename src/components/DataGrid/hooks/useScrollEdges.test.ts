import { describe, expect, it } from 'vitest'
import { scrollEdges } from './useScrollEdges'

const viewport = { scrollWidth: 1000, clientWidth: 400 }

describe('scrollEdges', () => {
  it('reports no overflow when the content fits', () => {
    expect(scrollEdges({ scrollLeft: 0, scrollWidth: 400, clientWidth: 400 })).toEqual({
      canScrollLeft: false,
      canScrollRight: false,
    })
  })

  it('offers only the right edge at the start', () => {
    expect(scrollEdges({ scrollLeft: 0, ...viewport })).toEqual({
      canScrollLeft: false,
      canScrollRight: true,
    })
  })

  it('offers both edges in the middle', () => {
    expect(scrollEdges({ scrollLeft: 300, ...viewport })).toEqual({
      canScrollLeft: true,
      canScrollRight: true,
    })
  })

  it('offers only the left edge at the end', () => {
    expect(scrollEdges({ scrollLeft: 600, ...viewport })).toEqual({
      canScrollLeft: true,
      canScrollRight: false,
    })
  })

  it('ignores a one-pixel rounding difference', () => {
    expect(scrollEdges({ scrollLeft: 0, scrollWidth: 401, clientWidth: 400 })).toEqual({
      canScrollLeft: false,
      canScrollRight: false,
    })
  })
})
