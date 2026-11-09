-- lendr update 3: campus drop-off spots, the handoff & return loop, 24-hour responses, reviews after return.
-- Run once in the Supabase SQL Editor after schema.sql and 002_trust_safety_reviews.sql. Safe to re-run.

-- ───────── Drop-off spots ─────────
-- Items are left at (and returned to) one of these campus spots; ids match src/spots.ts.
create or replace function public.is_spot(spot text) returns boolean
language sql immutable set search_path = '' as $$
  select spot in (
    'student-center', 'arc', 'alp',
    'langson', 'science-library', 'gateway-study',
    'dbh', 'engineering-gateway', 'humanities-gateway', 'sbsg', 'merage',
    'mesa-court', 'middle-earth', 'plaza-verde'
  );
$$;

-- listings.pickup used to be free text ("UCI Student Center"); it now holds a spot id.
alter table public.listings drop constraint if exists listings_pickup_check;
alter table public.listings drop constraint if exists listings_pickup_spot;
update public.listings set pickup = case
  when public.is_spot(pickup) then pickup
  when pickup ilike '%langson%' then 'langson'
  when pickup ilike '%science lib%' then 'science-library'
  when pickup ilike '%gateway study%' then 'gateway-study'
  when pickup ~ '\mARC\M' or pickup ilike '%recreation%' then 'arc'
  when pickup ilike '%learning pavilion%' then 'alp'
  when pickup ilike '%bren hall%' or pickup ~* '\mics\M' then 'dbh'
  when pickup ilike '%engineering%' then 'engineering-gateway'
  when pickup ilike '%humanities%' then 'humanities-gateway'
  when pickup ilike '%social%' then 'sbsg'
  when pickup ilike '%merage%' or pickup ilike '%business%' then 'merage'
  when pickup ilike '%mesa%' or pickup ilike '%anteatery%' then 'mesa-court'
  when pickup ~* '\mssp?s\M' then 'sbsg'
  when pickup ilike '%middle earth%' then 'middle-earth'
  when pickup ilike '%plaza verde%' then 'plaza-verde'
  else 'student-center'
end
where not public.is_spot(pickup);
alter table public.listings alter column pickup set default 'student-center';
alter table public.listings add constraint listings_pickup_spot check (public.is_spot(pickup));

-- ───────── Requests: where the item is left, and each handoff step ─────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'requests' and column_name = 'pickup_spot'
  ) then
    alter table public.requests
      add column pickup_spot text not null default 'student-center',
      add column return_spot text not null default 'student-center',
      add column pickup_note text not null default '',
      add column return_note text not null default '',
      add column dropped_off_at timestamptz,
      add column picked_up_at timestamptz,
      add column returned_at timestamptz,
      add column received_at timestamptz;
    -- Existing requests use their listing's spot (runs once, before the new update guard is installed).
    update public.requests r set pickup_spot = l.pickup, return_spot = l.pickup
    from public.listings l where l.id = r.listing_id;
    -- New requests get their spots from the borrower, or from the listing (set in prepare_request).
    alter table public.requests alter column pickup_spot drop default;
    alter table public.requests alter column return_spot drop default;
  end if;
end;
$$;

alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests add constraint requests_status_check
  check (status in ('pending', 'approved', 'declined', 'cancelled', 'completed'));
alter table public.requests drop constraint if exists requests_spots_check;
alter table public.requests add constraint requests_spots_check
  check (public.is_spot(pickup_spot) and public.is_spot(return_spot));
alter table public.requests drop constraint if exists requests_notes_check;
alter table public.requests add constraint requests_notes_check
  check (char_length(pickup_note) <= 200 and char_length(return_note) <= 200);

create or replace function public.prepare_request() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  listing record;
  weeks int;
begin
  select owner_id, price, hidden_at, pickup into listing from public.listings where id = new.listing_id;
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
  new.pickup_spot := coalesce(new.pickup_spot, listing.pickup);
  new.return_spot := coalesce(new.return_spot, new.pickup_spot);
  new.pickup_note := '';
  new.return_note := '';
  new.dropped_off_at := null;
  new.picked_up_at := null;
  new.returned_at := null;
  new.received_at := null;
  return new;
end;
$$;

-- The borrow loop, enforced here so nobody can skip a step:
--   pending  → approved / declined  (lender, within 24 hours)   or cancelled (borrower)
--   approved → lender drops the item off at the pickup spot
--            → borrower picks it up
--            → borrower returns it to the return spot
--            → lender confirms it's back  ⇒ completed
--   approved → cancelled by either side until the item is picked up
create or replace function public.guard_request_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  is_owner boolean := public.owns_listing(old.listing_id);
  is_borrower boolean := old.borrower_id = auth.uid();
  step text;
  steps int := 0;
