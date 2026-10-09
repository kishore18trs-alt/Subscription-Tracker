-- Subscription Tracker: initial schema
-- Run in Supabase dashboard → SQL Editor (or `supabase db push`).

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  display_name          text,
  timezone              text    not null default 'UTC',
  currency              text    not null default 'USD',
  reminder_days_before  int     not null default 3 check (reminder_days_before between 0 and 30),
  email_reminders       boolean not null default true,
  push_reminders        boolean not null default true,
  created_at            timestamptz not null default now()
);

-- Auto-create a profile row on signup (picks up timezone sent from the browser).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, timezone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────── subscriptions ───────────────────────
create table public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 100),
  amount             numeric(12, 2) not null check (amount >= 0),
  currency           text not null default 'USD' check (char_length(currency) = 3),
  billing_cycle      text not null default 'monthly'
                       check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_billing_date  date not null,
  category           text,
  status             text not null default 'active'
                       check (status in ('active', 'paused', 'cancelled')),
  catalog_key        text,          -- e.g. 'netflix' when added via quick-add
  notes              text,
  deleted_at         timestamptz,   -- soft delete (enables undo)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index subscriptions_user_idx
  on public.subscriptions (user_id) where deleted_at is null;
create index subscriptions_due_idx
  on public.subscriptions (next_billing_date) where status = 'active' and deleted_at is null;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ───────────────────── push device tokens ─────────────────────
create table public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token       text not null unique,
  platform    text not null default 'web',
  created_at  timestamptz not null default now()
);

-- ─────────────── reminder log (written by the cron job) ───────────────
-- Unique key prevents sending the same reminder twice.
create table public.reminder_log (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references public.subscriptions (id) on delete cascade,
  billing_date     date not null,
  channel          text not null check (channel in ('email', 'push')),
  sent_at          timestamptz not null default now(),
  unique (subscription_id, billing_date, channel)
);

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.push_tokens   enable row level security;
alter table public.reminder_log  enable row level security;  -- no policies: service role only

create policy "profiles: read own"   on public.profiles for select using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update using ((select auth.uid()) = id)
                                                                  with check ((select auth.uid()) = id);

create policy "subscriptions: read own"   on public.subscriptions for select using ((select auth.uid()) = user_id);
create policy "subscriptions: insert own" on public.subscriptions for insert with check ((select auth.uid()) = user_id);
create policy "subscriptions: update own" on public.subscriptions for update using ((select auth.uid()) = user_id)
                                                                            with check ((select auth.uid()) = user_id);
create policy "subscriptions: delete own" on public.subscriptions for delete using ((select auth.uid()) = user_id);

create policy "push_tokens: read own"   on public.push_tokens for select using ((select auth.uid()) = user_id);
create policy "push_tokens: insert own" on public.push_tokens for insert with check ((select auth.uid()) = user_id);
create policy "push_tokens: delete own" on public.push_tokens for delete using ((select auth.uid()) = user_id);
