// "How to cancel" data for the cancel helper. Where you cancel depends on where you subscribed,
// so each service has web steps and the app-store / UPI steps are shared.
// Checked against official help pages on 2026-10-08.

export interface CancelInfo {
  url: string // account or cancellation page
  helpUrl?: string // official help article, if different
  steps: string[] // on the website
  note?: string
}

export type CancelPlatform = 'website' | 'appStore' | 'playStore' | 'upi'

export const PLATFORM_LABEL: Record<CancelPlatform, string> = {
  website: 'Website',
  appStore: 'iPhone',
  playStore: 'Android',
  upi: 'UPI / card',
}

export const PLATFORM_STEPS: Record<Exclude<CancelPlatform, 'website' | 'upi'>, string[]> = {
  appStore: ['Open Settings and tap your name', 'Tap Subscriptions', 'Pick the app', 'Tap Cancel Subscription'],
  playStore: [
    'Open Google Play and tap your profile icon',
    'Tap Payments & subscriptions → Subscriptions',
    'Pick the app',
    'Tap Cancel subscription and follow the prompts',
  ],
}

export const UPI_STEPS: { app: string; steps: string[] }[] = [
  {
    app: 'Google Pay',
    steps: ['Tap your profile picture (top right)', 'Tap Autopay', 'On the Live tab, tap the mandate', 'Tap Cancel autopay and enter your UPI PIN'],
  },
  {
    app: 'PhonePe',
    steps: ['Tap your profile picture', 'Under Payment Management, tap AutoPay', 'Select the AutoPay', 'Tap Remove AutoPay and enter your UPI PIN'],
  },
  {
    app: 'Paytm',
    steps: ['Tap your profile icon (top left)', 'Tap UPI & Payment Settings → Automatic Payments', 'Select the mandate', 'Tap Cancel Automatic Payment and enter your UPI PIN'],
  },
  {
    app: 'Card mandate',
    steps: ["Open your bank's app or net banking", 'Find standing instructions / e-mandates', 'Cancel the one for this service'],
  },
]

const APP_STORE_NOTE = 'Subscribed in the iPhone or Android app? Use the iPhone or Android tab instead.'

