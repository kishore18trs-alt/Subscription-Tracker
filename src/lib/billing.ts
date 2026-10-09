import type { BillingCycle } from './types'

export const CYCLE_LABEL: Record<BillingCycle, string> = {
  weekly: 'week',
  monthly: 'month',
  quarterly: '3 months',
  yearly: 'year',
}

const PER_MONTH: Record<BillingCycle, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
}

export function monthlyCost(amount: number, cycle: BillingCycle) {
  return amount * PER_MONTH[cycle]
}

/** Today's date in the user's local time zone as YYYY-MM-DD. */
export function todayISO() {
  return new Date().toLocaleDateString('en-CA')
}

/** Parse YYYY-MM-DD as a local date (not UTC, which would shift the day). */
export function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toISO(date: Date) {
  return date.toLocaleDateString('en-CA')
}

function addMonths(iso: string, months: number) {
  const start = parseISODate(iso)
  const target = new Date(start.getFullYear(), start.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(start.getDate(), lastDay)) // Jan 31 + 1 month → Feb 28
  return toISO(target)
}

export function addDays(iso: string, days: number) {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

/** Money not spent since `cancelledAt`, at the subscription's monthly rate. */
export function savedSince(cancelledAt: string, amount: number, cycle: BillingCycle) {
  const months = (Date.now() - new Date(cancelledAt).getTime()) / (86_400_000 * 30.44)
  return Math.max(0, months) * monthlyCost(amount, cycle)
}

/** The date `n` billing cycles after `iso`, always measured from `iso` so month-end days don't drift. */
export function addCycles(iso: string, cycle: BillingCycle, n: number) {
  switch (cycle) {
    case 'weekly':
      return addDays(iso, 7 * n)
    case 'monthly':
      return addMonths(iso, n)
    case 'quarterly':
      return addMonths(iso, 3 * n)
    case 'yearly':
      return addMonths(iso, 12 * n)
  }
}

/** First renewal on or after today. A stored date in the past means it already renewed. */
export function nextOccurrence(iso: string, cycle: BillingCycle) {
  const today = todayISO()
  if (iso >= today) return iso
  for (let n = 1; n < 1000; n++) {
    const next = addCycles(iso, cycle, n)
    if (next >= today) return next
  }
  return iso
}

export function formatDate(iso: string) {
  return parseISODate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysUntil(iso: string) {
  const ms = parseISODate(iso).getTime() - parseISODate(todayISO()).getTime()
  return Math.round(ms / 86_400_000)
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

// EXPERIMENT: intentional type error to see CI fail — remove after
export const x: number = "hello"
