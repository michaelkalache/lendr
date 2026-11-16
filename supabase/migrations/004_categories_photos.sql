-- lendr update 4: more categories, and every listing needs a photo.
-- Run once in the Supabase SQL Editor after 003_dropoff_returns.sql. Safe to re-run.

-- ───────── Categories (names match src/categories.ts) ─────────
alter table public.listings drop constraint if exists listings_category_check;
alter table public.listings add constraint listings_category_check check (category in (
  'Projectors', 'Cameras', 'Audio', 'Electronics', 'Gaming', 'Tools', 'Outdoors', 'Sports',
  'Bikes & Scooters', 'Music', 'Kitchen', 'Party & Events', 'Dorm & Home', 'Study', 'Costumes', 'Other'
));

-- ───────── Photos are required ─────────
-- NOT VALID: older listings without a photo stay up, but any new listing, and any edit, must include one.
alter table public.listings drop constraint if exists listings_photo_required;
alter table public.listings add constraint listings_photo_required
  check (photo_url is not null and char_length(trim(photo_url)) > 0) not valid;
