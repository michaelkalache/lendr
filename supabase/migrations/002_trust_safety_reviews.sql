-- lendr update 2: trust & safety (reports, auto-hide), item reviews, password recovery codes.
-- Run once in the Supabase SQL Editor on a project that already has schema.sql (update 1).

create extension if not exists pgcrypto with schema extensions;

-- ───────── Listings: moderation ─────────
-- A listing with reports from 3 different people is hidden from everyone but its owner until reviewed.
alter table public.listings add column if not exists hidden_at timestamptz;

drop policy if exists "Signed-in users can browse listings" on public.listings;
drop policy if exists "Signed-in users can browse visible listings" on public.listings;
create policy "Signed-in users can browse visible listings" on public.listings
  for select to authenticated using (hidden_at is null or owner_id = (select auth.uid()));

-- Owners can't unhide their own listing or change who owns it.
create or replace function public.guard_listing_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.hidden_at := null;
    else
      new.hidden_at := old.hidden_at;
      new.owner_id := old.owner_id;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_guard on public.listings;
create trigger listings_guard
  before insert or update on public.listings
  for each row execute function public.guard_listing_write();

-- Hidden listings can't receive new requests or new conversations.
create or replace function public.prepare_request() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  listing record;
  weeks int;
begin
  select owner_id, price, hidden_at into listing from public.listings where id = new.listing_id;
  if not found then
    raise exception 'That listing no longer exists';
  end if;
  if listing.hidden_at is not null then
    raise exception 'This listing is under review and can''t be requested right now';
  end if;
  if listing.owner_id = auth.uid() then
    raise exception 'You can''t request your own item';
  end if;
  if new.start_date < current_date - 1 then
    raise exception 'Pick a start date that isn''t in the past';
  end if;
  new.borrower_id := auth.uid();
  new.status := 'pending';
  new.created_at := now();
  new.updated_at := now();
  new.days := new.end_date - new.start_date + 1;
  weeks := new.days / 7;
  new.total := weeks * listing.price * 4 + least((new.days % 7) * listing.price, listing.price * 4);
  return new;
end;
$$;

create or replace function public.prepare_conversation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  hidden timestamptz;
begin
  select owner_id, hidden_at into new.owner_id, hidden from public.listings where id = new.listing_id;
  if new.owner_id is null then
    raise exception 'That listing no longer exists';
  end if;
  if hidden is not null then
    raise exception 'This listing is under review and can''t be messaged about right now';
  end if;
  new.borrower_id := auth.uid();
  if new.owner_id = new.borrower_id then
    raise exception 'You can''t message yourself about your own item';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ───────── Reports ─────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('prohibited', 'unsafe', 'scam', 'harassment', 'fake_account', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  check ((listing_id is null) <> (user_id is null))
);

create unique index if not exists reports_once_per_listing on public.reports (reporter_id, listing_id) where listing_id is not null;
create unique index if not exists reports_once_per_user on public.reports (reporter_id, user_id) where user_id is not null;

alter table public.reports enable row level security;

drop policy if exists "Users see their own reports" on public.reports;
create policy "Users see their own reports" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()));

drop policy if exists "Users can file reports" on public.reports;
create policy "Users can file reports" on public.reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));

create or replace function public.prepare_report() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.reporter_id := auth.uid();
  new.status := 'open';
  new.created_at := now();
  if new.user_id = auth.uid() then
    raise exception 'You can''t report yourself';
  end if;
  if new.listing_id is not null and exists (
    select 1 from public.listings where id = new.listing_id and owner_id = auth.uid()
  ) then
    raise exception 'You can''t report your own listing';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_before_insert on public.reports;
create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.prepare_report();

create or replace function public.auto_hide_reported_listing() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.listing_id is not null and (
    select count(distinct reporter_id) from public.reports
    where listing_id = new.listing_id and status <> 'dismissed'
  ) >= 3 then
    update public.listings set hidden_at = now() where id = new.listing_id and hidden_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_after_insert on public.reports;
create trigger reports_after_insert
  after insert on public.reports
  for each row execute function public.auto_hide_reported_listing();

grant select, insert on public.reports to authenticated;

-- ───────── Item reviews ─────────
-- Only someone whose borrow was approved (and has started) can review that item, once per borrow.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  reviewer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists reviews_listing_idx on public.reviews (listing_id);

alter table public.reviews enable row level security;

