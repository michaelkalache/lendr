# lendr

Borrow projectors, tools, and outdoor gear from verified UCI students near campus.

This is the web version of the **Prototype — Core Mechanical Loop** built in Figma Make, rebuilt as a responsive website:
a desktop layout with a top navigation bar, and a mobile layout with the original bottom tab bar.

## The core loop

0. **Welcome** (`/welcome`) — create an account or log in (required)
1. **Discover** (`/`) — browse listings or pick a category
2. **Explore** (`/explore?q=…`) — search and filter
3. **Item** (`/items/:id`) — details, lender, usual drop-off spot on the UCI map, damage policy
4. **Request** (`/items/:id/request`) — pick dates on a live calendar and the pickup/return spots, see the total
5. **Sent** (`/requests/:id`) — confirmation and status timeline
6. **Activity** (`/activity`) — respond to requests (24 hours), then run the drop-off → pickup → return → confirm loop
7. **Messages** (`/messages/:lender`) — chat with the lender, quick replies
8. **Account** (`/account`) — your listings, saved items, profile, log out
9. **Profiles** (`/people/:id`) — any lender's public profile and their active listings (tap a name)
10. **Trust & safety** (`/safety`) — the guardrails below, plus how to report a problem
11. **List an item** (`/list`) — photo upload, category, price, replacement value, drop-off spot;
   edit or remove it later from the item page (`/items/:id/edit`)
12. **Help** (`/help`) — how to borrow and lend, the drop-off spots, and FAQs (also visible before signing up)

### Accounts and shared data

Everyone must create an account (with an **@uci.edu** email) before using the site. Accounts, listings,
photos, requests, messages, and saved items live in a shared [Supabase](https://supabase.com) database,
so every teammate sees the same data on any device, and updates arrive live.

- **Security:** every table uses Row Level Security (`supabase/schema.sql`). People can only edit their own
  listings, only see requests and messages they're part of, and prices are computed by the database.
- **Requests** expire 24 hours after they're sent if the lender doesn't respond.
- **Drop-offs, not meetups:** items change hands at fixed campus spots (Student Center, libraries, the ARC, housing
  community centers…, listed in `src/spots.ts` and checked by the database). Each spot links to its marker on the
  official UCI map (map.uci.edu), which is also embedded in the page.
- **Return loop:** after approval, the lender marks *dropped off* (spot + note) → the borrower marks *picked up* →
  the borrower marks *returned* (spot + note) → the lender confirms *got it back*, which completes the borrow. The
  database enforces the order and who can mark each step, and records the time of each. Either side can cancel until
  pickup; Activity flags borrows that are past their return day as overdue.
- **Item reviews:** only a borrower whose item came back (the lender confirmed the return) can review that item, once per borrow.
  Cards show each item's own rating; a lender's rating is the average of reviews across their items.
- **Reports:** any listing or account can be reported (private, one report per person per target). A listing reported
  by 3 different students is hidden automatically until someone on the team reviews it. Review reports in the
  Supabase **Table Editor → reports**; to restore a listing, clear its `hidden_at` in **listings**.
- **Password reset:** Supabase's free email can't reach students, so every account gets a one-time **recovery code**
  (shown at sign-up, stored hashed). *Forgot password?* on the log-in page takes email + code; reset attempts are
  limited to 10 per email per hour. Signed-in users can change their password and make a new code in Account → Security.
  If someone loses both, delete their user in **Authentication → Users** so they can sign up again.
- **Sample listings, bundles, reviews, and lenders** (marked *Sample* everywhere) show how the site works; they can't be
  requested or messaged, and their ratings and reviews are examples.
- **No email confirmation:** Supabase's free email sender only reaches project members, so sign-up is instant.
  The @uci.edu rule is enforced, but owning the address isn't verified.

### Setting up a new Supabase project

1. Create a free project at supabase.com.
2. In **SQL Editor**, run `supabase/schema.sql`, then each file in `supabase/migrations/` in order.
3. In **Authentication → Sign In / Providers → Email**, turn off **Confirm email**.
4. Copy the **Project URL** and **publishable key** (Settings → API Keys) into `src/supabase.ts`
   (or set `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel). The publishable key is safe to
   commit; access is controlled by the security rules.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploy

The site is a static Vite + React app. `vercel.json` rewrites every path to `index.html` so deep links like
`/items/epson-mini-projector` work on refresh. Import the repo at vercel.com/new — the defaults
(Framework: Vite, Build: `npm run build`, Output: `dist`) are correct.

## Project layout

```
src/
  data.ts         listings, lenders, search + pricing rules
  store.tsx       app state loaded from Supabase, plus all actions (requests, handoff steps, messages…)
  spots.ts        campus drop-off spots and their UCI map ids
  handoff.tsx     spot picker, UCI map embed, and the drop-off/return timeline
  dates.ts        date helpers
  components.tsx  header, bottom nav, item cards, hero art
  pages/          one file per route
  styles.css      all styles (UCI navy/gold palette from the prototype)
```