begin
  if (new.listing_id, new.borrower_id, new.start_date, new.end_date, new.days, new.total, new.created_at)
     is distinct from (old.listing_id, old.borrower_id, old.start_date, old.end_date, old.days, old.total, old.created_at) then
    raise exception 'Only the request status and handoff can change';
  end if;

  if new.dropped_off_at is distinct from old.dropped_off_at then step := 'dropped_off'; steps := steps + 1; end if;
  if new.picked_up_at is distinct from old.picked_up_at then step := 'picked_up'; steps := steps + 1; end if;
  if new.returned_at is distinct from old.returned_at then step := 'returned'; steps := steps + 1; end if;
  if new.received_at is distinct from old.received_at then step := 'received'; steps := steps + 1; end if;
  if steps > 1 then
    raise exception 'One handoff step at a time';
  end if;

  if (new.pickup_spot, new.pickup_note) is distinct from (old.pickup_spot, old.pickup_note)
     and coalesce(step, '') <> 'dropped_off' then
    raise exception 'The pickup spot is set when the lender drops the item off';
  end if;
  if (new.return_spot, new.return_note) is distinct from (old.return_spot, old.return_note)
     and coalesce(step, '') <> 'returned' then
    raise exception 'The return spot is set when the borrower returns the item';
  end if;

  -- Handoff steps
  if step is not null then
    if old.status <> 'approved' then
      raise exception 'This borrow isn''t active';
    end if;
    if step = 'dropped_off' then
      if not is_owner then raise exception 'Only the lender can mark the item as dropped off'; end if;
      if old.dropped_off_at is not null then raise exception 'You already marked this item as dropped off'; end if;
      new.dropped_off_at := now();
    elsif step = 'picked_up' then
      if not is_borrower then raise exception 'Only the borrower can mark the item as picked up'; end if;
      if old.dropped_off_at is null then raise exception 'The lender hasn''t dropped the item off yet'; end if;
      if old.picked_up_at is not null then raise exception 'You already marked this item as picked up'; end if;
      new.picked_up_at := now();
    elsif step = 'returned' then
      if not is_borrower then raise exception 'Only the borrower can mark the item as returned'; end if;
      if old.picked_up_at is null then raise exception 'Mark the item as picked up first'; end if;
      if old.returned_at is not null then raise exception 'You already marked this item as returned'; end if;
      new.returned_at := now();
    else
      if not is_owner then raise exception 'Only the lender can confirm the item is back'; end if;
      if old.returned_at is null then raise exception 'The borrower hasn''t returned the item yet'; end if;
      if old.received_at is not null then raise exception 'You already confirmed this return'; end if;
      new.received_at := now();
      new.status := 'completed';
    end if;
    if step <> 'received' and new.status is distinct from old.status then
      raise exception 'Change one thing at a time';
    end if;
    new.updated_at := now();
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  -- Status changes
  if old.status = 'pending' then
    if new.status = 'cancelled' and is_borrower then
      null;
    elsif new.status in ('approved', 'declined') and is_owner then
      if old.created_at < now() - interval '24 hours' then
        raise exception 'This request expired after 24 hours without a response';
      end if;
    else
      raise exception 'You can''t make that change to this request';
    end if;
  elsif old.status = 'approved' and new.status = 'cancelled' and (is_owner or is_borrower) then
    if old.picked_up_at is not null then
      raise exception 'This item was already picked up. Return it to finish the borrow';
    end if;
  elsif old.status in ('declined', 'cancelled', 'completed') then
    raise exception 'This request is already closed';
  else
    raise exception 'You can''t make that change to this request';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ───────── Reviews open once the lender confirms the item is back ─────────
create or replace function public.prepare_review() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  select * into r from public.requests where id = new.request_id;
  if not found or r.borrower_id <> auth.uid() then
    raise exception 'You can only review items you borrowed';
  end if;
  if r.status <> 'completed' then
    raise exception 'You can review this item once it''s returned and the lender confirms it''s back';
  end if;
  new.listing_id := r.listing_id;
  new.reviewer_id := auth.uid();
  new.created_at := now();
  return new;
end;
$$;

revoke all on function public.prepare_request() from public, anon, authenticated;
revoke all on function public.guard_request_update() from public, anon, authenticated;
revoke all on function public.prepare_review() from public, anon, authenticated;
