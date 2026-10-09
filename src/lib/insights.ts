// Totals, trials, calendar occurrences and savings tips, all derived client-side from subscriptions.
import { addCycles, formatMoney, monthlyCost, nextOccurrence, todayISO } from './billing'
import { plansFor, type CatalogPlan } from './prices'
import type { Converter } from './rates'
import type { Subscription } from './types'

export type Money = [currency: string, amount: number][]

export const monthly = (s: Subscription) => monthlyCost(s.amount, s.billing_cycle)

/** Sum of `value` grouped by `key`, largest first. */
export function sumBy(subs: Subscription[], key: (s: Subscription) => string, value: (s: Subscription) => number): Money {
  const totals = new Map<string, number>()
  for (const s of subs) totals.set(key(s), (totals.get(key(s)) ?? 0) + value(s))
  return [...totals.entries()].sort((a, b) => b[1] - a[1])
}

export const sumByCurrency = (subs: Subscription[], value: (s: Subscription) => number) =>
  sumBy(subs, (s) => s.currency, value)

export function joinMoney(entries: Money) {
  return entries.map(([cur, amt]) => formatMoney(amt, cur)).join(' + ')
}

/**
 * Total of `value` in the converter's base currency when every currency converts;
 * otherwise per-currency totals. `converted` says whether any conversion happened.
 */
export function totalIn(subs: Subscription[], value: (s: Subscription) => number, conv: Converter | null) {
  const perCurrency = sumByCurrency(subs, value)
  if (!conv || perCurrency.length === 0) return { entries: perCurrency, converted: false }
  let sum = 0
  for (const [cur, amt] of perCurrency) {
    const v = conv.toBase(amt, cur)
    if (v === null) return { entries: perCurrency, converted: false }
    sum += v
  }
  const converted = perCurrency.some(([cur]) => cur !== conv.base)
  return { entries: [[conv.base, sum]] as Money, converted }
}

/** In a free trial that hasn't charged yet. */
export const isInTrial = (s: Subscription) => s.is_trial && !!s.trial_ends_on && s.trial_ends_on >= todayISO()

/** Active subscriptions with past billing dates rolled forward to the next renewal, soonest first. */
export function withNextDate(subs: Subscription[]) {
  return subs
    .map((s) => ({ ...s, next: nextOccurrence(s.next_billing_date, s.billing_cycle) }))
    .sort((a, b) => a.next.localeCompare(b.next))
}

/**
 * Billing dates of `s` between `start` and `end` (inclusive, YYYY-MM-DD).
 * Never before the subscription was added, or before a trial's first charge.
 */
export function occurrencesBetween(s: Subscription, start: string, end: string): string[] {
  const floor = s.is_trial && s.trial_ends_on ? s.trial_ends_on : s.created_at.slice(0, 10)
  const out: string[] = []
  let n = 0
  while (n > -500 && addCycles(s.next_billing_date, s.billing_cycle, n - 1) >= start) n--
  for (; n < 500; n++) {
    const d = addCycles(s.next_billing_date, s.billing_cycle, n)
    if (d > end) break
    if (d >= start && d >= floor) out.push(d)
  }
  return out
}

// ─────────────────────────── Savings tips ───────────────────────────

export interface Tip {
  id: string // stable, so dismissals stick
  kind: 'annual' | 'overlap' | 'overpaying'
  title: string
  detail: string
  saving?: [currency: string, perYear: number]
  catalogKey?: string | null
}

const OVERLAPS: { category: string; min: number; noun: string }[] = [
  { category: 'Music', min: 2, noun: 'music apps' },
  { category: 'AI', min: 2, noun: 'AI assistants' },
  { category: 'Cloud Storage', min: 2, noun: 'cloud storage plans' },
  { category: 'Gaming', min: 2, noun: 'gaming passes' },
  { category: 'Entertainment', min: 4, noun: 'streaming services' },
]

/** The catalog plan a subscription is on: the one picked, else one whose price matches exactly. */
function planOf(s: Subscription): CatalogPlan | undefined {
  const plans = plansFor(s.catalog_key)
  return (
    plans.find((p) => p.id === s.plan_key) ??
    plans.find((p) => p.cycle === s.billing_cycle && p.prices[s.currency] === s.amount)
  )
}

const tier = (planId: string) => planId.replace(/-(monthly|yearly|annual|quarterly)$/, '')

function listNames(names: string[]) {
  return names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

export function savingsTips(active: Subscription[]): Tip[] {
  const tips: Tip[] = []

  for (const s of active) {
    const plan = planOf(s)
    if (!plan) continue

    // Same tier billed yearly costs less than 12 × monthly.
    if (s.billing_cycle !== 'yearly') {
      const yearly = plansFor(s.catalog_key).find(
        (p) => p.cycle === 'yearly' && p.id !== plan.id && tier(p.id) === tier(plan.id) && p.prices[s.currency] !== undefined,
      )
      const yearlyPrice = yearly?.prices[s.currency]
      const saving = yearlyPrice !== undefined ? monthly(s) * 12 - yearlyPrice : 0
      if (yearly && yearlyPrice !== undefined && saving >= 1) {
        tips.push({
          id: `annual:${s.id}:${yearly.id}`,
          kind: 'annual',
          title: `Switch ${s.name} to yearly`,
          detail: `Pay ${formatMoney(yearlyPrice, s.currency)} once a year instead of ${formatMoney(s.amount, s.currency)} per ${
            s.billing_cycle === 'quarterly' ? 'quarter' : s.billing_cycle === 'weekly' ? 'week' : 'month'
          }.`,
          saving: [s.currency, saving],
          catalogKey: s.catalog_key,
        })
      }
    }

    // Paying more than the current list price for the same plan.
    const list = plan.prices[s.currency]
    if (list !== undefined && s.amount > list * 1.01 && plan.cycle === s.billing_cycle) {
      tips.push({
        id: `overpaying:${s.id}:${s.amount}`,
        kind: 'overpaying',
        title: `Check your ${s.name} price`,
        detail: `You pay ${formatMoney(s.amount, s.currency)}, but ${plan.name} is listed at ${formatMoney(list, s.currency)}. You may be on an older or bigger plan.`,
        saving: [s.currency, monthlyCost(s.amount - list, s.billing_cycle) * 12],
        catalogKey: s.catalog_key,
      })
    }
  }

  // Several services doing the same job.
  for (const o of OVERLAPS) {
    const group = active.filter((s) => (s.category ?? 'Other') === o.category)
    if (group.length < o.min) continue
    const cost = joinMoney(sumByCurrency(group, monthly))
    tips.push({
      id: `overlap:${o.category}:${group.map((s) => s.id).sort().join(',')}`,
      kind: 'overlap',
      title: `You have ${group.length} ${o.noun}`,
      detail: `${listNames(group.map((s) => s.name))} cost ${cost} a month together. Do you need all of them?`,
    })
  }

  // Biggest savings first; overlaps (no fixed saving) last.
  return tips.sort((a, b) => (b.saving?.[1] ?? 0) - (a.saving?.[1] ?? 0))
}
