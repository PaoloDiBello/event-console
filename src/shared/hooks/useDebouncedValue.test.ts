import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'

function renderDebounced(initialValue: string) {
  return renderHook(
    ({ value }: { value: string }) => useDebouncedValue(value, 200),
    { initialProps: { value: initialValue } },
  )
}

describe('useDebouncedValue', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('holds the previous value until the delay has passed', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderDebounced('a')

    expect(result.current).toBe('a')

    rerender({ value: 'ab' })
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(199))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('ab')
  })

  it('restarts the timer when the value changes again', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderDebounced('a')

    rerender({ value: 'ab' })
    act(() => vi.advanceTimersByTime(150))
    rerender({ value: 'abc' })
    act(() => vi.advanceTimersByTime(150))

    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(50))
    expect(result.current).toBe('abc')
  })
})
