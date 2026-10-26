# lendr

Borrow projectors, tools, and outdoor gear from verified UCI students near campus.

This is the web version of the **Prototype — Core Mechanical Loop** built in Figma Make, rebuilt as a responsive website:
a desktop layout with a top navigation bar, and a mobile layout with the original bottom tab bar.

## The core loop

0. **Welcome** (`/welcome`) — create an account or log in (required)
1. **Discover** (`/`) — browse listings or pick a category
2. **Explore** (`/explore?q=…`) — search and filter
3. **Item** (`/items/:id`) — details, lender, pickup spot, damage policy
4. **Request** (`/items/:id/request`) — pick dates on a live calendar, see the total
5. **Sent** (`/requests/:id`) — confirmation and status timeline
6. **Activity** (`/activity`) — track, cancel, or follow up; requests expire after 2 hours without a reply
7. **Messages** (`/messages/:lender`) — chat with the lender, quick replies
8. **Account** (`/account`) — your listings, saved items, profile, log out
9. **List an item** (`/list`) — photo upload, category, price, replacement value, pickup spot;
   edit or remove it later from the item page (`/items/:id/edit`)

### Accounts and shared data

Everyone must create an account (with an **@uci.edu** email) before using the site. Accounts, listings,
photos, requests, messages, and saved items live in a shared [Supabase](https://supabase.com) database,
so every teammate sees the same data on any device, and updates arrive live.

- **Security:** every table uses Row Level Security (`supabase/schema.sql`). People can only edit their own
  listings, only see requests and messages they're part of, and prices are computed by the database.
- **Requests** expire 2 hours after they're sent if the lender doesn't respond.
- **Sample listings** (marked *Sample*) show how the site works; they can't be requested.
- **No email confirmation:** Supabase's free email sender only reaches project members, so sign-up is instant.
  The @uci.edu rule is enforced, but owning the address isn't verified. Password reset isn't available yet.

### Setting up a new Supabase project

1. Create a free project at supabase.com.
2. In **SQL Editor**, run `supabase/schema.sql`.
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
  store.tsx       app state (requests, messages, favorites) persisted to localStorage
  dates.ts        date helpers
  components.tsx  header, bottom nav, item cards, hero art
  pages/          one file per route
  styles.css      all styles (UCI navy/gold palette from the prototype)
```
