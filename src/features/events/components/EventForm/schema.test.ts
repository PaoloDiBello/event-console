import { describe, expect, it } from 'vitest'
import { isRealIsoDay, parseTimeToMinute } from './schema'

describe('isRealIsoDay', () => {
  it('accepts real calendar days', () => {
    expect(isRealIsoDay('2026-10-29')).toBe(true)
    expect(isRealIsoDay('2024-02-29')).toBe(true)
  })

  it('rejects impossible days and loose formats', () => {
    expect(isRealIsoDay('2026-02-30')).toBe(false)
    expect(isRealIsoDay('2025-02-29')).toBe(false)
    expect(isRealIsoDay('2026-2-3')).toBe(false)
    expect(isRealIsoDay('')).toBe(false)
  })
})

describe('parseTimeToMinute', () => {
  it('converts HH:MM to minutes from midnight', () => {
    expect(parseTimeToMinute('09:30')).toBe(570)
    expect(parseTimeToMinute('00:00')).toBe(0)
    expect(parseTimeToMinute('23:59')).toBe(1439)
  })
})
