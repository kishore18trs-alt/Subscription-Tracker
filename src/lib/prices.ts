import type { BillingCycle } from './types'

export interface CatalogPlan {
  id: string
  name: string
  cycle: BillingCycle
  /** List price per currency. A missing currency means the plan isn't sold there. */
  prices: Partial<Record<string, number>>
  /** Not confirmed on the official pricing page (third-party source, promo-heavy or region-locked). */
  approx?: boolean
}

/** When these prices were last checked against the official pricing pages. */
export const PRICES_CHECKED_ON = '2026-10-08'

export const PLANS: Record<string, CatalogPlan[]> = {
  'netflix': [
    { id: 'netflix-mobile', name: 'Mobile', cycle: 'monthly', prices: { INR: 149 } },
    { id: 'netflix-basic', name: 'Basic', cycle: 'monthly', prices: { INR: 199 } },
    { id: 'netflix-standard-ads', name: 'Standard with ads', cycle: 'monthly', prices: { USD: 8.99 } },
    { id: 'netflix-standard', name: 'Standard', cycle: 'monthly', prices: { INR: 499, USD: 19.99 } },
    { id: 'netflix-premium', name: 'Premium', cycle: 'monthly', prices: { INR: 649, USD: 26.99 } },
  ],
  'amazon-prime': [
    { id: 'amazon-prime-monthly', name: 'Prime (Monthly)', cycle: 'monthly', prices: { INR: 299, USD: 14.99 } },
    { id: 'amazon-prime-quarterly', name: 'Prime (Quarterly)', cycle: 'quarterly', prices: { INR: 599 }, approx: true },
    { id: 'amazon-prime-yearly', name: 'Prime (Annual)', cycle: 'yearly', prices: { INR: 1499, USD: 139 } },
    { id: 'amazon-prime-lite', name: 'Prime Lite', cycle: 'yearly', prices: { INR: 799 } },
    { id: 'amazon-prime-shopping', name: 'Prime Shopping Edition', cycle: 'yearly', prices: { INR: 399 }, approx: true },
    { id: 'amazon-prime-young-adult-monthly', name: 'Young Adults (Monthly)', cycle: 'monthly', prices: { USD: 7.49 } },
    { id: 'amazon-prime-young-adult-yearly', name: 'Young Adults (Annual)', cycle: 'yearly', prices: { USD: 69 } },
    { id: 'amazon-prime-video', name: 'Prime Video only', cycle: 'monthly', prices: { USD: 8.99 }, approx: true },
  ],
  'jiohotstar': [
    { id: 'jiohotstar-mobile-monthly', name: 'Mobile (Monthly)', cycle: 'monthly', prices: { INR: 79 } },
    { id: 'jiohotstar-mobile-quarterly', name: 'Mobile (Quarterly)', cycle: 'quarterly', prices: { INR: 149 } },
    { id: 'jiohotstar-mobile-yearly', name: 'Mobile (Annual)', cycle: 'yearly', prices: { INR: 499 } },
    { id: 'jiohotstar-super-monthly', name: 'Super (Monthly)', cycle: 'monthly', prices: { INR: 149 } },
    { id: 'jiohotstar-super-quarterly', name: 'Super (Quarterly)', cycle: 'quarterly', prices: { INR: 349 } },
    { id: 'jiohotstar-super-yearly', name: 'Super (Annual)', cycle: 'yearly', prices: { INR: 1099 } },
    { id: 'jiohotstar-premium-monthly', name: 'Premium (Monthly)', cycle: 'monthly', prices: { INR: 299 } },
    { id: 'jiohotstar-premium-quarterly', name: 'Premium (Quarterly)', cycle: 'quarterly', prices: { INR: 699 } },
    { id: 'jiohotstar-premium-yearly', name: 'Premium (Annual)', cycle: 'yearly', prices: { INR: 2199 } },
  ],
  'youtube-premium': [
    { id: 'youtube-premium-individual', name: 'Individual', cycle: 'monthly', prices: { INR: 149, USD: 15.99 } },
    { id: 'youtube-premium-individual-yearly', name: 'Individual (Annual)', cycle: 'yearly', prices: { INR: 1490, USD: 159.99 }, approx: true },
    { id: 'youtube-premium-family', name: 'Family', cycle: 'monthly', prices: { INR: 299, USD: 26.99 } },
    { id: 'youtube-premium-student', name: 'Student', cycle: 'monthly', prices: { INR: 89, USD: 8.99 } },
    { id: 'youtube-premium-lite', name: 'Premium Lite', cycle: 'monthly', prices: { INR: 89, USD: 8.99 } },
  ],
  'disney-plus': [
    { id: 'disney-plus-basic', name: 'Basic (with ads)', cycle: 'monthly', prices: { USD: 12.49 } },
    { id: 'disney-plus-premium', name: 'Premium', cycle: 'monthly', prices: { USD: 21.49 } },
    { id: 'disney-plus-premium-yearly', name: 'Premium (Annual)', cycle: 'yearly', prices: { USD: 214.99 } },
  ],
  'sonyliv': [
    { id: 'sonyliv-mobile-yearly', name: 'Mobile Only (Annual)', cycle: 'yearly', prices: { INR: 699 } },
    { id: 'sonyliv-premium-monthly', name: 'Premium (Monthly)', cycle: 'monthly', prices: { INR: 399 }, approx: true },
    { id: 'sonyliv-premium-yearly', name: 'Premium (Annual)', cycle: 'yearly', prices: { INR: 1499 } },
  ],
  'zee5': [
    { id: 'zee5-hd-monthly', name: 'Premium HD (Monthly)', cycle: 'monthly', prices: { INR: 199 }, approx: true },
    { id: 'zee5-quarterly', name: 'Premium (3 months)', cycle: 'quarterly', prices: { INR: 299 }, approx: true },
    { id: 'zee5-hd-yearly', name: 'Premium HD (Annual)', cycle: 'yearly', prices: { INR: 999 }, approx: true },
    { id: 'zee5-4k-yearly', name: 'Premium 4K (Annual)', cycle: 'yearly', prices: { INR: 1299 }, approx: true },
    { id: 'zee5-south-4k-yearly', name: 'South 4K (Annual)', cycle: 'yearly', prices: { INR: 749 }, approx: true },
  ],
  'spotify': [
    { id: 'spotify-individual', name: 'Individual / Standard', cycle: 'monthly', prices: { INR: 139, USD: 12.99 } },
    { id: 'spotify-student', name: 'Student', cycle: 'monthly', prices: { INR: 69, USD: 6.99 } },
    { id: 'spotify-duo', name: 'Duo', cycle: 'monthly', prices: { USD: 18.99 } },
    { id: 'spotify-family', name: 'Family', cycle: 'monthly', prices: { USD: 21.99 } },
    { id: 'spotify-platinum', name: 'Platinum', cycle: 'monthly', prices: { INR: 299 } },
  ],
  'apple-music': [
    { id: 'apple-music-individual', name: 'Individual', cycle: 'monthly', prices: { INR: 139, USD: 11.99 } },
    { id: 'apple-music-family', name: 'Family', cycle: 'monthly', prices: { INR: 229, USD: 19.99 } },
    { id: 'apple-music-student', name: 'Student', cycle: 'monthly', prices: { INR: 69, USD: 6.99 } },
  ],
  'chatgpt-plus': [
    { id: 'chatgpt-plus-go', name: 'Go', cycle: 'monthly', prices: { INR: 399, USD: 8 }, approx: true },
    { id: 'chatgpt-plus-plus', name: 'Plus', cycle: 'monthly', prices: { INR: 1999, USD: 20 } },
    { id: 'chatgpt-plus-pro100', name: 'Pro (5x)', cycle: 'monthly', prices: { USD: 100 }, approx: true },
    { id: 'chatgpt-plus-pro200', name: 'Pro (20x)', cycle: 'monthly', prices: { INR: 19900, USD: 200 } },
  ],
  'claude-pro': [
    { id: 'claude-pro-monthly', name: 'Pro (monthly)', cycle: 'monthly', prices: { USD: 20 } },
    { id: 'claude-pro-annual', name: 'Pro (annual)', cycle: 'yearly', prices: { USD: 200 } },
    { id: 'claude-pro-max5x', name: 'Max 5x', cycle: 'monthly', prices: { USD: 100 } },
    { id: 'claude-pro-max20x', name: 'Max 20x', cycle: 'monthly', prices: { USD: 200 } },
  ],
  'github-copilot': [
    { id: 'github-copilot-pro-monthly', name: 'Pro (monthly)', cycle: 'monthly', prices: { USD: 10 } },
    { id: 'github-copilot-pro-yearly', name: 'Pro (yearly)', cycle: 'yearly', prices: { USD: 100 } },
    { id: 'github-copilot-proplus-monthly', name: 'Pro+ (monthly)', cycle: 'monthly', prices: { USD: 39 } },
    { id: 'github-copilot-proplus-yearly', name: 'Pro+ (yearly)', cycle: 'yearly', prices: { USD: 390 } },
  ],
  'microsoft-365': [
    { id: 'microsoft-365-basic-monthly', name: 'Basic (monthly)', cycle: 'monthly', prices: { USD: 1.99 }, approx: true },
    { id: 'microsoft-365-basic-yearly', name: 'Basic (yearly)', cycle: 'yearly', prices: { USD: 19.99 }, approx: true },
    { id: 'microsoft-365-personal-monthly', name: 'Personal (monthly)', cycle: 'monthly', prices: { INR: 689, USD: 9.99 } },
    { id: 'microsoft-365-personal-yearly', name: 'Personal (yearly)', cycle: 'yearly', prices: { INR: 6899, USD: 99.99 } },
    { id: 'microsoft-365-family-monthly', name: 'Family (monthly)', cycle: 'monthly', prices: { INR: 819, USD: 12.99 } },
    { id: 'microsoft-365-family-yearly', name: 'Family (yearly)', cycle: 'yearly', prices: { INR: 8199, USD: 129.99 } },
    { id: 'microsoft-365-premium-monthly', name: 'Premium (monthly)', cycle: 'monthly', prices: { INR: 1999, USD: 19.99 } },
    { id: 'microsoft-365-premium-yearly', name: 'Premium (yearly)', cycle: 'yearly', prices: { INR: 19999, USD: 199.99 } },
  ],
  'notion': [
    { id: 'notion-plus-monthly', name: 'Plus (monthly, per seat)', cycle: 'monthly', prices: { USD: 12 }, approx: true },
    { id: 'notion-plus-yearly', name: 'Plus (yearly, per seat)', cycle: 'yearly', prices: { USD: 120 }, approx: true },
    { id: 'notion-business-monthly', name: 'Business (monthly, per seat)', cycle: 'monthly', prices: { USD: 24 }, approx: true },
    { id: 'notion-business-yearly', name: 'Business (yearly, per seat)', cycle: 'yearly', prices: { USD: 240 }, approx: true },
  ],
  'canva': [
    { id: 'canva-pro-monthly', name: 'Pro (monthly)', cycle: 'monthly', prices: { INR: 499, USD: 18 }, approx: true },
    { id: 'canva-pro-yearly', name: 'Pro (yearly)', cycle: 'yearly', prices: { INR: 3999, USD: 180 }, approx: true },
    { id: 'canva-teams-monthly', name: 'Business (monthly, per person)', cycle: 'monthly', prices: { USD: 25 }, approx: true },
    { id: 'canva-teams-yearly', name: 'Business (yearly, per person)', cycle: 'yearly', prices: { USD: 250 }, approx: true },
  ],
  'adobe-cc': [
    { id: 'adobe-cc-pro-annual-monthly', name: 'CC Pro (annual, paid monthly)', cycle: 'monthly', prices: { INR: 2714, USD: 69.99 } },
    { id: 'adobe-cc-pro-annual-prepaid', name: 'CC Pro (annual, prepaid)', cycle: 'yearly', prices: { USD: 779.99 }, approx: true },
    { id: 'adobe-cc-pro-month-to-month', name: 'CC Pro (month-to-month)', cycle: 'monthly', prices: { USD: 104.99 }, approx: true },
    { id: 'adobe-cc-photography-monthly', name: 'Photography 1TB (paid monthly)', cycle: 'monthly', prices: { USD: 19.99 } },
    { id: 'adobe-cc-photography-yearly', name: 'Photography 1TB (prepaid)', cycle: 'yearly', prices: { USD: 239.88 } },
    { id: 'adobe-cc-single-app-monthly', name: 'Single app (paid monthly)', cycle: 'monthly', prices: { USD: 22.99 } },
    { id: 'adobe-cc-single-app-yearly', name: 'Single app (prepaid)', cycle: 'yearly', prices: { USD: 263.88 }, approx: true },
  ],
  'linkedin-premium': [
    { id: 'linkedin-premium-career-monthly', name: 'Career (monthly)', cycle: 'monthly', prices: { USD: 39.99 }, approx: true },
    { id: 'linkedin-premium-career-yearly', name: 'Career (yearly)', cycle: 'yearly', prices: { USD: 239.88 }, approx: true },
    { id: 'linkedin-premium-business-monthly', name: 'Business (monthly)', cycle: 'monthly', prices: { USD: 69.99 }, approx: true },
    { id: 'linkedin-premium-business-yearly', name: 'Business (yearly)', cycle: 'yearly', prices: { USD: 539.88 }, approx: true },
  ],
  'google-one': [
    { id: 'google-one-100gb-monthly', name: 'Basic 100 GB', cycle: 'monthly', prices: { INR: 130, USD: 1.99 } },
    { id: 'google-one-100gb-yearly', name: 'Basic 100 GB (annual)', cycle: 'yearly', prices: { INR: 1300, USD: 19.99 } },
    { id: 'google-one-200gb-monthly', name: '200 GB', cycle: 'monthly', prices: { INR: 210, USD: 2.99 }, approx: true },
    { id: 'google-one-200gb-yearly', name: '200 GB (annual)', cycle: 'yearly', prices: { INR: 2100, USD: 29.99 }, approx: true },
    { id: 'google-one-2tb-monthly', name: 'Premium 2 TB', cycle: 'monthly', prices: { INR: 650, USD: 9.99 } },
    { id: 'google-one-2tb-yearly', name: 'Premium 2 TB (annual)', cycle: 'yearly', prices: { INR: 6500, USD: 99.99 } },
    { id: 'google-one-ai-pro-monthly', name: 'AI Pro (5 TB)', cycle: 'monthly', prices: { INR: 1950, USD: 19.99 } },
    { id: 'google-one-ai-pro-yearly', name: 'AI Pro (5 TB, annual)', cycle: 'yearly', prices: { INR: 19500, USD: 199.99 }, approx: true },
  ],
  'icloud': [
    { id: 'icloud-50gb', name: '50 GB', cycle: 'monthly', prices: { INR: 75, USD: 0.99 } },
    { id: 'icloud-200gb', name: '200 GB', cycle: 'monthly', prices: { INR: 219, USD: 2.99 } },
    { id: 'icloud-2tb', name: '2 TB', cycle: 'monthly', prices: { INR: 749, USD: 9.99 } },
    { id: 'icloud-6tb', name: '6 TB', cycle: 'monthly', prices: { INR: 2999, USD: 29.99 } },
    { id: 'icloud-12tb', name: '12 TB', cycle: 'monthly', prices: { INR: 5900, USD: 59.99 } },
  ],
  'dropbox': [
    { id: 'dropbox-plus-monthly', name: 'Plus (2 TB)', cycle: 'monthly', prices: { USD: 11.99 } },
    { id: 'dropbox-plus-yearly', name: 'Plus (2 TB, annual)', cycle: 'yearly', prices: { USD: 119.88 } },
    { id: 'dropbox-essentials-monthly', name: 'Essentials (3 TB)', cycle: 'monthly', prices: { USD: 19.99 }, approx: true },
    { id: 'dropbox-essentials-yearly', name: 'Essentials (3 TB, annual)', cycle: 'yearly', prices: { USD: 198.96 }, approx: true },
  ],
  'xbox-game-pass': [
    { id: 'xbox-game-pass-essential', name: 'Essential', cycle: 'monthly', prices: { INR: 499, USD: 9.99 } },
    { id: 'xbox-game-pass-premium', name: 'Premium', cycle: 'monthly', prices: { INR: 699, USD: 14.99 } },
    { id: 'xbox-game-pass-ultimate', name: 'Ultimate', cycle: 'monthly', prices: { INR: 1089, USD: 22.99 } },
    { id: 'xbox-game-pass-pc', name: 'PC Game Pass', cycle: 'monthly', prices: { INR: 879, USD: 13.99 } },
  ],
  'playstation-plus': [
    { id: 'playstation-plus-essential-monthly', name: 'Essential (1 month)', cycle: 'monthly', prices: { INR: 649, USD: 10.99 } },
    { id: 'playstation-plus-essential-quarterly', name: 'Essential (3 months)', cycle: 'quarterly', prices: { INR: 1599, USD: 27.99 } },
    { id: 'playstation-plus-essential-yearly', name: 'Essential (12 months)', cycle: 'yearly', prices: { INR: 5139, USD: 79.99 } },
    { id: 'playstation-plus-extra-monthly', name: 'Extra (1 month)', cycle: 'monthly', prices: { INR: 979, USD: 16.99 } },
    { id: 'playstation-plus-extra-quarterly', name: 'Extra (3 months)', cycle: 'quarterly', prices: { INR: 2599, USD: 43.99 } },
    { id: 'playstation-plus-extra-yearly', name: 'Extra (12 months)', cycle: 'yearly', prices: { INR: 8709, USD: 134.99 } },
    { id: 'playstation-plus-premium-monthly', name: 'Premium / Deluxe (1 month)', cycle: 'monthly', prices: { INR: 1109, USD: 19.99 } },
    { id: 'playstation-plus-premium-quarterly', name: 'Premium / Deluxe (3 months)', cycle: 'quarterly', prices: { INR: 2989, USD: 54.99 } },
    { id: 'playstation-plus-premium-yearly', name: 'Premium / Deluxe (12 months)', cycle: 'yearly', prices: { INR: 9879, USD: 159.99 } },
  ],
  'duolingo': [
    { id: 'duolingo-super-monthly', name: 'Super', cycle: 'monthly', prices: { USD: 12.99 }, approx: true },
    { id: 'duolingo-super-yearly', name: 'Super (annual)', cycle: 'yearly', prices: { INR: 3120, USD: 83.99 }, approx: true },
    { id: 'duolingo-super-family-yearly', name: 'Super Family (annual)', cycle: 'yearly', prices: { USD: 119.99 }, approx: true },
    { id: 'duolingo-max-monthly', name: 'Max', cycle: 'monthly', prices: { USD: 29.99 }, approx: true },
    { id: 'duolingo-max-yearly', name: 'Max (annual)', cycle: 'yearly', prices: { USD: 167.99 }, approx: true },
    { id: 'duolingo-max-family-yearly', name: 'Max Family (annual)', cycle: 'yearly', prices: { USD: 239.99 }, approx: true },
  ],
}

export function plansFor(catalogKey: string | null | undefined): CatalogPlan[] {
  return catalogKey ? (PLANS[catalogKey] ?? []) : []
}
