-- Cancel / pause / delete lifecycle, 30-day purge, and account deletion.
-- Run in Supabase dashboard → SQL Editor.

-- ─────────────────────── new columns ───────────────────────
alter table public.subscriptions
  add column cancelled_at    timestamptz,  -- when it was marked cancelled (drives "money saved")
  add column paused_until    date,         -- optional auto-resume date
  add column cancel_check_on date;         -- "Did you cancel?" follow-up date

-- Keep the lifecycle columns consistent whatever the client sends.
create function public.sync_status_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'cancelled' then
    if old.status is distinct from 'cancelled' then
      new.cancelled_at = now();
    end if;
    new.cancel_check_on = null;
  else
    new.cancelled_at = null;
  end if;

  if new.status <> 'paused' then
    new.paused_until = null;
  end if;
  return new;
end;
$$;

create trigger subscriptions_sync_status
  before update on public.subscriptions
  for each row execute function public.sync_status_fields();

-- ─────────────────────── account deletion ───────────────────────
-- Deletes the caller's auth user; profiles, subscriptions, push tokens and
-- reminder log rows go with it through ON DELETE CASCADE.
create function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ─────────────────────── scheduled jobs ───────────────────────
create extension if not exists pg_cron;

-- Permanently remove subscriptions deleted more than 30 days ago (daily, 02:30 UTC).
select cron.schedule(
  'purge-deleted-subscriptions',
  '30 2 * * *',
  $$ delete from public.subscriptions where deleted_at < now() - interval '30 days' $$
);

-- Resume paused subscriptions whose resume date has arrived (daily, 00:05 UTC).
select cron.schedule(
  'auto-resume-paused',
  '5 0 * * *',
  $$ update public.subscriptions set status = 'active'
     where status = 'paused' and paused_until is not null and paused_until <= current_date $$
);
