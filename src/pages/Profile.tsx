import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ServiceBadge } from '../components/ServiceBadge'
import { EditIcon, LogoutIcon, SettingsIcon } from '../components/Icons'
import { CATEGORY_COLORS } from '../lib/catalog'
import { CYCLE_LABEL, daysUntil, formatDate, formatMoney, savedSince } from '../lib/billing'
import { isInTrial, joinMoney, monthly, sumBy, totalIn, withNextDate } from '../lib/insights'
import { getProfile, listSubscriptions, updateProfile } from '../lib/subscriptions'
import { useConverter } from '../lib/rates'
import type { Profile as ProfileRow, Subscription } from '../lib/types'

const PERSONALITY: Record<string, { title: string; emoji: string; blurb: string }> = {
  Entertainment: { title: 'The Binge-Watcher', emoji: '🍿', blurb: 'Most of your money goes to shows and films.' },
  Music: { title: 'The Audiophile', emoji: '🎧', blurb: 'Music is where most of your spend goes.' },
  AI: { title: 'The AI Power User', emoji: '🤖', blurb: 'AI tools take the biggest share of your spend.' },
  Productivity: { title: 'The Productivity Pro', emoji: '⚡', blurb: 'You invest most in getting things done.' },
  'Cloud Storage': { title: 'The Digital Archivist', emoji: '☁️', blurb: 'Keeping files safe is your biggest cost.' },
  Gaming: { title: 'The Gamer', emoji: '🎮', blurb: 'Game passes lead your spending.' },
  Education: { title: 'The Lifelong Learner', emoji: '📚', blurb: 'Learning is where your money goes.' },
}
const DEFAULT_PERSONALITY = { title: 'The Collector', emoji: '✨', blurb: 'A bit of everything.' }

