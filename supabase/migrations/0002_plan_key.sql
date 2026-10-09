-- Which catalog plan a subscription was created from (e.g. 'claude-pro-monthly').
-- Lets us flag subscriptions when the catalog price changes later.
alter table public.subscriptions add column plan_key text;
