import { useState, type FormEvent } from 'react'
import { CATEGORIES, CURRENCIES } from '../lib/catalog'
import { CYCLE_LABEL, addDays, formatDate, formatMoney, todayISO } from '../lib/billing'
import { PRICES_CHECKED_ON, plansFor, type CatalogPlan } from '../lib/prices'
import type { SubscriptionInput } from '../lib/subscriptions'
import type { BillingCycle } from '../lib/types'
import { CheckIcon } from './Icons'

interface Props {
  initial: SubscriptionInput
  submitLabel: string
  onSubmit: (values: SubscriptionInput) => Promise<void>
  onCancel: () => void
}

const CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export function SubscriptionForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial.name)
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : '')
  const [currency, setCurrency] = useState(initial.currency)
  const [cycle, setCycle] = useState<BillingCycle>(initial.billing_cycle)
  const [nextDate, setNextDate] = useState(initial.next_billing_date)
  const [category, setCategory] = useState(initial.category ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [planKey, setPlanKey] = useState(initial.plan_key)
  const [isTrial, setIsTrial] = useState(initial.is_trial)
  const [trialEnd, setTrialEnd] = useState(initial.trial_ends_on ?? addDays(todayISO(), 7))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const plans = plansFor(initial.catalog_key)
  const selectedPlan = plans.find((p) => p.id === planKey)
  const listPrice = selectedPlan?.prices[currency]

  const currencyOptions = CURRENCIES.includes(currency as (typeof CURRENCIES)[number])
    ? CURRENCIES
    : [currency, ...CURRENCIES]

  function pickPlan(plan: CatalogPlan) {
    // Stay in the user's currency when the plan is sold in it; otherwise use the plan's own.
    const cur = plan.prices[currency] !== undefined ? currency : Object.keys(plan.prices)[0]
    setPlanKey(plan.id)
    setCycle(plan.cycle)
    setCurrency(cur)
    setAmount(String(plan.prices[cur]))
  }

  function changeCurrency(cur: string) {
    setCurrency(cur)
    const price = selectedPlan?.prices[cur]
    if (price !== undefined) setAmount(String(price))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsedAmount = Number(amount)
    if (!name.trim()) return setError('Name is required.')
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return setError('Enter a valid amount.')
    if (isTrial && !trialEnd) return setError('Pick the day the trial ends.')
    if (!isTrial && !nextDate) return setError('Pick the next billing date.')

    setError(null)
    setBusy(true)
    try {
      await onSubmit({
        name: name.trim(),
        amount: Math.round(parsedAmount * 100) / 100,
        currency,
        billing_cycle: cycle,
        // A trial's first charge is the day it ends.
        next_billing_date: isTrial ? trialEnd : nextDate,
        category: category || null,
        catalog_key: initial.catalog_key,
        plan_key: planKey,
        notes: notes.trim() || null,
        is_trial: isTrial,
        trial_ends_on: isTrial ? trialEnd : null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="label">Name</span>
        <input
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Gym membership"
          className="input"
        />
      </label>

      {plans.length > 0 && (
        <fieldset>
          <legend className="label">Plan</legend>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {plans.map((p) => {
              const price = p.prices[currency]
              const shown = price ?? Object.values(p.prices)[0]
              const shownCur = price !== undefined ? currency : Object.keys(p.prices)[0]
              const active = p.id === planKey
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPlan(p)}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition ${
                    active ? 'bg-indigo-50 ring-2 ring-indigo-500' : 'bg-white ring-1 ring-slate-200 hover:ring-slate-300'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="tabular-nums text-slate-500">
                      {p.approx && <span title="Not confirmed on the official pricing page">≈ </span>}
                      {shown !== undefined ? formatMoney(shown, shownCur) : '—'} / {CYCLE_LABEL[p.cycle]}
                    </span>
                  </span>
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                      active ? 'bg-indigo-600 text-white' : 'ring-1 ring-slate-300'
                    }`}
                  >
                    {active && <CheckIcon size={12} strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            List prices checked {formatDate(PRICES_CHECKED_ON)}. ≈ means not confirmed on the official site.
          </p>
          {selectedPlan?.approx && (
            <p className="mt-1 text-xs font-medium text-amber-700">Check this price against your last bill.</p>
          )}
        </fieldset>
      )}

      <div className="grid grid-cols-[1fr_7.5rem] gap-3">
        <label className="block">
          <span className="label">Amount</span>
          <input
            required
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            autoFocus={Boolean(initial.name) && !initial.amount && plans.length === 0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input text-lg font-semibold tabular-nums"
          />
          {listPrice !== undefined && amount !== '' && Number(amount) !== listPrice && (
            <span className="mt-1.5 block text-xs text-amber-700">List price is {formatMoney(listPrice, currency)}</span>
          )}
        </label>
        <label className="block">
          <span className="label">Currency</span>
          <select value={currency} onChange={(e) => changeCurrency(e.target.value)} className="input">
            {currencyOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="label">Billed</legend>
        <div className="mt-1.5 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
          {CYCLE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setCycle(o.value)}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                cycle === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div
        className={`flex items-center justify-between gap-4 rounded-xl p-3.5 transition ${
          isTrial ? 'bg-rose-50 ring-1 ring-rose-200' : 'bg-slate-50 ring-1 ring-slate-200'
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-slate-800">This is a free trial</p>
          <p className="text-xs text-slate-500">
            {isTrial
              ? `You'll be charged ${amount ? formatMoney(Number(amount), currency) : 'the amount above'} when it ends.`
              : "We'll warn you before the first charge."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isTrial}
          aria-label="Free trial"
          onClick={() => setIsTrial((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${isTrial ? 'bg-rose-500' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${isTrial ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {isTrial ? (
          <label className="block">
            <span className="label">Trial ends on</span>
            <input
              required
              type="date"
              min={todayISO()}
              value={trialEnd}
              onChange={(e) => setTrialEnd(e.target.value)}
              className="input"
            />
          </label>
        ) : (
          <label className="block">
            <span className="label">Next billing date</span>
            <input required type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="input" />
          </label>
        )}
        <label className="block">
          <span className="label">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            <option value="">None</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="label">
          Notes <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Shared with, payment card, login email…"
          className="input resize-none"
        />
      </label>

      {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={busy} className="btn-primary flex-1 py-3">
          {busy ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  )
}