drop policy if exists "Signed-in users can read reviews" on public.reviews;
create policy "Signed-in users can read reviews" on public.reviews
  for select to authenticated using (true);

drop policy if exists "Borrowers can review items they borrowed" on public.reviews;
create policy "Borrowers can review items they borrowed" on public.reviews
  for insert to authenticated with check (reviewer_id = (select auth.uid()));

drop policy if exists "Reviewers can delete their reviews" on public.reviews;
create policy "Reviewers can delete their reviews" on public.reviews
  for delete to authenticated using (reviewer_id = (select auth.uid()));

create or replace function public.prepare_review() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  select * into r from public.requests where id = new.request_id;
  if not found or r.borrower_id <> auth.uid() then
    raise exception 'You can only review items you borrowed';
  end if;
  if r.status <> 'approved' then
    raise exception 'You can review an item once the lender approves your borrow';
  end if;
  if r.start_date > current_date then
    raise exception 'You can review this item once your borrow starts';
  end if;
  new.listing_id := r.listing_id;
  new.reviewer_id := auth.uid();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists reviews_before_insert on public.reviews;
create trigger reviews_before_insert
  before insert on public.reviews
  for each row execute function public.prepare_review();

grant select, insert, delete on public.reviews to authenticated;

-- ───────── Password recovery codes ─────────
-- Free Supabase email only reaches project members, so password resets use a one-time recovery code
-- shown at sign-up. Codes are stored hashed and these tables have no API access at all.
create table if not exists public.recovery_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.recovery_codes enable row level security;
revoke all on public.recovery_codes from anon, authenticated;

create table if not exists public.recovery_attempts (
  email text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists recovery_attempts_email_idx on public.recovery_attempts (email, attempted_at);
alter table public.recovery_attempts enable row level security;
revoke all on public.recovery_attempts from anon, authenticated;

-- Make (or replace) the signed-in user's recovery code. Returns it once, formatted XXXX-XXXX-XXXX-XXXX.
create or replace function public.create_recovery_code() returns text
language plpgsql security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(16);
  raw text := '';
  i int;
begin
  if auth.uid() is null then
    raise exception 'Log in first';
  end if;
  for i in 0..15 loop
    raw := raw || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  insert into public.recovery_codes (user_id, code_hash)
  values (auth.uid(), extensions.crypt(raw, extensions.gen_salt('bf', 8)))
  on conflict (user_id) do update set code_hash = excluded.code_hash, created_at = now();
  return substr(raw, 1, 4) || '-' || substr(raw, 5, 4) || '-' || substr(raw, 9, 4) || '-' || substr(raw, 13, 4);
end;
$$;

create or replace function public.has_recovery_code() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.recovery_codes where user_id = (select auth.uid()));
$$;

-- Set a new password with email + recovery code. The code works once. 10 tries per email per hour.
create or replace function public.reset_password_with_code(p_email text, p_code text, p_new_password text)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_user uuid;
  v_hash text;
begin
  if char_length(coalesce(p_new_password, '')) < 8 then
    raise exception 'Use a password with at least 8 characters';
  end if;
  delete from public.recovery_attempts where attempted_at < now() - interval '1 day';
  if (select count(*) from public.recovery_attempts
      where email = v_email and attempted_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many reset attempts for this email. Try again in an hour';
  end if;
  insert into public.recovery_attempts (email) values (v_email);

  select u.id, r.code_hash into v_user, v_hash
  from auth.users u join public.recovery_codes r on r.user_id = u.id
  where lower(u.email) = v_email;

  if v_user is null or extensions.crypt(v_code, v_hash) <> v_hash then
    return false;
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)), updated_at = now()
  where id = v_user;
  delete from public.recovery_codes where user_id = v_user;
  return true;
end;
$$;

revoke all on function public.create_recovery_code() from public, anon;
revoke all on function public.has_recovery_code() from public, anon;
revoke all on function public.reset_password_with_code(text, text, text) from public;
grant execute on function public.create_recovery_code() to authenticated;
grant execute on function public.has_recovery_code() to authenticated;
grant execute on function public.reset_password_with_code(text, text, text) to anon, authenticated;

-- Internal helpers are not part of the API.
revoke all on function public.auto_hide_reported_listing() from public, anon, authenticated;
revoke all on function public.prepare_report() from public, anon, authenticated;
revoke all on function public.prepare_review() from public, anon, authenticated;
