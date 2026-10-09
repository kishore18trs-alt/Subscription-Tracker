-- Free trials, monthly budget, and price-change history.
-- Run in Supabase dashboard → SQL Editor.

-- ─────────────────────── free trials ───────────────────────
-- During a trial, next_billing_date is the first paid charge (= trial_ends_on).
alter table public.subscriptions
  add column is_trial      boolean not null default false,
  add column trial_ends_on date;

-- ─────────────────────── budget ───────────────────────
-- In the profile's default currency.
alter table public.profiles
  add column monthly_budget numeric(12, 2) check (monthly_budget is null or monthly_budget > 0);

-- ─────────────────────── price history ───────────────────────
create table public.price_history (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references public.subscriptions (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  old_amount       numeric(12, 2) not null,
  new_amount       numeric(12, 2) not null,
  old_currency     text not null,
  new_currency     text not null,
  changed_at       timestamptz not null default now()
);

create index price_history_sub_idx on public.price_history (subscription_id, changed_at desc);

alter table public.price_history enable row level security;
create policy "price_history: read own" on public.price_history
  for select using ((select auth.uid()) = user_id);

-- Log every amount/currency change. Security definer so users can't write history directly.
create function public.log_price_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.amount is distinct from old.amount or new.currency is distinct from old.currency then
    insert into public.price_history (subscription_id, user_id, old_amount, new_amount, old_currency, new_currency)
    values (new.id, new.user_id, old.amount, new.amount, old.currency, new.currency);
  end if;
  return new;
end;
$$;

create trigger subscriptions_log_price
  after update on public.subscriptions
  for each row execute function public.log_price_change();
