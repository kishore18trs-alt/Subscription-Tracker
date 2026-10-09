import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SubscriptionForm } from '../components/SubscriptionForm'
import { ServiceBadge } from '../components/ServiceBadge'
import { CancelHelper, DeleteDialog } from '../components/SubscriptionDialogs'
import { ArrowLeftIcon, TrashIcon, XCircleIcon } from '../components/Icons'
import {
  getSubscription,
  listPriceHistory,
  setCancelCheck,
  setStatus,
  softDelete,
  updateSubscription,
} from '../lib/subscriptions'
import { addDays, formatDate, formatMoney, todayISO } from '../lib/billing'
import type { DashboardNavState } from './Dashboard'
import type { PriceChange, Subscription } from '../lib/types'

export function EditSubscription() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'delete' | 'cancel' | null>(null)

  const [history, setHistory] = useState<PriceChange[]>([])

  useEffect(() => {
    if (!id) return
    getSubscription(id)
      .then(setSub)
      .catch(() => setError('Subscription not found.'))
    listPriceHistory(id)
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [id])

  async function act(change: () => Promise<void>, state: DashboardNavState) {
    try {
      await change()
      navigate('/dashboard', { state })
    } catch (err) {
      setDialog(null)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeftIcon size={16} /> Dashboard
      </Link>

      <div className="mt-3 flex items-center gap-4">
        {sub && <ServiceBadge name={sub.name} catalogKey={sub.catalog_key} size={52} />}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{sub?.name ?? 'Edit subscription'}</h1>
          {sub && <p className="text-sm capitalize text-slate-500">{sub.status}</p>}
        </div>
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        {error ? (
          <p className="text-rose-600">{error}</p>
        ) : !sub ? (
          <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <SubscriptionForm
            initial={sub}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              await updateSubscription(sub.id, values)
              navigate('/dashboard')
            }}
            onCancel={() => navigate('/dashboard')}
          />
        )}
      </section>

      {sub && history.length > 0 && (
        <section className="card mt-6 p-5 sm:p-6">
          <h2 className="font-semibold">Price history</h2>
          <ol className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
            {history.map((h) => {
              const sameCurrency = h.old_currency === h.new_currency
              const up = sameCurrency && h.new_amount > h.old_amount
              const pct = sameCurrency && h.old_amount > 0 ? Math.round(((h.new_amount - h.old_amount) / h.old_amount) * 100) : null
              return (
                <li key={h.id} className="relative text-sm">
                  <span className={`absolute -left-5.75 top-1.5 size-3 rounded-full ring-4 ring-white ${up ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <p className="font-medium tabular-nums">
                    {formatMoney(h.old_amount, h.old_currency)} → {formatMoney(h.new_amount, h.new_currency)}
                    {pct !== null && pct !== 0 && (
                      <span className={`ml-2 text-xs font-semibold ${up ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {up ? '+' : ''}
                        {pct}%
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(h.changed_at.slice(0, 10))}</p>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {sub && (
        <section className="card mt-6 divide-y divide-slate-100">
          {sub.status !== 'cancelled' && (
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">Cancel subscription</p>
                <p className="text-sm text-slate-500">Step-by-step help to stop paying {sub.name}.</p>
              </div>
              <button onClick={() => setDialog('cancel')} className="btn-ghost shrink-0 ring-1 ring-slate-200">
                <XCircleIcon size={16} /> How to cancel
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold text-rose-700">Delete</p>
              <p className="text-sm text-slate-500">Removes it from the app only. Restorable for 30 days.</p>
            </div>
            <button
              onClick={() => setDialog('delete')}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-600 hover:text-white"
            >
              <TrashIcon size={16} /> Delete
            </button>
          </div>
        </section>
      )}

      {sub && dialog === 'delete' && (
        <DeleteDialog
          subs={[sub]}
          onConfirm={() => act(() => softDelete([sub.id]), { deleted: { ids: [sub.id], name: sub.name } })}
          onHowToCancel={() => setDialog('cancel')}
          onClose={() => setDialog(null)}
        />
      )}
      {sub && dialog === 'cancel' && (
        <CancelHelper
          sub={sub}
          onCancelled={() => act(() => setStatus(sub.id, 'cancelled'), { toast: `${sub.name} cancelled. Nice saving!` })}
          onNotYet={() =>
            act(() => setCancelCheck(sub.id, addDays(todayISO(), 1)), { toast: `OK, we'll ask about ${sub.name} again tomorrow` })
          }
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
