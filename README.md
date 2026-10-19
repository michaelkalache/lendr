# lendr

Borrow projectors, tools, and outdoor gear from verified UCI students near campus.

This is the web version of the **Prototype — Core Mechanical Loop** built in Figma Make, rebuilt as a responsive website:
a desktop layout with a top navigation bar, and a mobile layout with the original bottom tab bar.

## The core loop

1. **Discover** (`/`) — browse listings or pick a category
2. **Explore** (`/explore?q=…`) — search and filter
3. **Item** (`/items/:id`) — details, lender, pickup spot, damage policy
4. **Request** (`/items/:id/request`) — pick dates on a live calendar, see the total
5. **Sent** (`/requests/:id`) — confirmation and status timeline
6. **Activity** (`/activity`) — track, cancel, or follow up; requests expire after 2 hours without a reply
7. **Messages** (`/messages/:lender`) — chat with the lender, quick replies
8. **Account** (`/account`) — trust profile, saved items, demo reset

Requests, messages, and saved items are stored in the browser (`localStorage`), so the demo remembers what you did.
There is no backend yet — every visitor sees their own copy of the demo data.

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
