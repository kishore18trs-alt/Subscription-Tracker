import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ServiceBadge } from './ServiceBadge'
import { formatDate, formatMoney } from '../lib/billing'
import { joinMoney, type Money } from '../lib/insights'
import type { Converter } from '../lib/rates'
import type { Subscription } from '../lib/types'

interface Props {
  totals: Money // monthly spend: one entry when converted, else one per currency
  converted: boolean
  conv: Converter | null
  base: string // the profile's default currency
  budget: number | null // in `base`
  active: Subscription[]
  trialsMonthly: Money
  trialCount: number
}

export function SpendHero({ totals, converted, conv, base, budget, active, trialsMonthly, trialCount }: Props) {
  const [primary, ...others] = totals
  // A budget only makes sense against a single total in the budget's currency.
  const budgetable = budget && primary && others.length === 0 && primary[0] === base
  const used = budgetable ? primary[1] / budget : 0

  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-indigo-600/20 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-indigo-100">You spend each month</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
            {converted && <span className="mr-1 text-3xl font-bold text-indigo-200 sm:text-4xl">≈</span>}
            {primary ? formatMoney(primary[1], primary[0]) : formatMoney(0, base)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {primary && (
              <Chip>
                {formatMoney(primary[1] * 12, primary[0])} / year
              </Chip>
            )}
            {others.map(([cur, amt]) => (
              <Chip key={cur}>+ {formatMoney(amt, cur)} / month</Chip>
            ))}
            {trialCount > 0 && (
              <Chip>
                + {joinMoney(trialsMonthly)} / month after {trialCount} trial{trialCount > 1 ? 's' : ''}
              </Chip>
            )}
          </div>
          {converted && conv && (
            <p className="mt-3 text-xs text-indigo-200">
              Other currencies converted to {conv.base} at ECB rates of {formatDate(conv.date)}.
            </p>
          )}
        </div>

        {active.length > 0 && (
          <div className="flex shrink-0 -space-x-3">
            {active.slice(0, 5).map((s) => (
              <span key={s.id} className="rounded-xl ring-4 ring-violet-600/60">
                <ServiceBadge name={s.name} catalogKey={s.catalog_key} size={44} />
              </span>
            ))}
            {active.length > 5 && (
              <span className="flex size-11 items-center justify-center rounded-xl bg-white/20 text-sm font-semibold ring-4 ring-violet-600/60 backdrop-blur">
                +{active.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="relative mt-6 border-t border-white/15 pt-5">
        {budgetable && primary ? (
          <>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">
                {used <= 1
                  ? `${formatMoney(budget - primary[1], primary[0])} left of your budget`
                  : `${formatMoney(primary[1] - budget, primary[0])} over budget`}
              </span>
              <Link to="/settings" className="text-indigo-200 hover:text-white">
                {formatMoney(budget, primary[0])} / month
              </Link>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className={`h-full rounded-full transition-all ${
                  used > 1 ? 'bg-rose-300' : used > 0.85 ? 'bg-amber-300' : 'bg-emerald-300'
                }`}
                style={{ width: `${Math.min(100, used * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <Link to="/settings" className="text-sm font-medium text-indigo-100 hover:text-white">
            {budget ? 'Budget needs all subscriptions in one currency →' : 'Set a monthly budget →'}
          </Link>
        )}
      </div>
    </section>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{children}</span>
}
