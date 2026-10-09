import type { BillingCycle } from './types'

export const CATEGORIES = [
  'Entertainment',
  'Music',
  'AI',
  'Productivity',
  'Cloud Storage',
  'Gaming',
  'Education',
  'News',
  'Fitness',
  'Utilities',
  'Other',
] as const

export const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: '#f43f5e',
  Music: '#22c55e',
  AI: '#f97316',
  Productivity: '#6366f1',
  'Cloud Storage': '#0ea5e9',
  Gaming: '#a855f7',
  Education: '#eab308',
  News: '#64748b',
  Fitness: '#14b8a6',
  Utilities: '#78716c',
  Other: '#94a3b8',
}

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'AED'] as const

export interface CatalogItem {
  key: string
  name: string
  category: (typeof CATEGORIES)[number]
  color: string // brand color for the initial badge
  cycle: BillingCycle
}

// Prices vary by country and plan, so the catalog only pre-fills name, category and cycle.
export const CATALOG: CatalogItem[] = [
  { key: 'netflix', name: 'Netflix', category: 'Entertainment', color: '#E50914', cycle: 'monthly' },
  { key: 'amazon-prime', name: 'Amazon Prime', category: 'Entertainment', color: '#00A8E1', cycle: 'yearly' },
  { key: 'jiohotstar', name: 'JioHotstar', category: 'Entertainment', color: '#1F2B6C', cycle: 'quarterly' },
  { key: 'youtube-premium', name: 'YouTube Premium', category: 'Entertainment', color: '#FF0000', cycle: 'monthly' },
  { key: 'disney-plus', name: 'Disney+', category: 'Entertainment', color: '#113CCF', cycle: 'monthly' },
  { key: 'sonyliv', name: 'SonyLIV', category: 'Entertainment', color: '#000000', cycle: 'yearly' },
  { key: 'zee5', name: 'ZEE5', category: 'Entertainment', color: '#8230C6', cycle: 'yearly' },
  { key: 'spotify', name: 'Spotify', category: 'Music', color: '#1DB954', cycle: 'monthly' },
  { key: 'apple-music', name: 'Apple Music', category: 'Music', color: '#FA243C', cycle: 'monthly' },
  { key: 'chatgpt-plus', name: 'ChatGPT', category: 'AI', color: '#10A37F', cycle: 'monthly' },
  { key: 'claude-pro', name: 'Claude', category: 'AI', color: '#D97757', cycle: 'monthly' },
  { key: 'github-copilot', name: 'GitHub Copilot', category: 'AI', color: '#24292F', cycle: 'monthly' },
  { key: 'microsoft-365', name: 'Microsoft 365', category: 'Productivity', color: '#D83B01', cycle: 'yearly' },
  { key: 'notion', name: 'Notion', category: 'Productivity', color: '#191919', cycle: 'monthly' },
  { key: 'canva', name: 'Canva', category: 'Productivity', color: '#00C4CC', cycle: 'yearly' },
  { key: 'adobe-cc', name: 'Adobe Creative Cloud', category: 'Productivity', color: '#DA1F26', cycle: 'monthly' },
  { key: 'google-one', name: 'Google One', category: 'Cloud Storage', color: '#4285F4', cycle: 'monthly' },
  { key: 'icloud', name: 'iCloud+', category: 'Cloud Storage', color: '#3693F3', cycle: 'monthly' },
  { key: 'dropbox', name: 'Dropbox', category: 'Cloud Storage', color: '#0061FF', cycle: 'monthly' },
  { key: 'xbox-game-pass', name: 'Xbox Game Pass', category: 'Gaming', color: '#107C10', cycle: 'monthly' },
  { key: 'playstation-plus', name: 'PlayStation Plus', category: 'Gaming', color: '#003791', cycle: 'yearly' },
  { key: 'duolingo', name: 'Duolingo', category: 'Education', color: '#58CC02', cycle: 'yearly' },
  { key: 'linkedin-premium', name: 'LinkedIn Premium', category: 'Productivity', color: '#0A66C2', cycle: 'monthly' },
]

// App icons live in public/logos/<key>.png (a few sites only serve JPEG).
const JPEG_LOGOS = new Set(['canva', 'playstation-plus', 'zee5'])

export function logoUrl(key: string | null | undefined) {
  if (!key || !findCatalogItem(key)) return undefined
  return `/logos/${key}.${JPEG_LOGOS.has(key) ? 'jpg' : 'png'}`
}

export function findCatalogItem(key: string | null | undefined) {
  return key ? CATALOG.find((c) => c.key === key) : undefined
}
