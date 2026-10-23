-- ==============================================================================
-- gua.my.id - Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable pgcrypto (for UUID generation)
create extension if not exists "pgcrypto";

-- 2. Links Table
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  original_url text not null,
  short_code text not null unique,
  custom_alias text unique,
  title text,
  is_active boolean default true not null,
  clicks_count bigint default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for lightning-fast lookups during redirects
create index if not exists idx_links_short_code on public.links(short_code);
create index if not exists idx_links_user_id on public.links(user_id);
create index if not exists idx_links_created_at on public.links(created_at desc);

-- 3. Clicks Table (Detailed Tracking & Analytics)
create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ip text,
  country text default 'Unknown',
  city text default 'Unknown',
  referrer text default 'Direct',
  device text default 'desktop',
  browser text default 'Unknown',
  os text default 'Unknown',
  user_agent text
);

-- Indexes for analytics aggregation queries
create index if not exists idx_clicks_link_id on public.clicks(link_id);
create index if not exists idx_clicks_created_at on public.clicks(created_at desc);
create index if not exists idx_clicks_country on public.clicks(country);
create index if not exists idx_clicks_device on public.clicks(device);
create index if not exists idx_clicks_referrer on public.clicks(referrer);

-- 4. Atomic Click Counter Function
create or replace function public.record_click(
  p_link_id uuid,
  p_ip text,
  p_country text,
  p_city text,
  p_referrer text,
  p_device text,
  p_browser text,
  p_os text,
  p_user_agent text
)
returns void
language plpgsql
security definer
as $$
begin
  -- Insert click record
  insert into public.clicks (
    link_id, ip, country, city, referrer, device, browser, os, user_agent
  ) values (
    p_link_id, p_ip, p_country, p_city, p_referrer, p_device, p_browser, p_os, p_user_agent
  );

  -- Atomically increment link total clicks counter
  update public.links
  set clicks_count = clicks_count + 1,
      updated_at = timezone('utc'::text, now())
  where id = p_link_id;
end;
$$;

-- 5. Row Level Security (RLS) Policies
alter table public.links enable row level security;
alter table public.clicks enable row level security;

-- LINKS POLICIES:
-- Only authenticated users can create links (associated with their user_id)
drop policy if exists "Anyone can create links" on public.links;
drop policy if exists "Users can insert their own links" on public.links;
create policy "Users can insert their own links"
  on public.links for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Authenticated users can ONLY view their own links
drop policy if exists "Public links are viewable for redirect" on public.links;
drop policy if exists "Users can view their own links" on public.links;
create policy "Users can view their own links"
  on public.links for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can update their own links
drop policy if exists "Users can update their own links" on public.links;
create policy "Users can update their own links"
  on public.links for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Authenticated users can delete their own links
drop policy if exists "Users can delete their own links" on public.links;
create policy "Users can delete their own links"
  on public.links for delete
  to authenticated
  using (auth.uid() = user_id);

-- CLICKS POLICIES:
-- Allow insert from anon/service (used by redirect route)
drop policy if exists "Allow public click recording" on public.clicks;
create policy "Allow public click recording"
  on public.clicks for insert
  with check (true);

-- Users can view clicks for links they own
drop policy if exists "Users can view clicks of their links" on public.clicks;
create policy "Users can view clicks of their links"
  on public.clicks for select
  to authenticated
  using (
    exists (
      select 1 from public.links
      where public.links.id = public.clicks.link_id
      and public.links.user_id = auth.uid()
    )
  );

-- Function to handle updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger on_links_updated
  before update on public.links
  for each row execute function public.handle_updated_at();
