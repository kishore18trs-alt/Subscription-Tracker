import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ServiceBadge } from '../components/ServiceBadge'
import { SwipeRow } from '../components/SwipeRow'
import { Toast, type ToastData } from '../components/Toast'
import { CancelHelper, DeleteDialog, PauseDialog } from '../components/SubscriptionDialogs'
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  EditIcon,
  MoreIcon,
  PauseIcon,
  PiggyIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
} from '../components/Icons'
import { CATALOG, CATEGORY_COLORS } from '../lib/catalog'
import { SpendHero } from '../components/SpendHero'
import { TipsCard } from '../components/TipsCard'
import {
  getProfile,
  listSubscriptions,
  restore,
  setCancelCheck,
  setStatus,
  softDelete,
  updateSubscription,
} from '../lib/subscriptions'
import { CYCLE_LABEL, addDays, daysUntil, formatDate, formatMoney, savedSince, todayISO } from '../lib/billing'
import { isInTrial, joinMoney, monthly, savingsTips, sumBy, sumByCurrency, totalIn, withNextDate } from '../lib/insights'
import { useConverter } from '../lib/rates'
import type { Profile, Subscription, SubscriptionStatus } from '../lib/types'

export interface DashboardNavState {
  deleted?: { ids: string[]; name: string }
  toast?: string
}

type Row = Subscription & { next?: string }
type Tab = SubscriptionStatus
type Dialog =
  | { kind: 'delete'; subs: Subscription[] }
  | { kind: 'cancel'; sub: Subscription }
  | { kind: 'pause'; sub: Subscription }

const TABS: { id: Tab; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'cancelled', label: 'Cancelled' },
]

function duePill(iso: string) {
  const d = daysUntil(iso)
  if (d === 0) return { text: 'Today', tone: 'bg-rose-50 text-rose-700 ring-rose-200' }
  if (d === 1) return { text: 'Tomorrow', tone: 'bg-amber-50 text-amber-700 ring-amber-200' }
  if (d <= 7) return { text: `In ${d} days`, tone: 'bg-amber-50 text-amber-700 ring-amber-200' }
  return { text: formatDate(iso), tone: 'bg-slate-50 text-slate-600 ring-slate-200' }
}

function trialPill(s: Subscription) {
  const d = daysUntil(s.trial_ends_on!)
  return {
    text: d === 0 ? 'Trial ends today' : d === 1 ? 'Trial ends tomorrow' : `Trial ends in ${d} days`,
    tone: d <= 3 ? 'bg-rose-600 text-white ring-rose-600' : 'bg-rose-50 text-rose-700 ring-rose-200',
  }
}

function statusPill(s: Row) {
  if (s.status === 'active' && isInTrial(s)) return trialPill(s)
  if (s.status === 'active' && s.next) return duePill(s.next)
  if (s.status === 'paused')
    return {
      text: s.paused_until ? `Resumes ${formatDate(s.paused_until)}` : 'Paused',
      tone: 'bg-sky-50 text-sky-700 ring-sky-200',
    }
  if (s.status === 'cancelled' && s.cancelled_at)
    return {
      text: `Cancelled ${formatDate(s.cancelled_at.slice(0, 10))}`,
      tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    }
  return null
}

