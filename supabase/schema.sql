-- lendr database schema for Supabase.
-- Paste into the Supabase SQL Editor and run once on a new project.
-- Every table has Row Level Security: signed-in users can only read and change what they should.

-- ───────── Profiles ─────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 60),
  program text not null default '' check (char_length(program) <= 60),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Signed-in users can see profiles" on public.profiles
  for select to authenticated using (true);

create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Only @uci.edu addresses may sign up; each new account gets a profile.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if lower(new.email) not like '%@uci.edu' then
    raise exception 'Only @uci.edu email addresses can sign up for lendr';
  end if;
  insert into public.profiles (id, name, program)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    left(coalesce(new.raw_user_meta_data ->> 'program', ''), 60)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── Listings ─────────
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 60),
  category text not null check (category in ('Projectors', 'Tools', 'Outdoors')),
  price int not null check (price between 1 and 100),
  coverage int not null check (coverage between 10 and 5000),
  description text not null check (char_length(trim(description)) between 15 and 400),
  pickup text not null default 'UCI Student Center' check (char_length(trim(pickup)) between 2 and 60),
  photo_url text,
  created_at timestamptz not null default now()
);

create index listings_owner_idx on public.listings (owner_id);

alter table public.listings enable row level security;

create policy "Signed-in users can browse listings" on public.listings
  for select to authenticated using (true);

create policy "Users can create their own listings" on public.listings
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy "Owners can edit their listings" on public.listings
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "Owners can remove their listings" on public.listings
  for delete to authenticated using (owner_id = (select auth.uid()));

-- ───────── Borrow requests ─────────
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  borrower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days int not null default 0,
  total int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date and end_date - start_date < 14)
);

create index requests_listing_idx on public.requests (listing_id);
create index requests_borrower_idx on public.requests (borrower_id);

alter table public.requests enable row level security;

create function public.owns_listing(listing uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.listings l where l.id = listing and l.owner_id = (select auth.uid()));
$$;

create policy "Borrowers and lenders can see their requests" on public.requests
  for select to authenticated using (borrower_id = (select auth.uid()) or public.owns_listing(listing_id));

create policy "Users can request items" on public.requests
  for insert to authenticated with check (borrower_id = (select auth.uid()));

create policy "Borrowers and lenders can update their requests" on public.requests
  for update to authenticated using (borrower_id = (select auth.uid()) or public.owns_listing(listing_id));

-- New requests: price is computed here (never trusted from the browser), and you can't borrow your own item.
create function public.prepare_request() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  listing record;
  weeks int;
begin
  select owner_id, price into listing from public.listings where id = new.listing_id;
  if not found then
    raise exception 'That listing no longer exists';
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

create trigger requests_before_insert
  before insert on public.requests
  for each row execute function public.prepare_request();

-- Status changes: borrowers can cancel, lenders can approve or decline (within 2 hours). Nothing else changes.
create function public.guard_request_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  is_owner boolean := public.owns_listing(old.listing_id);
begin
  if (new.listing_id, new.borrower_id, new.start_date, new.end_date, new.days, new.total, new.created_at)
     is distinct from (old.listing_id, old.borrower_id, old.start_date, old.end_date, old.days, old.total, old.created_at) then
    raise exception 'Only the request status can change';
  end if;
  if new.status = old.status then
    return new;
  end if;
  if old.status <> 'pending' then
    raise exception 'This request is already closed';
  end if;
  if new.status = 'cancelled' and old.borrower_id = auth.uid() then
    null;
  elsif new.status in ('approved', 'declined') and is_owner then
    if old.created_at < now() - interval '2 hours' then
      raise exception 'This request expired after 2 hours without a response';
    end if;
  else
    raise exception 'You can''t make that change to this request';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger requests_before_update
  before update on public.requests
  for each row execute function public.guard_request_update();

-- ───────── Conversations & messages ─────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  borrower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now(),
  unique (listing_id, borrower_id)
);

alter table public.conversations enable row level security;

create policy "Participants can see their conversations" on public.conversations
  for select to authenticated using ((select auth.uid()) in (borrower_id, owner_id));

create policy "Borrowers can start conversations" on public.conversations
  for insert to authenticated with check (borrower_id = (select auth.uid()));

create function public.prepare_conversation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select owner_id into new.owner_id from public.listings where id = new.listing_id;
  if new.owner_id is null then
    raise exception 'That listing no longer exists';
  end if;
  new.borrower_id := auth.uid();
  if new.owner_id = new.borrower_id then
    raise exception 'You can''t message yourself about your own item';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger conversations_before_insert
  before insert on public.conversations
  for each row execute function public.prepare_conversation();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  kind text not null default 'text' check (kind in ('text', 'system')),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create function public.in_conversation(conversation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conversation and (select auth.uid()) in (c.borrower_id, c.owner_id)
  );
$$;

create policy "Participants can read messages" on public.messages
  for select to authenticated using (public.in_conversation(conversation_id));

create policy "Participants can send messages" on public.messages
  for insert to authenticated with check (sender_id = (select auth.uid()) and public.in_conversation(conversation_id));

create function public.touch_conversation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations set updated_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ───────── Saved items ─────────
create table public.favorites (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  listing_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Users manage their own saved items" on public.favorites
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ───────── API access ─────────
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.listings to authenticated;
grant select, insert, update on public.requests to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, delete on public.favorites to authenticated;

-- ───────── Photo storage ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Users upload photos to their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete photos in their own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ───────── Live updates ─────────
alter publication supabase_realtime add table public.listings, public.requests, public.conversations, public.messages;
