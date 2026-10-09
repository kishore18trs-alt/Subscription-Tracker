import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { ServiceBadge } from '../components/ServiceBadge'
import { Toast, type ToastData } from '../components/Toast'
import { ArrowLeftIcon, TrashIcon } from '../components/Icons'
import { CURRENCIES } from '../lib/catalog'
import { formatDate, formatMoney } from '../lib/billing'
import {
  DELETE_RETENTION_DAYS,
  deleteAccount,
  getProfile,
  listDeleted,
  purge,
  restore,
  softDelete,
  updateProfile,
} from '../lib/subscriptions'
import { useAuth } from '../contexts/AuthContext'
import type { Profile, Subscription } from '../lib/types'

const REMINDER_OPTIONS = [
  { value: 0, label: 'On the day' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
]

function daysLeft(deletedAt: string) {
  const purgeAt = new Date(deletedAt).getTime() + DELETE_RETENTION_DAYS * 86_400_000
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / 86_400_000))
}

export function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [deleted, setDeleted] = useState<Subscription[] | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirmPurge, setConfirmPurge] = useState<string | null>(null)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)

  const loadDeleted = () => listDeleted().then(setDeleted)

  useEffect(() => {
    getProfile().then(setProfile)
    loadDeleted()
  }, [])

  async function savePref(patch: Parameters<typeof updateProfile>[1]) {
    if (!profile) return
    setProfile({ ...profile, ...patch })
    await updateProfile(profile.id, patch)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleRestore(s: Subscription) {
    await restore([s.id])
    await loadDeleted()
    setToast({ id: Date.now(), message: `Restored ${s.name}`, onUndo: () => softDelete([s.id]).then(loadDeleted) })
  }

  async function handlePurge(s: Subscription) {
    if (confirmPurge !== s.id) {
      setConfirmPurge(s.id)
      setTimeout(() => setConfirmPurge((c) => (c === s.id ? null : c)), 3000)
      return
    }
    await purge([s.id])
    setConfirmPurge(null)
    await loadDeleted()
    setToast({ id: Date.now(), message: `${s.name} deleted permanently` })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeftIcon size={16} /> Dashboard
        </Link>
        <div className="mt-3 flex items-end justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <span className={`text-sm font-medium text-emerald-600 transition ${saved ? 'opacity-100' : 'opacity-0'}`}>Saved ✓</span>
        </div>
      </div>

      {/* Preferences */}
      <Section title="Preferences">
        {!profile ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <div className="space-y-5">
            <label className="block">
              <span className="label">Main currency</span>
              <span className="block text-xs text-slate-500">Totals and your budget are shown in this currency.</span>
              <select value={profile.currency} onChange={(e) => savePref({ currency: e.target.value })} className="input">
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">
                Monthly budget <span className="font-normal text-slate-400">(optional, in {profile.currency})</span>
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="1"
                placeholder="e.g. 2000"
                defaultValue={profile.monthly_budget ?? ''}
                // Save when leaving the field so we don't write on every keystroke.
                onBlur={(e) => {
                  const v = e.target.value.trim() === '' ? null : Number(e.target.value)
                  if (v !== null && (!Number.isFinite(v) || v <= 0)) return
                  if (v !== profile.monthly_budget) savePref({ monthly_budget: v })
                }}
                className="input"
              />
              <span className="mt-1.5 block text-xs text-slate-500">
                Shown as a progress bar on the dashboard. Leave empty for no budget.
              </span>
            </label>
            <div>
              <span className="label">Remind me</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {REMINDER_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => savePref({ reminder_days_before: o.value })}
                    className={`rounded-xl px-2 py-2.5 text-sm font-medium transition ${
                      profile.reminder_days_before === o.value
                        ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500'
                        : 'ring-1 ring-slate-200 hover:ring-slate-300'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <Toggle
              label="Email reminders"
              hint={`Sent to ${user?.email}`}
              checked={profile.email_reminders}
              onChange={(v) => savePref({ email_reminders: v })}
            />
            <Toggle
              label="Push notifications"
              hint="On this device, once you allow notifications"
              checked={profile.push_reminders}
              onChange={(v) => savePref({ push_reminders: v })}
            />
          </div>
        )}
      </Section>

      {/* Recently deleted */}
      <Section
        title="Recently deleted"
        subtitle={`Deleted subscriptions are kept for ${DELETE_RETENTION_DAYS} days, then removed permanently.`}
      >
        {!deleted ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : deleted.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Nothing here.</p>
        ) : (
          <ul className="-mx-5 divide-y divide-slate-100 sm:-mx-6">
            {deleted.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <ServiceBadge name={s.name} catalogKey={s.catalog_key} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(s.amount, s.currency)} · deleted {formatDate(s.deleted_at!.slice(0, 10))} ·{' '}
                    {daysLeft(s.deleted_at!)} days left
                  </p>
                </div>
                <button onClick={() => handleRestore(s)} className="btn-ghost px-3 py-2 text-indigo-600">
                  Restore
                </button>
                <button
                  onClick={() => handlePurge(s)}
                  aria-label={`Delete ${s.name} permanently`}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    confirmPurge === s.id ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                  }`}
                >
                  {confirmPurge === s.id ? 'Sure?' : <TrashIcon size={16} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 sm:p-6">
        <h2 className="font-semibold text-rose-900">Delete account</h2>
        <p className="mt-1 text-sm text-rose-800/80">
          Permanently deletes your account and all your data: subscriptions, settings, reminders and history. This cannot
          be undone.
        </p>
        <button
          onClick={() => setDeletingAccount(true)}
          className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-600 hover:text-white"
        >
          Delete my account
        </button>
      </section>

      {deletingAccount && (
        <DeleteAccountDialog
          email={user?.email ?? ''}
          onClose={() => setDeletingAccount(false)}
          onDeleted={() => navigate('/login', { replace: true })}
        />
      )}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function DeleteAccountDialog({ email, onClose, onDeleted }: { email: string; onClose: () => void; onDeleted: () => void }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setBusy(true)
    try {
      await deleteAccount()
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account.')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="delete-account-title">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <TrashIcon size={22} />
      </div>
      <h2 id="delete-account-title" className="mt-4 text-xl font-bold">
        Delete your account?
      </h2>
      <p className="mt-2 text-slate-600">
        This deletes <strong className="font-semibold text-slate-900">{email}</strong> and everything in it, right away.
        It does not cancel any of your subscriptions with the services themselves.
      </p>
      <label className="mt-5 block">
        <span className="label">
          Type <span className="font-mono text-rose-600">DELETE</span> to confirm
        </span>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus className="input font-mono" />
      </label>
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</p>}
      <div className="mt-6 flex flex-col gap-2">
        <button
          disabled={typed !== 'DELETE' || busy}
          onClick={confirm}
          className="rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40"
        >
          {busy ? 'Deleting…' : 'Delete my account permanently'}
        </button>
        <button onClick={onClose} className="btn-ghost py-3">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}
