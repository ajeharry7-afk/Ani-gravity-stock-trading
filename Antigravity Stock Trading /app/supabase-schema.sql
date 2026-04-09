-- ============================================================
-- Antigravity Financial — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- Users table
create table if not exists public.users (
  email             text primary key,
  name              text,
  password          text,
  account_balance   numeric default 0,
  two_factor_enabled boolean default false,
  kyc_data          jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Holdings table
create table if not exists public.holdings (
  id                uuid primary key default gen_random_uuid(),
  user_email        text references public.users(email) on delete cascade,
  symbol            text not null,
  company_name      text,
  shares            numeric not null,
  purchase_price    numeric not null,
  current_price     numeric not null,
  ownership_type    text default 'individual',
  joint_holder_name text,
  purchase_date     timestamptz default now(),
  status            text default 'completed',
  created_at        timestamptz default now()
);

-- Notifications table (admin → user messages)
create table if not exists public.user_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_email  text references public.users(email) on delete cascade,
  title       text not null,
  message     text not null,
  type        text default 'info',
  created_at  timestamptz default now()
);

-- Auto-update updated_at on users
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_users_updated on public.users;
create trigger on_users_updated
  before update on public.users
  for each row execute function public.handle_updated_at();

-- Row Level Security
alter table public.users enable row level security;
alter table public.holdings enable row level security;
alter table public.user_notifications enable row level security;

-- Drop existing policies before recreating
drop policy if exists "Service role full access to users" on public.users;
drop policy if exists "Service role full access to holdings" on public.holdings;
drop policy if exists "Service role full access to notifications" on public.user_notifications;

-- Recreate policies
create policy "Service role full access to users"
  on public.users for all using (true) with check (true);

create policy "Service role full access to holdings"
  on public.holdings for all using (true) with check (true);

create policy "Service role full access to notifications"
  on public.user_notifications for all using (true) with check (true);
