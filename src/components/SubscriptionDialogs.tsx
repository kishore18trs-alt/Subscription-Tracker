import { useState } from 'react'
import { Modal } from './Modal'
import { ServiceBadge } from './ServiceBadge'
import { TrashIcon } from './Icons'
import { PLATFORM_LABEL, PLATFORM_STEPS, UPI_STEPS, cancelInfoFor, type CancelPlatform } from '../lib/cancel'
import { addCycles, addDays, formatDate, todayISO } from '../lib/billing'
import { DELETE_RETENTION_DAYS } from '../lib/subscriptions'
import type { Subscription } from '../lib/types'

// ─────────────────────────── Delete ───────────────────────────

export function DeleteDialog({
  subs,
  onConfirm,
  onHowToCancel,
  onClose,
}: {
  subs: Subscription[]
  onConfirm: () => void
  onHowToCancel: (s: Subscription) => void
  onClose: () => void
}) {
  const single = subs.length === 1 ? subs[0] : undefined
  const stillPaying = subs.filter((s) => s.status !== 'cancelled')

  return (
    <Modal onClose={onClose} labelledBy="delete-title">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <TrashIcon size={22} />
      </div>
      <h2 id="delete-title" className="mt-4 text-xl font-bold">
        Delete {single ? single.name : `${subs.length} subscriptions`}?
      </h2>

      {stillPaying.length > 0 ? (
        <p className="mt-2 text-slate-600">
          This removes {single ? 'it' : 'them'} from the app only.{' '}
          <strong className="font-semibold text-slate-900">
            It does NOT cancel your {single ? single.name : 'subscription'} payment
            {!single && 's'}.
          </strong>{' '}
          To stop paying, cancel on {single ? single.name : 'each service'} first.
        </p>
      ) : (
        <p className="mt-2 text-slate-600">
          {single ? 'It is' : 'They are'} already marked cancelled. Deleting removes {single ? 'it' : 'them'} and the
          savings history from the app.
        </p>
      )}
      <p className="mt-3 text-sm text-slate-500">
        You can restore {single ? 'it' : 'them'} from Settings → Recently deleted for {DELETE_RETENTION_DAYS} days.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {single && single.status !== 'cancelled' && (
          <button onClick={() => onHowToCancel(single)} className="btn-primary py-3">
            How to cancel on {single.name}
          </button>
        )}
        <button
          onClick={onConfirm}
          className="inline-flex items-center justify-center rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Delete anyway
        </button>
        <button onClick={onClose} className="btn-ghost py-3">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

// ─────────────────────────── Cancel helper ───────────────────────────

export function CancelHelper({
  sub,
  onCancelled,
  onNotYet,
  onClose,
}: {
  sub: Subscription
  onCancelled: () => void
  onNotYet: () => void
  onClose: () => void
}) {
  const info = cancelInfoFor(sub.catalog_key)
  const [platform, setPlatform] = useState<CancelPlatform>('website')

  return (
    <Modal onClose={onClose} labelledBy="cancel-title">
      <div className="flex items-center gap-3">
        <ServiceBadge name={sub.name} catalogKey={sub.catalog_key} size={44} />
        <div>
          <h2 id="cancel-title" className="text-xl font-bold">
            Cancel {sub.name}
          </h2>
          <p className="text-sm text-slate-500">Where did you subscribe?</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
        {(Object.keys(PLATFORM_LABEL) as CancelPlatform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`rounded-lg py-2 text-xs font-semibold transition sm:text-sm ${
              platform === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {PLATFORM_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="mt-5 min-h-44">
        {platform === 'website' && (
          <>
            <Steps
              steps={info?.steps ?? [`Log in to ${sub.name}'s website`, 'Open Account or Billing', 'Choose Cancel subscription']}
            />
            {info && (
              <a
                href={info.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open {sub.name} account page ↗
              </a>
            )}
            {info?.helpUrl && info.helpUrl !== info.url && (
              <a href={info.helpUrl} target="_blank" rel="noreferrer" className="mt-2 block text-center text-sm text-indigo-600 hover:underline">
                Official help article ↗
              </a>
            )}
            {info?.note && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{info.note}</p>}
          </>
        )}
        {(platform === 'appStore' || platform === 'playStore') && <Steps steps={PLATFORM_STEPS[platform]} />}
        {platform === 'upi' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              If you pay through UPI AutoPay or a card mandate, cancel the mandate too, or you may still be charged.
            </p>
            {UPI_STEPS.map((u) => (
              <div key={u.app}>
                <p className="mb-1.5 text-sm font-semibold">{u.app}</p>
                <Steps steps={u.steps} compact />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-indigo-50 p-4">
        <p className="font-semibold text-indigo-950">Did you cancel on {sub.name}?</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onCancelled} className="btn-primary">
            Yes, it's cancelled
          </button>
          <button
            onClick={onNotYet}
            className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
          >
            Not yet
          </button>
        </div>
        <p className="mt-2 text-xs text-indigo-700/80">“Not yet” asks you again tomorrow.</p>
      </div>
    </Modal>
  )
}

function Steps({ steps, compact = false }: { steps: string[]; compact?: boolean }) {
  return (
    <ol className={compact ? 'space-y-1' : 'space-y-2.5'}>
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3 text-sm text-slate-700">
          <span
            className={`flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600 ${
              compact ? 'size-5 text-[11px]' : 'size-6 text-xs'
            }`}
          >
            {i + 1}
          </span>
          <span className={compact ? '' : 'pt-0.5'}>{s}</span>
        </li>
      ))}
    </ol>
  )
}

// ─────────────────────────── Pause ───────────────────────────

export function PauseDialog({
  sub,
  onPause,
  onClose,
}: {
  sub: Subscription
  onPause: (until: string | null) => void
  onClose: () => void
}) {
  const today = todayISO()
  const presets = [
    { label: '1 month', date: addCycles(today, 'monthly', 1) },
    { label: '3 months', date: addCycles(today, 'quarterly', 1) },
    { label: 'No end date', date: null },
  ]
  const [until, setUntil] = useState<string | null>(presets[0].date)

  return (
    <Modal onClose={onClose} labelledBy="pause-title">
      <div className="flex items-center gap-3">
        <ServiceBadge name={sub.name} catalogKey={sub.catalog_key} size={44} />
        <div>
          <h2 id="pause-title" className="text-xl font-bold">
            Pause {sub.name}
          </h2>
          <p className="text-sm text-slate-500">Reminders stop until it resumes.</p>
        </div>
      </div>

      <p className="mt-6 label">Resume on</p>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setUntil(p.date)}
            className={`rounded-xl px-2 py-2.5 text-sm font-medium transition ${
              until === p.date ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500' : 'ring-1 ring-slate-200 hover:ring-slate-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <input
        type="date"
        min={addDays(today, 1)}
        value={until ?? ''}
        onChange={(e) => setUntil(e.target.value || null)}
        className="input"
      />
      <p className="mt-2 text-sm text-slate-500">
        {until ? `It becomes active again on ${formatDate(until)}.` : 'It stays paused until you resume it.'}
      </p>

      <div className="mt-6 flex gap-2">
        <button onClick={() => onPause(until)} className="btn-primary flex-1 py-3">
          Pause
        </button>
        <button onClick={onClose} className="btn-ghost">
          Cancel
        </button>
      </div>
    </Modal>
  )
}
