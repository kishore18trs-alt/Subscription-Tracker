import { useState } from 'react'
import { ServiceBadge } from './ServiceBadge'
import { formatMoney } from '../lib/billing'
import type { Tip } from '../lib/insights'

const DISMISSED_KEY = 'dismissed-tips'

function loadDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

const KIND_STYLE: Record<Tip['kind'], { label: string; tone: string }> = {
  annual: { label: 'Save', tone: 'bg-emerald-50 text-emerald-700' },
  overpaying: { label: 'Check', tone: 'bg-amber-50 text-amber-700' },
  overlap: { label: 'Overlap', tone: 'bg-sky-50 text-sky-700' },
}

export function TipsCard({ tips }: { tips: Tip[] }) {
  const [dismissed, setDismissed] = useState(loadDismissed)
  const visible = tips.filter((t) => !dismissed.has(t.id))
  if (visible.length === 0) return null

  function dismiss(id: string) {
    const next = new Set(dismissed).add(id)
    setDismissed(next)
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]))
    } catch {
      // not persisted; fine
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-linear-to-r from-emerald-50 to-white px-5 py-3.5">
        <span className="text-lg" aria-hidden>
          💡
        </span>
        <h2 className="font-semibold">Ways to save</h2>
        <span className="ml-auto rounded-full bg-emerald-600 px-2 text-xs font-semibold text-white">{visible.length}</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {visible.map((t) => (
          <li key={t.id} className="flex gap-3 px-5 py-4">
            {t.catalogKey ? (
              <ServiceBadge name={t.title} catalogKey={t.catalogKey} size={32} />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">≋</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${KIND_STYLE[t.kind].tone}`}>
                  {KIND_STYLE[t.kind].label}
                </span>
                <p className="text-sm font-semibold">{t.title}</p>
              </div>
              <p className="mt-1 text-sm text-slate-500">{t.detail}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                {t.saving ? (
                  <span className="text-sm font-semibold text-emerald-700">
                    Save {formatMoney(t.saving[1], t.saving[0])} / year
                  </span>
                ) : (
                  <span />
                )}
                <button onClick={() => dismiss(t.id)} className="text-xs font-medium text-slate-400 hover:text-slate-700">
                  Dismiss
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
