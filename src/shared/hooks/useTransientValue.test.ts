import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTransientValue } from './useTransientValue'

describe('useTransientValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clears the value once the duration has passed', () => {
    const { result } = renderHook(() => useTransientValue<string>(5000))

    act(() => result.current[1]('3 events deleted.'))
    expect(result.current[0]).toBe('3 events deleted.')

    act(() => void vi.advanceTimersByTime(5000))
    expect(result.current[0]).toBeNull()
  })

  it('holds while paused and resumes with the time that was left', () => {
    const { result, rerender } = renderHook(
      ({ paused }: { paused: boolean }) => useTransientValue<string>(5000, { paused }),
      { initialProps: { paused: false } },
    )

    act(() => result.current[1]('3 events deleted.'))
    act(() => void vi.advanceTimersByTime(4000))

    // Hovering the undo action must not let the message expire under the
    // pointer: one second was left, and it is still one second later.
    rerender({ paused: true })
    act(() => void vi.advanceTimersByTime(60_000))
    expect(result.current[0]).toBe('3 events deleted.')

    rerender({ paused: false })
    act(() => void vi.advanceTimersByTime(900))
    expect(result.current[0]).toBe('3 events deleted.')

    act(() => void vi.advanceTimersByTime(200))
    expect(result.current[0]).toBeNull()
  })

  it('gives a new message the full duration after a paused one', () => {
    const { result, rerender } = renderHook(
      ({ paused }: { paused: boolean }) => useTransientValue<string>(5000, { paused }),
      { initialProps: { paused: false } },
    )

    act(() => result.current[1]('first'))
    act(() => void vi.advanceTimersByTime(4500))
    rerender({ paused: true })

    act(() => result.current[1]('second'))
    rerender({ paused: false })

    act(() => void vi.advanceTimersByTime(4900))
    expect(result.current[0]).toBe('second')

    act(() => void vi.advanceTimersByTime(200))
    expect(result.current[0]).toBeNull()
  })
})
