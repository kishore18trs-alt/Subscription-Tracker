import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SubscriptionForm } from '../components/SubscriptionForm'
import { ServiceBadge } from '../components/ServiceBadge'
import { ArrowLeftIcon, CheckIcon, SearchIcon } from '../components/Icons'
import { CATALOG, type CatalogItem } from '../lib/catalog'
import { todayISO } from '../lib/billing'
import { createSubscription, defaultCurrency, type SubscriptionInput } from '../lib/subscriptions'

function blankDraft(currency: string, item?: CatalogItem): SubscriptionInput {
  return {
    name: item?.name ?? '',
    amount: 0,
    currency,
    billing_cycle: item?.cycle ?? 'monthly',
    next_billing_date: todayISO(),
    category: item?.category ?? null,
    catalog_key: item?.key ?? null,
    plan_key: null,
    notes: null,
    is_trial: false,
    trial_ends_on: null,
  }
}

const CATEGORY_FILTERS = ['All', ...new Set(CATALOG.map((c) => c.category))]

export function AddSubscription() {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState<string | null>(null)
  const [selected, setSelected] = useState<CatalogItem | undefined>()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    defaultCurrency()
      .then(setCurrency)
      .catch(() => setCurrency('USD'))
  }, [])

  const q = search.trim().toLowerCase()
  const matches = CATALOG.filter(
    (c) => (category === 'All' || c.category === category) && c.name.toLowerCase().includes(q),
  )

  function pick(item: CatalogItem) {
    const next = selected?.key === item.key ? undefined : item
    setSelected(next)
    if (next) requestAnimationFrame(() => document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' }))
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeftIcon size={16} /> Dashboard
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Add a subscription</h1>
      <p className="mt-1 text-slate-500">Pick a service to fill in the plan and price, or enter your own below.</p>

      <section className="card mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">
            <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">1</span>
            Choose a service
          </h2>
          <label className="relative block sm:w-60">
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </label>
        </div>

        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                category === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
          {matches.map((item) => {
            const active = selected?.key === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => pick(item)}
                className={`relative flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center transition ${
                  active
                    ? 'bg-indigo-50 ring-2 ring-indigo-500'
                    : 'bg-white ring-1 ring-slate-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300'
                }`}
              >
                {active && (
                  <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <CheckIcon size={12} strokeWidth={3} />
                  </span>
                )}
                <ServiceBadge name={item.name} catalogKey={item.key} size={44} />
                <span className="text-xs font-medium leading-tight">{item.name}</span>
              </button>
            )
          })}
          {matches.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-slate-500">
              No match. Fill in the details below to add it yourself.
            </p>
          )}
        </div>
      </section>

      <section id="details" className="card mt-6 scroll-mt-24 p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">2</span>
          {selected ? (
            <div className="flex items-center gap-2.5">
              <ServiceBadge name={selected.name} catalogKey={selected.key} size={28} />
              <h2 className="font-semibold">{selected.name} details</h2>
            </div>
          ) : (
            <h2 className="font-semibold">Details</h2>
          )}
        </div>
        {currency === null ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <SubscriptionForm
            // Remount when a catalog item is picked so the form picks up the new defaults.
            key={selected?.key ?? 'custom'}
            initial={blankDraft(currency, selected)}
            submitLabel="Add subscription"
            onSubmit={async (values) => {
              await createSubscription(values)
              navigate('/dashboard')
            }}
            onCancel={() => navigate('/dashboard')}
          />
        )}
      </section>
    </div>
  )
}
