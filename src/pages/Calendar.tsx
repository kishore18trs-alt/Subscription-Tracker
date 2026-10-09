import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ServiceBadge } from '../components/ServiceBadge'
import { CYCLE_LABEL, formatMoney, parseISODate, todayISO } from '../lib/billing'
import { isInTrial, joinMoney, occurrencesBetween, totalIn } from '../lib/insights'
import { getProfile, listSubscriptions } from '../lib/subscriptions'
import { useConverter } from '../lib/rates'
import type { Profile, Subscription } from '../lib/types'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Charge {
  sub: Subscription
  date: string
  trialEnd: boolean // first charge after a free trial
}

const iso = (d: Date) => d.toLocaleDateString('en-CA')

/** Monday-first grid of whole weeks covering the month. */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7))
  const end = new Date(year, month + 1, (7 - last.getDay()) % 7)
  const days: Date[] = []
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d))
  return days
}

export function Calendar() {
  const today = todayISO()
  const [cursor, setCursor] = useState(() => {
    const t = parseISODate(today)
    return { year: t.getFullYear(), month: t.getMonth() }
  })
  const [subs, setSubs] = useState<Subscription[] | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>(today)
  const conv = useConverter(profile?.currency)

  useEffect(() => {
    listSubscriptions().then(setSubs)
    getProfile().then(setProfile).catch(() => {})
  }, [])

  const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor])
  const monthStart = iso(new Date(cursor.year, cursor.month, 1))
  const monthEnd = iso(new Date(cursor.year, cursor.month + 1, 0))

  // Only active subscriptions charge; paused and cancelled ones are skipped.
  const byDay = useMemo(() => {
    const map = new Map<string, Charge[]>()
    for (const s of subs?.filter((x) => x.status === 'active') ?? []) {
      for (const date of occurrencesBetween(s, iso(days[0]), iso(days[days.length - 1]))) {
        const list = map.get(date) ?? []
        list.push({ sub: s, date, trialEnd: isInTrial(s) && date === s.trial_ends_on })
        map.set(date, list)
      }
    }
    return map
  }, [subs, days])

  const monthCharges = [...byDay.entries()].filter(([d]) => d >= monthStart && d <= monthEnd).flatMap(([, c]) => c)
  const monthTotal = totalIn(
    monthCharges.map((c) => c.sub),
    (s) => s.amount,
    conv,
  )
  const remaining = totalIn(
    monthCharges.filter((c) => c.date >= today).map((c) => c.sub),
    (s) => s.amount,
    conv,
  )
  const selected = byDay.get(selectedDay) ?? []
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function shift(delta: number) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function dayTotal(charges: Charge[]) {
    const t = totalIn(
      charges.map((c) => c.sub),
      (s) => s.amount,
      conv,
    )
    return joinMoney(t.entries)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Renewal calendar</h1>
          <p className="mt-1 text-slate-500">
            {monthCharges.length === 0
              ? 'No renewals this month.'
              : `${monthCharges.length} renewal${monthCharges.length > 1 ? 's' : ''} · ${monthTotal.converted ? '≈ ' : ''}${joinMoney(monthTotal.entries)} this month`}
            {monthCharges.length > 0 && monthStart <= today && today <= monthEnd && (
              <span className="text-slate-400"> · {joinMoney(remaining.entries)} still to come</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="btn-ghost size-10 p-0 ring-1 ring-slate-200">
            ‹
          </button>
          <span className="min-w-36 text-center font-semibold">{monthLabel}</span>
          <button onClick={() => shift(1)} aria-label="Next month" className="btn-ghost size-10 p-0 ring-1 ring-slate-200">
            ›
          </button>
          <button
            onClick={() => {
              const t = parseISODate(today)
              setCursor({ year: t.getFullYear(), month: t.getMonth() })
              setSelectedDay(today)
            }}
            className="btn-ghost px-3 py-2 text-indigo-600"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Month grid */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const key = iso(d)
              const charges = byDay.get(key) ?? []
              const inMonth = d.getMonth() === cursor.month
              const isToday = key === today
              const isSelected = key === selectedDay
              const hasTrial = charges.some((c) => c.trialEnd)
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  className={`relative flex min-h-20 flex-col gap-1 border-b border-r border-slate-100 p-1.5 text-left transition sm:min-h-24 sm:p-2 nth-[7n]:border-r-0 ${
                    isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                  } ${inMonth ? '' : 'opacity-40'}`}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday ? 'bg-indigo-600 text-white' : key < today ? 'text-slate-400' : 'text-slate-700'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {charges.length > 0 && (
                    <>
                      <div className="flex -space-x-1.5">
                        {charges.slice(0, 3).map((c) => (
                          <span key={c.sub.id} className={`rounded-md ring-2 ${c.trialEnd ? 'ring-rose-500' : 'ring-white'}`}>
                            <ServiceBadge name={c.sub.name} catalogKey={c.sub.catalog_key} size={20} />
                          </span>
                        ))}
                        {charges.length > 3 && (
                          <span className="flex size-5 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold ring-2 ring-white">
                            +{charges.length - 3}
                          </span>
                        )}
                      </div>
                      <span className={`hidden truncate text-[11px] font-semibold tabular-nums sm:block ${hasTrial ? 'text-rose-600' : 'text-slate-600'}`}>
                        {dayTotal(charges)}
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day */}
        <aside className="card h-fit p-5">
          <h2 className="font-semibold">
            {parseISODate(selectedDay).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          {selected.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing renews this day.</p>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                {selected.map((c) => (
                  <li key={c.sub.id}>
                    <Link to={`/edit/${c.sub.id}`} className="flex items-center gap-3 rounded-xl p-1 -m-1 hover:bg-slate-50">
                      <ServiceBadge name={c.sub.name} catalogKey={c.sub.catalog_key} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{c.sub.name}</p>
                        <p className={`text-xs ${c.trialEnd ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>
                          {c.trialEnd ? 'Free trial ends: first charge' : `Every ${CYCLE_LABEL[c.sub.billing_cycle]}`}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(c.sub.amount, c.sub.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {selected.length > 1 && (
                <p className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{dayTotal(selected)}</span>
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
