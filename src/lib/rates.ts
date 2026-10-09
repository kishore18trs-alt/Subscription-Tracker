import { useEffect, useState } from 'react'

// Daily ECB reference rates from Frankfurter (free, no key, CORS-enabled).
const RATES_URL = 'https://api.frankfurter.dev/v1/latest'
const CACHE_MS = 12 * 60 * 60 * 1000

export interface Rates {
  base: string
  date: string
  /** 1 unit of `base` = rates[cur] units of `cur`. */
  rates: Record<string, number>
}

export type Converter = {
  base: string
  date: string
  /** Converts `amount` in `from` into the base currency; null if the rate is unknown. */
  toBase: (amount: number, from: string) => number | null
}

async function fetchRates(base: string): Promise<Rates> {
  const key = `rates:${base}`
  try {
    const cached = JSON.parse(localStorage.getItem(key) ?? 'null') as (Rates & { at: number }) | null
    if (cached && Date.now() - cached.at < CACHE_MS) return cached
  } catch {
    // storage unavailable or corrupt: fetch fresh
  }
  const res = await fetch(`${RATES_URL}?base=${encodeURIComponent(base)}`)
  if (!res.ok) throw new Error(`Exchange rates unavailable (${res.status})`)
  const data = (await res.json()) as Rates
  try {
    localStorage.setItem(key, JSON.stringify({ ...data, at: Date.now() }))
  } catch {
    // ignore
  }
  return data
}

export function makeConverter(r: Rates): Converter {
  return {
    base: r.base,
    date: r.date,
    toBase: (amount, from) => {
      if (from === r.base) return amount
      const rate = r.rates[from]
      return rate ? amount / rate : null
    },
  }
}

/** Converter into `base`, or null while loading / if rates can't be fetched (callers fall back to per-currency totals). */
export function useConverter(base: string | null | undefined): Converter | null {
  const [conv, setConv] = useState<Converter | null>(null)
  useEffect(() => {
    if (!base) return
    let alive = true
    fetchRates(base)
      .then((r) => alive && setConv(makeConverter(r)))
      .catch(() => alive && setConv(null))
    return () => {
      alive = false
    }
  }, [base])
  return conv?.base === base ? conv : null
}