export const CANCEL_INFO: Record<string, CancelInfo> = {
  netflix: {
    url: 'https://www.netflix.com/cancelplan',
    helpUrl: 'https://help.netflix.com/en/node/407',
    steps: ['Open netflix.com/cancelplan and sign in', 'Click Cancel', 'Click Finish Cancellation'],
    note: "No Cancel button? A partner like Jio, Airtel or Google Play bills you. Cancel with them; your Account page shows which one.",
  },
  'amazon-prime': {
    url: 'https://www.amazon.in/gp/primecentral',
    steps: ['Open Your Account → Prime Membership', 'Click Manage membership → Update, cancel and more', 'Click End membership and confirm through the offer screens'],
    note: 'Outside India use amazon.com/gp/primecentral. Prime from a Jio or Airtel plan is cancelled with the carrier.',
  },
  jiohotstar: {
    url: 'https://www.hotstar.com/in',
    helpUrl: 'https://help.hotstar.com/',
    steps: ['Sign in and open My Space', 'Go to Subscription & Devices', 'Tap Cancel next to your plan', 'Confirm Cancel auto-renewal'],
    note: 'Got it with a Jio or Airtel recharge? It ends with the recharge. Also revoke any UPI AutoPay mandate.',
  },
  'youtube-premium': {
    url: 'https://www.youtube.com/paid_memberships',
    helpUrl: 'https://support.google.com/youtube/answer/6308278',
    steps: ['Open youtube.com/paid_memberships', 'Click Manage membership', 'Click Deactivate, then Continue to cancel', 'Confirm Yes, cancel'],
    note: APP_STORE_NOTE,
  },
  'disney-plus': {
    url: 'https://www.disneyplus.com/account',
    helpUrl: 'https://help.disneyplus.com/',
    steps: ['Sign in at disneyplus.com and open Account', 'Select your Disney+ subscription', 'Click Cancel Subscription and confirm'],
    note: 'In India, Disney+ comes through JioHotstar. Cancel that instead.',
  },
  sonyliv: {
    url: 'https://help.sonyliv.com/categories/cat-subscription/articles/how-can-i-cancel-my-subscription',
    steps: ['Sign in to SonyLIV and open My Purchases', 'Click Cancel', 'Pick a reason and Submit'],
    note: 'Bought through Play Store, App Store, broadband or Amazon Channels? Cancel with that partner.',
  },
  zee5: {
    url: 'https://helpcenter.zee5.com/portal/en/kb/articles/how-do-i-cancel-auto-renewal-of-my-subscription',
    steps: ['Sign in at zee5.com on a desktop browser', 'Go to Profile → Control Center → My Subscription', 'Click Cancel Renewal and confirm'],
    note: 'If the button fails, email support.in@zee5.com.',
  },
  spotify: {
    url: 'https://www.spotify.com/account/',
    helpUrl: 'https://support.spotify.com/article/cancel-premium/',
    steps: ['Open spotify.com/account and sign in', 'Under Your plan, click Cancel plan', 'Follow the confirmation prompts'],
    note: 'Premium stays active until the next billing date.',
  },
  'apple-music': {
    url: 'https://music.apple.com/',
    helpUrl: 'https://support.apple.com/en-us/118399',
    steps: ['Sign in at music.apple.com', 'Click your profile → Settings', 'Under Subscriptions, click Manage', 'Click Cancel Subscription'],
    note: 'On iPhone: Settings → your name → Subscriptions → Apple Music.',
  },
  'chatgpt-plus': {
    url: 'https://help.openai.com/en/articles/7232927',
    steps: ['On chatgpt.com, click your profile → Settings', 'Open Account (or Subscription)', 'Click Cancel subscription and confirm'],
    note: `Cancel at least 24 hours before renewal. ${APP_STORE_NOTE}`,
  },
  'claude-pro': {
    url: 'https://claude.ai/settings/billing',
    helpUrl: 'https://support.claude.com/en/articles/8325617',
    steps: ['On claude.ai, click your name (bottom left) → Settings', 'Open Billing', 'Click Cancel and confirm'],
    note: `Covers Pro and Max. Cancel at least 24 hours before the billing date. ${APP_STORE_NOTE}`,
  },
  'github-copilot': {
    url: 'https://github.com/settings/billing/licensing',
    helpUrl: 'https://docs.github.com/en/copilot/how-tos/manage-your-account/view-and-change-your-copilot-plan',
    steps: ['Profile picture → Settings → Billing & licensing → Licensing', 'In GitHub Copilot, open Manage subscription', 'Click Cancel subscription'],
    note: 'Free student or open-source access and organisation seats are not cancelled here.',
  },
  'microsoft-365': {
    url: 'https://account.microsoft.com/services/microsoft365',
    helpUrl: 'https://support.microsoft.com/topic/46e2634c-c64b-4c65-94b9-2cc9c960e91b',
    steps: ['Open account.microsoft.com/services/microsoft365', 'Click Cancel subscription', "Click I don't want my subscription"],
    note: "Seeing 'Turn on recurring billing'? It's already set to expire.",
  },
  notion: {
    url: 'https://www.notion.com/help/upgrade-or-downgrade-your-plan',
    steps: ['In the sidebar, open Settings → Billing', 'Click Change plan and pick Free', 'Click Downgrade'],
    note: 'Only the workspace owner can do this, on desktop or web.',
  },
  canva: {
    url: 'https://www.canva.com/settings/billing-and-plans',
    helpUrl: 'https://www.canva.com/help/cancel-subscription/',
    steps: ['Open Account settings → Billing & plans', 'Choose your Canva Pro plan', 'Click Cancel subscription, then Continue cancellation'],
    note: 'Canva may offer a pause instead. For team plans, only the admin can cancel.',
  },
  'adobe-cc': {
    url: 'https://account.adobe.com/plans',
    helpUrl: 'https://helpx.adobe.com/in/manage-account/using/cancel-subscription.html',
    steps: ['Open account.adobe.com/plans and sign in', 'Click Manage plan', 'Click Cancel your plan, pick a reason and confirm'],
    note: 'Annual plans paid monthly charge 50% of the remaining contract if you cancel after 14 days. Within 14 days you get a full refund.',
  },
  'google-one': {
    url: 'https://one.google.com/settings',
    helpUrl: 'https://support.google.com/googleone/answer/9056360',
    steps: ['Open one.google.com and go to Settings', 'Click Cancel membership', 'Confirm'],
    note: APP_STORE_NOTE,
  },
  icloud: {
    url: 'https://support.apple.com/HT207594',
    steps: ['On iPhone: Settings → your name → Subscriptions', 'Tap iCloud+', 'Tap Cancel Subscription (or See All Plans to downgrade)'],
    note: 'Done on a device, not a website. The change applies at the end of the billing period.',
  },
  dropbox: {
    url: 'https://www.dropbox.com/account/billing',
    helpUrl: 'https://help.dropbox.com/billing/cancel-subscription',
    steps: ['On dropbox.com, click your avatar → Manage account', 'Click Cancel plan at the bottom', 'Pick a reason and confirm'],
    note: 'No Cancel plan button means you bought it in an app store. Your account drops to Basic (2 GB).',
  },
  'xbox-game-pass': {
    url: 'https://account.microsoft.com/services',
    helpUrl: 'https://support.xbox.com/en-US/help/subscriptions-billing/manage-subscriptions/cancel-recurring-billing-or-subscriptions',
    steps: ['Open account.microsoft.com/services', 'Find Game Pass and click Manage', 'Click Cancel subscription and confirm'],
    note: "Seeing 'Turn on recurring billing'? It's already set to expire.",
  },
  'playstation-plus': {
    url: 'https://www.playstation.com/acct/management',
    helpUrl: 'https://www.playstation.com/en-in/support/store/cancel-ps-store-subscription/',
    steps: ['Open playstation.com/acct/management and sign in', 'Open Subscription', 'Click Cancel under PlayStation Plus'],
    note: 'It stays active until the next payment date.',
  },
  duolingo: {
    url: 'https://www.duolingo.com/settings/super',
    helpUrl: 'https://www.duolingo.com/help',
    steps: ['Sign in at duolingo.com → Settings → Super Duolingo', 'Click Cancel subscription', 'Pick a reason and confirm'],
    note: APP_STORE_NOTE,
  },
  'linkedin-premium': {
    url: 'https://www.linkedin.com/psettings/premium-subscription',
    helpUrl: 'https://www.linkedin.com/help/billing/answer/a545578',
    steps: ['Click Me → Premium features', 'Click Manage subscription → Purchases', 'Select the subscription and click Cancel', 'Confirm'],
    note: 'Cancel at least 1 day before the billing date.',
  },
}

export function cancelInfoFor(catalogKey: string | null | undefined) {
  return catalogKey ? CANCEL_INFO[catalogKey] : undefined
}