export function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [subs, setSubs] = useState<Subscription[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('active')
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<ToastData | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeDialog = useCallback(() => setDialog(null), [])

  const [profile, setProfile] = useState<Profile | null>(null)
  const conv = useConverter(profile?.currency)

  const reload = useCallback(() => {
    listSubscriptions()
      .then(setSubs)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reload, [reload])
  useEffect(() => {
    getProfile().then(setProfile).catch(() => {})
  }, [])

  // Actions taken on the edit page report back here so the undo snackbar lives on the dashboard.
  useEffect(() => {
    const state = location.state as DashboardNavState | null
    if (!state) return
    navigate(location.pathname, { replace: true, state: null })
    if (state.deleted) {
      const { ids, name } = state.deleted
      setToast({ id: Date.now(), message: `Deleted ${name}`, onUndo: () => restore(ids).then(reload) })
    } else if (state.toast) {
      setToast({ id: Date.now(), message: state.toast })
    }
  }, [location, navigate, reload])

  async function run(change: () => Promise<void>, message: string, undo?: () => Promise<void>) {
    setMenuFor(null)
    setDialog(null)
    try {
      await change()
      setToast({ id: Date.now(), message, onUndo: undo && (() => undo().then(reload)) })
    } catch (err) {
      setToast({ id: Date.now(), message: err instanceof Error ? err.message : 'Something went wrong' })
    }
    reload()
  }

  const actions = {
    delete: (list: Subscription[]) => {
      const ids = list.map((s) => s.id)
      const label = list.length === 1 ? list[0].name : `${list.length} subscriptions`
      setSelecting(false)
      setSelected(new Set())
      return run(() => softDelete(ids), `Deleted ${label}`, () => restore(ids))
    },
    markCancelled: (s: Subscription) =>
      run(() => setStatus(s.id, 'cancelled'), `${s.name} cancelled. Nice saving!`, () => setStatus(s.id, s.status)),
    notYet: (s: Subscription) =>
      run(() => setCancelCheck(s.id, addDays(todayISO(), 1)), `OK, we'll ask about ${s.name} again tomorrow`),
    pause: (s: Subscription, until: string | null) =>
      run(() => setStatus(s.id, 'paused', { paused_until: until }), `Paused ${s.name}`, () => setStatus(s.id, s.status)),
    resume: (s: Subscription) =>
      run(() => setStatus(s.id, 'active'), `${s.name} is active again`, () =>
        setStatus(s.id, s.status, { paused_until: s.paused_until }),
      ),
    keepTrial: (s: Subscription) =>
      run(
        () => updateSubscription(s.id, { is_trial: false, trial_ends_on: null }),
        `Keeping ${s.name}. First charge ${formatDate(s.next_billing_date)}`,
        () => updateSubscription(s.id, { is_trial: true, trial_ends_on: s.trial_ends_on }),
      ),
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (error) return <p className="card p-6 text-rose-600">{error}</p>
  if (!subs) return <DashboardSkeleton />
  if (subs.length === 0) return <EmptyState />

  const active = withNextDate(subs.filter((s) => s.status === 'active'))
  const paused = subs.filter((s) => s.status === 'paused')
  const cancelled = subs
    .filter((s) => s.status === 'cancelled')
    .sort((a, b) => (b.cancelled_at ?? '').localeCompare(a.cancelled_at ?? ''))
  const byTab: Record<Tab, Row[]> = { active, paused, cancelled }

  // Trials aren't charging yet, so they stay out of "you spend" until they end.
  const trials = active.filter(isInTrial).sort((a, b) => a.trial_ends_on!.localeCompare(b.trial_ends_on!))
  const paying = active.filter((s) => !isInTrial(s))

  const spend = totalIn(paying, monthly, conv)
  const nextUp = active[0]
  const thisWeek = active.filter((s) => daysUntil(s.next) <= 7)
  const dueThisWeek = totalIn(thisWeek, (s) => s.amount, conv)
  const savedSoFar = totalIn(cancelled, (s) => (s.cancelled_at ? savedSince(s.cancelled_at, s.amount, s.billing_cycle) : 0), conv)
  const savingRate = totalIn(cancelled, monthly, conv)
  const toCheck = subs.filter((s) => s.status !== 'cancelled' && s.cancel_check_on && s.cancel_check_on <= todayISO())
  const tips = savingsTips(paying)

  const groups =
    tab === 'active'
      ? [
          { title: 'Due this week', items: thisWeek },
          { title: 'Later this month', items: active.filter((s) => daysUntil(s.next) > 7 && daysUntil(s.next) <= 30) },
          { title: 'Coming up later', items: active.filter((s) => daysUntil(s.next) > 30) },
        ].filter((g) => g.items.length > 0)
      : [{ title: '', items: byTab[tab] }].filter((g) => g.items.length > 0)

  // Category breakdown: everything converted to one currency when rates are available,
  // else just the main currency (mixing currencies would make the bar meaningless).
  const [primary, ...otherCurrencies] = spend.entries
  const breakdown = !primary
    ? []
    : spend.entries.length === 1 && conv
      ? sumBy(paying, (s) => s.category ?? 'Other', (s) => conv.toBase(monthly(s), s.currency) ?? 0)
      : sumBy(paying.filter((s) => s.currency === primary[0]), (s) => s.category ?? 'Other', monthly)

  function menu(s: Subscription) {
    const item = 'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50'
    return (
      <div className="absolute right-3 top-14 z-20 w-56 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
        <Link to={`/edit/${s.id}`} className={item}>
          <EditIcon size={16} /> Edit
        </Link>
        {s.status === 'active' && (
          <button className={item} onClick={() => (setMenuFor(null), setDialog({ kind: 'pause', sub: s }))}>
            <PauseIcon size={16} /> Pause…
          </button>
        )}
        {s.status !== 'active' && (
          <button className={item} onClick={() => actions.resume(s)}>
            <PlayIcon size={16} /> {s.status === 'paused' ? 'Resume' : 'Reactivate'}
          </button>
        )}
        {s.status !== 'cancelled' && (
          <button className={item} onClick={() => (setMenuFor(null), setDialog({ kind: 'cancel', sub: s }))}>
            <XCircleIcon size={16} /> Cancel subscription…
          </button>
        )}
        <div className="my-1 border-t border-slate-100" />
        <button
          className={`${item} text-rose-600 hover:bg-rose-50`}
          onClick={() => (setMenuFor(null), setDialog({ kind: 'delete', subs: [s] }))}
        >
          <TrashIcon size={16} /> Delete
        </button>
      </div>
    )
  }

  function row(s: Row) {
    const pill = statusPill(s)
    const catColor = CATEGORY_COLORS[s.category ?? 'Other'] ?? CATEGORY_COLORS.Other
    const isSelected = selected.has(s.id)
    const saved = s.status === 'cancelled' && s.cancelled_at ? savedSince(s.cancelled_at, s.amount, s.billing_cycle) : 0

    const content = (
      <>
        {selecting && (
          <span
            className={`flex size-6 shrink-0 items-center justify-center rounded-lg transition ${
              isSelected ? 'bg-indigo-600 text-white' : 'ring-2 ring-slate-300'
            }`}
          >
            {isSelected && <CheckIcon size={14} strokeWidth={3} />}
          </span>
        )}
        <ServiceBadge name={s.name} catalogKey={s.catalog_key} size={44} />
        <div className="min-w-0 flex-1">
          <p className={`truncate font-semibold ${s.status === 'cancelled' ? 'text-slate-500 line-through decoration-slate-300' : ''}`}>
            {s.name}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: catColor }} />
            {s.category ?? 'Other'}
            {saved > 0 && <span className="text-emerald-600">· saved {formatMoney(saved, s.currency)}</span>}
          </p>
        </div>
        {pill && (
          <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium ring-1 sm:inline ${pill.tone}`}>{pill.text}</span>
        )}
        <div className="w-24 text-right sm:w-28">
          <p className={`font-semibold tabular-nums ${s.status === 'active' ? '' : 'text-slate-400'}`}>
            {formatMoney(s.amount, s.currency)}
          </p>
          <p className="text-xs text-slate-500">
            {pill && <span className="sm:hidden">{pill.text} · </span>}/{CYCLE_LABEL[s.billing_cycle]}
          </p>
        </div>
      </>
    )

    return (
      <li key={s.id} className="relative">
        <SwipeRow disabled={selecting} onDelete={() => setDialog({ kind: 'delete', subs: [s] })}>
          <div className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50/80 sm:gap-4 sm:px-5">
            {selecting ? (
              <button onClick={() => toggleSelected(s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4">
                {content}
              </button>
            ) : (
              <Link to={`/edit/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                {content}
              </Link>
            )}
            {!selecting && (
              <button
                aria-label={`Actions for ${s.name}`}
                onClick={() => setMenuFor(menuFor === s.id ? null : s.id)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <MoreIcon size={18} />
              </button>
            )}
          </div>
        </SwipeRow>
        {menuFor === s.id && menu(s)}
      </li>
    )
  }

  const tabItems = byTab[tab]

  return (
    <div className="space-y-6">
      {menuFor && <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />}

      {/* "Did you cancel?" follow-ups */}
      {toCheck.map((s) => (
        <div key={s.id} className="card flex flex-col gap-3 border-l-4 border-indigo-500 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <ServiceBadge name={s.name} catalogKey={s.catalog_key} size={36} />
            <p className="font-semibold">Did you cancel {s.name}?</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => actions.markCancelled(s)} className="btn-primary py-2">
              Yes
            </button>
            <button onClick={() => actions.notYet(s)} className="btn-ghost py-2 ring-1 ring-slate-200">
              Not yet
            </button>
            <button onClick={() => setDialog({ kind: 'cancel', sub: s })} className="btn-ghost py-2">
              Show me how
            </button>
          </div>
        </div>
      ))}

      <SpendHero
        totals={spend.entries}
        converted={spend.converted}
        conv={conv}
        base={profile?.currency ?? subs[0].currency}
        budget={profile?.monthly_budget ?? null}
        active={active}
        trialsMonthly={sumByCurrency(trials, monthly)}
        trialCount={trials.length}
      />

      {/* Free trials: the most urgent thing on the page */}
      {trials.length > 0 && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-rose-200">
          <div className="flex items-center gap-2 bg-rose-50 px-5 py-3">
            <span className="size-2 animate-pulse rounded-full bg-rose-500" />
            <h2 className="text-sm font-semibold text-rose-900">
              Free trial{trials.length > 1 ? 's' : ''}: cancel before you're charged, or keep {trials.length > 1 ? 'them' : 'it'}
            </h2>
          </div>
          <ul className="divide-y divide-rose-100">
            {trials.map((s) => {
              const pill = trialPill(s)
              return (
                <li key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3">
                    <ServiceBadge name={s.name} catalogKey={s.catalog_key} size={40} />
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-slate-500">
                        Then {formatMoney(s.amount, s.currency)} / {CYCLE_LABEL[s.billing_cycle]} from{' '}
                        {formatDate(s.trial_ends_on!)}
                      </p>
                    </div>
                    <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ring-1 sm:ml-0 ${pill.tone}`}>
                      {pill.text}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setDialog({ kind: 'cancel', sub: s })} className="btn-primary flex-1 bg-rose-600 py-2 hover:bg-rose-700 sm:flex-none">
                      Cancel trial
                    </button>
                    <button onClick={() => actions.keepTrial(s)} className="btn-ghost flex-1 py-2 ring-1 ring-slate-200 sm:flex-none">
                      Keep it
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<BellIcon size={18} />} tint="bg-indigo-50 text-indigo-600" label="Next renewal">
          {nextUp ? (
            <div className="flex items-center gap-3">
              <ServiceBadge name={nextUp.name} catalogKey={nextUp.catalog_key} size={32} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{nextUp.name}</p>
                <p className="text-xs text-slate-500">
                  {duePill(nextUp.next).text} · {formatMoney(nextUp.amount, nextUp.currency)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Nothing active</p>
          )}
        </StatCard>
        <StatCard icon={<CalendarIcon size={18} />} tint="bg-amber-50 text-amber-600" label="Due in 7 days">
          <p className="text-xl font-bold tabular-nums">
            {thisWeek.length ? `${dueThisWeek.converted ? '≈ ' : ''}${joinMoney(dueThisWeek.entries)}` : '—'}
          </p>
          <p className="text-xs text-slate-500">
            {thisWeek.length} renewal{thisWeek.length === 1 ? '' : 's'}
          </p>
        </StatCard>
        <StatCard icon={<PiggyIcon size={18} />} tint="bg-emerald-50 text-emerald-600" label="Money saved">
          <p className="text-xl font-bold tabular-nums text-emerald-700">
            {cancelled.length ? joinMoney(savedSoFar.entries) : '—'}
          </p>
          <p className="text-xs text-slate-500">
            {cancelled.length
              ? `+ ${joinMoney(savingRate.entries)} / month from ${cancelled.length} cancelled`
              : 'Cancel something to start saving'}
          </p>
        </StatCard>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Tabs + select */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex gap-1 rounded-xl bg-slate-200/60 p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => (setTab(t.id), setSelected(new Set()))}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                  <span className={`rounded-md px-1.5 text-xs ${tab === t.id ? 'bg-slate-100' : 'bg-slate-200/80'}`}>
                    {byTab[t.id].length}
                  </span>
                </button>
              ))}
            </div>
            {tabItems.length > 0 && (
              <button
                onClick={() => (setSelecting((v) => !v), setSelected(new Set()))}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                {selecting ? 'Done' : 'Select'}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.title || tab}>
                {g.title && <h2 className="mb-2.5 px-1 text-sm font-semibold text-slate-500">{g.title}</h2>}
                <ul className="card divide-y divide-slate-100">{g.items.map(row)}</ul>
              </section>
            ))}
            {tabItems.length === 0 && (
              <p className="card px-6 py-10 text-center text-slate-500">
                {tab === 'active' && 'No active subscriptions.'}
                {tab === 'paused' && 'Nothing paused. Pause a subscription to stop its reminders for a while.'}
                {tab === 'cancelled' && 'Nothing cancelled yet. Cancelled subscriptions show up here with what you have saved.'}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:pt-12">
          <TipsCard tips={tips} />

          {/* Category breakdown */}
          {breakdown.length > 0 && primary && (
            <div className="card p-5">
              <h2 className="font-semibold">Where it goes</h2>
              <p className="text-xs text-slate-500">
                Monthly, {primary[0]}
                {otherCurrencies.length > 0 && ' subscriptions only'}
                {spend.converted && ' (converted)'}
              </p>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
                {breakdown.map(([cat, amt]) => (
                  <div
                    key={cat}
                    style={{ width: `${(amt / primary[1]) * 100}%`, backgroundColor: CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other }}
                    title={cat}
                  />
                ))}
              </div>
              <ul className="mt-4 space-y-2.5">
                {breakdown.map(([cat, amt]) => (
                  <li key={cat} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other }} />
                      {cat}
                    </span>
                    <span className="flex items-center gap-2 tabular-nums">
                      <span className="font-medium">{formatMoney(amt, primary[0])}</span>
                      <span className="w-9 text-right text-xs text-slate-400">{Math.round((amt / primary[1]) * 100)}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Bulk action bar */}
      {selecting && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-slate-900 py-2.5 pl-5 pr-2.5 text-white shadow-2xl">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(new Set(tabItems.map((s) => s.id)))}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
              >
                All
              </button>
              <button
                disabled={selected.size === 0}
                onClick={() => setDialog({ kind: 'delete', subs: subs.filter((s) => selected.has(s.id)) })}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold transition hover:bg-rose-500 disabled:opacity-40"
              >
                <TrashIcon size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog?.kind === 'delete' && (
        <DeleteDialog
          subs={dialog.subs}
          onConfirm={() => actions.delete(dialog.subs)}
          onHowToCancel={(s) => setDialog({ kind: 'cancel', sub: s })}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'cancel' && (
        <CancelHelper
          sub={dialog.sub}
          onCancelled={() => actions.markCancelled(dialog.sub)}
          onNotYet={() => actions.notYet(dialog.sub)}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'pause' && (
        <PauseDialog sub={dialog.sub} onPause={(until) => actions.pause(dialog.sub, until)} onClose={closeDialog} />
      )}

      {toast && !selecting && <Toast toast={toast} onClose={closeToast} />}
    </div>
  )
}

function StatCard({ icon, tint, label, children }: { icon: ReactNode; tint: string; label: string; children: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex size-8 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      {children}
    </div>
  )
}

function EmptyState() {
  const preview = CATALOG.slice(0, 6)
  return (
    <div className="card relative overflow-hidden px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto size-72 rounded-full bg-indigo-100 blur-3xl" />
      <div className="relative">
        <div className="mx-auto flex w-fit -space-x-3">
          {preview.map((c, i) => (
            <span key={c.key} className="rounded-xl ring-4 ring-white" style={{ transform: `rotate(${(i - 2.5) * 6}deg)` }}>
              <ServiceBadge name={c.name} catalogKey={c.key} size={48} />
            </span>
          ))}
        </div>
        <h2 className="mt-8 text-2xl font-bold tracking-tight">Track your first subscription</h2>
        <p className="mx-auto mt-2 max-w-sm text-slate-500">
          Add Netflix, Spotify, Claude and the rest. We'll total them up and remind you before each renewal.
        </p>
        <Link to="/add" className="btn-primary mt-6">
          <PlusIcon size={18} /> Add subscription
        </Link>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-44 rounded-3xl bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200/70" />
    </div>
  )
}
