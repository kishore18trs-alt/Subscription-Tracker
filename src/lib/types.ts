export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'

export interface Subscription {
  id: string
  user_id: string
  name: string
  amount: number
  currency: string
  billing_cycle: BillingCycle
  next_billing_date: string // YYYY-MM-DD
  category: string | null
  status: SubscriptionStatus
  catalog_key: string | null
  plan_key: string | null
  notes: string | null
  cancelled_at: string | null
  paused_until: string | null // YYYY-MM-DD, auto-resume date
  cancel_check_on: string | null // YYYY-MM-DD, "Did you cancel?" follow-up
  is_trial: boolean
  trial_ends_on: string | null // YYYY-MM-DD; the first paid charge happens this day
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  timezone: string
  currency: string
  reminder_days_before: number
  email_reminders: boolean
  push_reminders: boolean
  monthly_budget: number | null
  created_at: string
}

export interface PriceChange {
  id: string
  subscription_id: string
  old_amount: number
  new_amount: number
  old_currency: string
  new_currency: string
  changed_at: string
}
