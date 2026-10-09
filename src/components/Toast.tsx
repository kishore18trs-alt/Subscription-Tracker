import { useEffect } from 'react'

/** How long the undo snackbar stays up. */
const TOAST_MS = 10_000

export interface ToastData {
  id: number
  message: string
  onUndo?: () => void
}

export function Toast({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, TOAST_MS)
    return () => clearTimeout(t)
  }, [toast.id, onClose])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-8">
      <div
        key={toast.id}
        role="status"
        className="pointer-events-auto relative flex items-center gap-5 overflow-hidden rounded-2xl bg-slate-900/95 py-3 pl-4 pr-3 text-sm text-white shadow-2xl backdrop-blur"
      >
        <span>{toast.message}</span>
        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo?.()
              onClose()
            }}
            className="rounded-lg px-2.5 py-1 font-semibold text-indigo-300 transition hover:bg-white/10 hover:text-indigo-200"
          >
            Undo
          </button>
        )}
        {/* Countdown bar */}
        <span
          className="absolute bottom-0 left-0 h-0.5 bg-indigo-400"
          style={{ animation: `toast-countdown ${TOAST_MS}ms linear forwards` }}
        />
      </div>
    </div>
  )
}