export function Profile() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [subs, setSubs] = useState<Subscription[] | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const conv = useConverter(profile?.currency)

  useEffect(() => {
    getProfile().then(setProfile)
    listSubscriptions().then(setSubs)
  }, [])

  if (!profile || !subs) return <div className="h-96 animate-pulse rounded-3xl bg-slate-200/70" />

  const displayName = profile.display_name || user?.email?.split('@')[0] || 'You'
  const memberSince = user?.created_at ? formatDate(user.created_at.slice(0, 10)) : '—'

  const active = withNextDate(subs.filter((s) => s.status === 'active'))
  const paying = active.filter((s) => !isInTrial(s))
  const cancelled = subs.filter((s) => s.status === 'cancelled')
  const spend = totalIn(paying, monthly, conv)
  const saved = totalIn(cancelled, (s) => (s.cancelled_at ? savedSince(s.cancelled_at, s.amount, s.billing_cycle) : 0), conv)
  const inBase = (s: Subscription) => conv?.toBase(monthly(s), s.currency) ?? (s.currency === profile.currency ? monthly(s) : 0)

  // Personality = the category with the largest monthly share (in the main currency).
  const categories = sumBy(paying, (s) => s.category ?? 'Other', inBase)
  const categoryTotal = categories.reduce((n, [, v]) => n + v, 0)
  const [topCat, topAmt] = categories[0] ?? ['Other', 0]
  const persona = PERSONALITY[topCat] ?? DEFAULT_PERSONALITY

  const priciest = [...paying].sort((a, b) => inBase(b) - inBase(a))[0]
  const longest = [...active].sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
  const nextUp = active[0]

  const savedInBase = saved.entries.length === 1 && saved.entries[0][0] === profile.currency ? saved.entries[0][1] : 0
  const spendInBase = spend.entries.length === 1 ? spend.entries[0][1] : null
  const achievements = [
    { emoji: '🌱', title: 'First step', body: 'Added a subscription', done: subs.length >= 1 },
    { emoji: '🗂️', title: 'Organised', body: 'Tracking 5 or more', done: subs.length >= 5 },
    { emoji: '✂️', title: 'Cutter', body: 'Cancelled one', done: cancelled.length >= 1 },
    { emoji: '⏳', title: 'Trial hunter', body: 'Tracking a free trial', done: subs.some((s) => s.is_trial) },
    { emoji: '📅', title: 'Thinks yearly', body: 'On a yearly plan', done: active.some((s) => s.billing_cycle === 'yearly') },
    {
      emoji: '🎯',
      title: 'Budget keeper',
      body: 'Under your monthly budget',
      done: Boolean(profile.monthly_budget && spendInBase !== null && spendInBase <= profile.monthly_budget),
    },
    {
      emoji: '💰',
      title: 'Big saver',
      body: `Saved ${formatMoney(1000, profile.currency)}+`,
      done: savedInBase >= 1000,
    },
  ]
  const unlocked = achievements.filter((a) => a.done).length

  async function saveName() {
    const name = nameDraft.trim() || null
    setEditingName(false)
    if (!profile || name === profile.display_name) return
    setProfile({ ...profile, display_name: name })
    await updateProfile(profile.id, { display_name: name })
  }

  return (
    <div className="space-y-6">
      {/* Identity */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 size-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex size-24 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-400 via-violet-500 to-fuchsia-500 font-display text-4xl font-extrabold shadow-2xl shadow-fuchsia-900/50 ring-4 ring-white/10">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-2 -right-2 flex size-10 items-center justify-center rounded-2xl bg-white text-xl shadow-lg">
              {persona.emoji}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                maxLength={40}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="w-full max-w-xs rounded-xl bg-white/10 px-3 py-1.5 font-display text-3xl font-bold outline-none ring-2 ring-indigo-400"
              />
            ) : (
              <button
                onClick={() => (setNameDraft(profile.display_name ?? ''), setEditingName(true))}
                className="group flex items-center gap-2 text-left"
              >
                <h1 className="truncate font-display text-3xl font-bold sm:text-4xl">{displayName}</h1>
                <EditIcon size={16} className="text-white/40 transition group-hover:text-white" />
              </button>
            )}
            <p className="mt-1 truncate text-white/60">{user?.email}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Pill>Member since {memberSince}</Pill>
              <Pill>{profile.timezone}</Pill>
              <Pill>Main currency {profile.currency}</Pill>
            </div>
          </div>
          <div className="flex gap-2 sm:flex-col">
            <Link to="/settings" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/15 hover:bg-white/15">
              <SettingsIcon size={16} /> Settings
            </Link>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
              <LogoutIcon size={16} /> Log out
            </button>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active" value={String(active.length)} hint={`${subs.length} tracked in total`} />
        <Stat
          label="Per month"
          value={spend.entries.length ? `${spend.converted ? '≈ ' : ''}${joinMoney(spend.entries)}` : '—'}
          hint={spend.entries.length === 1 ? `${formatMoney(spend.entries[0][1] * 12, spend.entries[0][0])} a year` : 'Across currencies'}
        />
        <Stat label="Money saved" value={cancelled.length ? joinMoney(saved.entries) : '—'} hint={`${cancelled.length} cancelled`} tone="text-emerald-600" />
        <Stat label="Free trials" value={String(active.filter(isInTrial).length)} hint="Running now" tone="text-rose-600" />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Personality */}
        <section className="card p-6 lg:col-span-3">
          <p className="text-sm font-semibold text-slate-500">Your subscription personality</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-slate-50 text-4xl ring-1 ring-slate-200">{persona.emoji}</span>
            <div>
              <h2 className="font-display text-2xl font-extrabold">{persona.title}</h2>
              <p className="text-slate-500">
                {persona.blurb}
                {categoryTotal > 0 && ` ${Math.round((topAmt / categoryTotal) * 100)}% of your monthly spend.`}
              </p>
            </div>
          </div>
          {categories.length > 0 && (
            <>
              <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100">
                {categories.map(([cat, amt]) => (
                  <div key={cat} title={cat} style={{ width: `${(amt / categoryTotal) * 100}%`, backgroundColor: CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other }} />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                {categories.map(([cat, amt]) => (
                  <span key={cat} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other }} />
                    {cat} {Math.round((amt / categoryTotal) * 100)}%
                  </span>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Highlights */}
        <section className="card divide-y divide-slate-100 lg:col-span-2">
          <Highlight label="Most expensive" sub={priciest}>
            {priciest && `${formatMoney(priciest.amount, priciest.currency)} per ${CYCLE_LABEL[priciest.billing_cycle]}`}
          </Highlight>
          <Highlight label="With you longest" sub={longest}>
            {longest && `Since ${formatDate(longest.created_at.slice(0, 10))}`}
          </Highlight>
          <Highlight label="Next renewal" sub={nextUp}>
            {nextUp && (daysUntil(nextUp.next) === 0 ? 'Today' : `In ${daysUntil(nextUp.next)} days · ${formatDate(nextUp.next)}`)}
          </Highlight>
        </section>
      </div>

      {/* Achievements */}
      <section className="card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Achievements</h2>
          <span className="text-sm text-slate-500">
            {unlocked} of {achievements.length} unlocked
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${(unlocked / achievements.length) * 100}%` }} />
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {achievements.map((a) => (
            <li
              key={a.title}
              className={`flex flex-col items-center rounded-2xl p-4 text-center transition ${
                a.done ? 'bg-linear-to-b from-amber-50 to-white ring-1 ring-amber-200' : 'bg-slate-50 opacity-50 grayscale'
              }`}
            >
              <span className="text-3xl">{a.emoji}</span>
              <span className="mt-2 text-sm font-semibold">{a.title}</span>
              <span className="text-xs text-slate-500">{a.body}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-white/80 ring-1 ring-white/10">{children}</span>
}

function Stat({ label, value, hint, tone = 'text-slate-900' }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-slate-400">{hint}</p>
    </div>
  )
}

function Highlight({ label, sub, children }: { label: string; sub?: Subscription; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-5">
      {sub ? <ServiceBadge name={sub.name} catalogKey={sub.catalog_key} size={40} /> : <span className="size-10 rounded-xl bg-slate-100" />}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate font-semibold">{sub?.name ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500">{children}</p>}
      </div>
    </div>
  )
}
