import { useState } from 'react'
import { findCatalogItem, logoUrl } from '../lib/catalog'

export function ServiceBadge({ name, catalogKey, size = 40 }: { name: string; catalogKey?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false)
  const logo = logoUrl(catalogKey)

  if (logo && !broken) {
    return (
      <img
        src={logo}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className="shrink-0 rounded-xl bg-white object-contain ring-1 ring-slate-200"
        style={{ width: size, height: size }}
      />
    )
  }

  const color = findCatalogItem(catalogKey)?.color ?? '#64748b'
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-semibold text-white"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
