import { useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { TrashIcon } from './Icons'

const REVEAL = 88 // px the row slides to expose the Delete button

/** Swipe left on touch screens to reveal a Delete button. Mouse users get the ⋯ menu instead. */
export function SwipeRow({ children, onDelete, disabled }: { children: ReactNode; onDelete: () => void; disabled?: boolean }) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number; base: number; horizontal?: boolean } | null>(null)

  function onTouchStart(e: TouchEvent) {
    if (disabled) return
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY, base: offset }
  }

  function onTouchMove(e: TouchEvent) {
    const s = start.current
    if (!s) return
    const t = e.touches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    // Decide once per gesture whether this is a horizontal swipe or a vertical scroll.
    if (s.horizontal === undefined) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      s.horizontal = Math.abs(dx) > Math.abs(dy)
    }
    if (!s.horizontal) return
    setDragging(true)
    setOffset(Math.min(0, Math.max(-REVEAL - 24, s.base + dx)))
  }

  function onTouchEnd() {
    if (!start.current) return
    start.current = null
    setDragging(false)
    setOffset((o) => (o < -REVEAL / 2 ? -REVEAL : 0))
  }

  return (
    <div className="relative overflow-hidden">
      {offset < 0 && (
        <button
          onClick={() => {
            setOffset(0)
            onDelete()
          }}
          className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 bg-rose-600 text-xs font-semibold text-white"
          style={{ width: REVEAL }}
        >
          <TrashIcon size={18} />
          Delete
        </button>
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={(e) => {
          // A tap on an open row closes it instead of following the link.
          if (offset !== 0) {
            e.preventDefault()
            e.stopPropagation()
            setOffset(0)
          }
        }}
        // Only paint a background while sliding, so the card's rounded corners stay clean at rest.
        className={`relative ${offset < 0 ? 'bg-white' : ''} ${dragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
