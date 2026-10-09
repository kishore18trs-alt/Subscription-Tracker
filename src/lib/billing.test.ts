import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addCycles, daysUntil, monthlyCost, nextOccurrence, savedSince } from './billing'

describe('monthlyCost', () => {
  it('keeps monthly amounts unchanged', () => {
    expect(monthlyCost(10, 'monthly')).toBe(10)
  })

  it('spreads yearly and quarterly amounts across months', () => {
    expect(monthlyCost(120, 'yearly')).toBe(10)
    expect(monthlyCost(30, 'quarterly')).toBe(10)
  })

  it('converts weekly using 52 weeks per year', () => {
    expect(monthlyCost(12, 'weekly')).toBeCloseTo(52)
  })
})

describe('addCycles', () => {
  it('clamps month-end dates to the last day of shorter months', () => {
    expect(addCycles('2026-01-31', 'monthly', 1)).toBe('2026-02-28')
  })

  it('uses Feb 29 in leap years', () => {
    expect(addCycles('2028-01-31', 'monthly', 1)).toBe('2028-02-29')
    expect(addCycles('2028-02-29', 'yearly', 1)).toBe('2029-02-28')
  })

  it('does not drift after passing through a short month', () => {
    expect(addCycles('2026-01-31', 'monthly', 2)).toBe('2026-03-31')
  })

  it('handles quarterly and weekly cycles across year boundaries', () => {
    expect(addCycles('2026-11-30', 'quarterly', 1)).toBe('2027-02-28')
    expect(addCycles('2026-12-28', 'weekly', 1)).toBe('2027-01-04')
  })
})

describe('date helpers relative to today', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 15, 12)) // 15 May 2026, local noon
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('nextOccurrence returns today or future dates as-is', () => {
    expect(nextOccurrence('2026-05-15', 'monthly')).toBe('2026-05-15')
    expect(nextOccurrence('2026-06-01', 'monthly')).toBe('2026-06-01')
  })

  it('nextOccurrence rolls a past date forward, keeping the month-end anchor', () => {
    expect(nextOccurrence('2026-01-31', 'monthly')).toBe('2026-05-31')
  })

  it('daysUntil counts days forward and backward', () => {
    expect(daysUntil('2026-05-20')).toBe(5)
    expect(daysUntil('2026-05-10')).toBe(-5)
  })

  it('savedSince never goes negative for a future cancellation date', () => {
    expect(savedSince('2026-06-01', 10, 'monthly')).toBe(0)
  })
})
