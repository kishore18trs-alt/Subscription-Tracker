import { supabase } from './supabase'
import type { PriceChange, Profile, Subscription, SubscriptionStatus } from './types'

export type SubscriptionInput = Pick<
  Subscription,
  'name' | 'amount' | 'currency' | 'billing_cycle' | 'next_billing_date' | 'category' | 'catalog_key' | 'plan_key' | 'notes' | 'is_trial' | 'trial_ends_on'
>

/** Days a deleted subscription stays in "Recently deleted" before the purge job removes it. */
export const DELETE_RETENTION_DAYS = 30

// numeric columns come back as strings from PostgREST
const parse = (s: Subscription): Subscription => ({ ...s, amount: Number(s.amount) })

export async function listSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .is('deleted_at', null)
    .order('next_billing_date', { ascending: true })
  if (error) throw error
  return data.map(parse)
}

export async function listDeleted(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw error
  return data.map(parse)
}

export async function getSubscription(id: string): Promise<Subscription> {
  const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id).is('deleted_at', null).single()
  if (error) throw error
  return parse(data)
}

export async function createSubscription(input: SubscriptionInput) {
  const { error } = await supabase.from('subscriptions').insert(input)
  if (error) throw error
}

export async function updateSubscription(id: string, input: Partial<SubscriptionInput>) {
  const { error } = await supabase.from('subscriptions').update(input).eq('id', id)
  if (error) throw error
}

/** Status changes. The DB trigger keeps cancelled_at / paused_until in step with status. */
export async function setStatus(
  id: string,
  status: SubscriptionStatus,
  extra: Partial<Pick<Subscription, 'paused_until'>> = {},
) {
  const { error } = await supabase.from('subscriptions').update({ status, ...extra }).eq('id', id)
  if (error) throw error
}

export async function setCancelCheck(id: string, date: string | null) {
  const { error } = await supabase.from('subscriptions').update({ cancel_check_on: date }).eq('id', id)
  if (error) throw error
}

/** Soft delete: hidden everywhere, restorable from "Recently deleted" for 30 days. */
export async function softDelete(ids: string[]) {
  const { error } = await supabase.from('subscriptions').update({ deleted_at: new Date().toISOString() }).in('id', ids)
  if (error) throw error
}

export async function restore(ids: string[]) {
  const { error } = await supabase.from('subscriptions').update({ deleted_at: null }).in('id', ids)
  if (error) throw error
}

/** Permanent delete, skipping the 30-day bin. */
export async function purge(ids: string[]) {
  const { error } = await supabase.from('subscriptions').delete().in('id', ids)
  if (error) throw error
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle()
  if (error) throw error
  return data && { ...data, monthly_budget: data.monthly_budget === null ? null : Number(data.monthly_budget) }
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, 'display_name' | 'currency' | 'reminder_days_before' | 'email_reminders' | 'push_reminders' | 'monthly_budget'>>,
) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) throw error
}

export async function listPriceHistory(subscriptionId: string): Promise<PriceChange[]> {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('changed_at', { ascending: false })
  if (error) throw error
  return data.map((p) => ({ ...p, old_amount: Number(p.old_amount), new_amount: Number(p.new_amount) }))
}

/** Deletes the auth user and, by cascade, every row they own. */
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
  await supabase.auth.signOut()
}

/** Currency for a new subscription: the one used most recently, else the profile default. */
export async function defaultCurrency(): Promise<string> {
  const { data } = await supabase
    .from('subscriptions')
    .select('currency')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (data?.currency) return data.currency
  const profile = await getProfile()
  return profile?.currency ?? 'USD'
}
