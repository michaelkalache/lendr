export type Category = "Projectors" | "Tools" | "Outdoors";

/** A lender. Sample lenders carry made-up stats; real members only have a name and program. */
export type Owner = {
  id: string;
  name: string;
  program?: string;
  rating?: string;
  lends?: number;
  responseMins?: number;
  /** ISO date the member joined (real members only). */
  joined?: string;
  /** Made-up lender behind the sample listings. */
  sample?: boolean;
};

export type Item = {
  id: string;
  title: string;
  category: Category;
  price: number;
  ownerId: string;
  distance: string;
  photo: string;
  alt: string;
  description: string;
  coverage: number;
  /** Meetup spot; defaults to the Student Center. */
  pickup?: string;
  /** ISO timestamp, set on listings created in the app. */
  createdAt?: string;
  /** Built-in example listing with no real person behind it: can be browsed, not borrowed. */
  sample?: boolean;
  /** For bundles: ids of the items included. */
  bundle?: string[];
  /** Set when the listing is hidden pending review (only its owner still sees it). */
  hiddenAt?: string;
};

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200`;

export const photos = {
  projector: unsplash("photo-1589113050289-1c654e7e305d"),
  tent: unsplash("photo-1504280390367-361c6d9f38f4"),
  drill: unsplash("photo-1572981779307-38b8cabb2407"),
  projectorScreen: unsplash("photo-1535016120720-40c646be5580"),
  toolSet: unsplash("photo-1645651964715-d200ce0939cc"),
  sleepingBag: unsplash("photo-1558477280-1bfed08ea5db"),
};

export const sampleOwners: Record<string, Owner> = {
  jordan: { id: "jordan", name: "Jordan Lee", program: "Film & Media ’26", rating: "4.9", lends: 18, responseMins: 20 },
  priya: { id: "priya", name: "Priya S.", program: "Business ’27", rating: "5.0", lends: 24, responseMins: 15 },
  alex: { id: "alex", name: "Alex R.", program: "Mechanical Eng ’25", rating: "4.8", lends: 11, responseMins: 30 },
  nina: { id: "nina", name: "Nina C.", program: "Architecture ’26", rating: "4.9", lends: 15, responseMins: 25 },
  sam: { id: "sam", name: "Sam T.", program: "Earth Sciences ’27", rating: "5.0", lends: 9, responseMins: 20 },
  dani: { id: "dani", name: "Dani M.", program: "Biology ’28", rating: "4.8", lends: 13, responseMins: 35 },
};

const rawSamples: Omit<Item, "sample">[] = [
  {
    id: "epson-mini-projector",
    title: "Epson Mini Projector",
    category: "Projectors",
    price: 8,
    ownerId: "jordan",
    distance: "0.4 mi",
    photo: photos.projector,
    alt: "Compact white projector on a table",
    description: "Bright, lightweight projector with HDMI cable, USB-C adapter, remote, and carrying case.",
    coverage: 280,
  },
  {
    id: "projector-and-screen",
    title: "Projector + 80″ Screen",
    category: "Projectors",
    price: 12,
    ownerId: "priya",
    distance: "0.8 mi",
    photo: photos.projectorScreen,
    alt: "Projector setup aimed at a screen",
    description: "A complete presentation setup for club meetings, screenings, and classroom demos.",
    coverage: 420,
  },
  {
    id: "cordless-drill",
    title: "20V Cordless Drill",
    category: "Tools",
    price: 5,
    ownerId: "alex",
    distance: "0.7 mi",
    photo: photos.drill,
    alt: "Cordless drill on a workbench",
    description: "Cordless drill with charger and a full set of bits for quick campus projects.",
    coverage: 160,
  },
  {
    id: "campus-tool-kit",
    title: "Campus Tool Kit",
    category: "Tools",
    price: 7,
    ownerId: "nina",
    distance: "1.2 mi",
    photo: photos.toolSet,
    alt: "Set of hand tools laid out together",
    description: "Hammer, screwdrivers, pliers, tape measure, and hex keys in one portable case.",
    coverage: 120,
  },
  {
    id: "two-person-tent",
    title: "2-Person Tent",
    category: "Outdoors",
    price: 6,
    ownerId: "sam",
    distance: "1.1 mi",
    photo: photos.tent,
    alt: "Orange tent among trees",
    description: "Easy-setup two-person tent with rain fly, stakes, and compact carrying bag.",
    coverage: 220,
  },
  {
    id: "warm-sleeping-bag",
    title: "Warm Sleeping Bag",
    category: "Outdoors",
    price: 4,
    ownerId: "dani",
    distance: "1.5 mi",
    photo: photos.sleepingBag,
    alt: "Rolled sleeping bag outdoors",
    description: "Lightweight three-season sleeping bag, cleaned after every borrow.",
    coverage: 110,
  },
  // Extra sample listings so sample lender profiles show more than one item. No photos: they use the
  // category illustration so nothing pretends to be a real item photo.
  {
    id: "sample-portable-screen",
    title: "Portable 60″ Screen",
    category: "Projectors",
    price: 4,
    ownerId: "jordan",
    distance: "0.4 mi",
    photo: "",
    alt: "Sample listing: portable projector screen",
    description: "Pop-up tripod screen that pairs with the mini projector. Folds into a shoulder bag.",
    coverage: 90,
  },
  {
    id: "sample-bluetooth-speaker",
    title: "Bluetooth Party Speaker",
    category: "Tools",
    price: 5,
    ownerId: "jordan",
    distance: "0.4 mi",
    photo: "",
    alt: "Sample listing: bluetooth speaker",
    description: "Loud enough for a club event in a classroom. Charger and aux cable included.",
    coverage: 150,
  },
  {
    id: "sample-camp-stove",
    title: "Backpacking Stove Kit",
    category: "Outdoors",
    price: 4,
    ownerId: "sam",
    distance: "1.1 mi",
    photo: "",
    alt: "Sample listing: camp stove kit",
    description: "Compact stove, pot, and windscreen. Fuel canister not included.",
    coverage: 80,
  },
  {
    id: "sample-headlamps",
    title: "Headlamp 2-Pack",
    category: "Outdoors",
    price: 2,
    ownerId: "sam",
    distance: "1.1 mi",
    photo: "",
    alt: "Sample listing: two headlamps",
    description: "Two rechargeable headlamps with red-light mode. Charged before every borrow.",
    coverage: 40,
  },
  {
    id: "sample-clicker",
    title: "Presentation Clicker",
    category: "Projectors",
    price: 2,
    ownerId: "priya",
    distance: "0.8 mi",
    photo: "",
    alt: "Sample listing: presentation clicker",
    description: "Wireless slide clicker with laser pointer. USB receiver works with Mac and Windows.",
    coverage: 35,
  },
  // Sample bundles: several items from one lender, borrowed together for less.
  {
    id: "sample-movie-night-bundle",
    title: "Movie Night Bundle",
    category: "Projectors",
    price: 14,
    ownerId: "jordan",
    distance: "0.4 mi",
    photo: "",
    alt: "Sample bundle: projector, screen, and speaker",
    description: "Everything for an outdoor screening or club movie night: the Epson mini projector, the 60″ pop-up screen, and the Bluetooth speaker, picked up together.",
    coverage: 520,
    bundle: ["epson-mini-projector", "sample-portable-screen", "sample-bluetooth-speaker"],
  },
  {
    id: "sample-weekend-camping-bundle",
    title: "Weekend Camping Bundle",
    category: "Outdoors",
    price: 10,
    ownerId: "sam",
    distance: "1.1 mi",
    photo: "",
    alt: "Sample bundle: tent, stove kit, and headlamps",
    description: "A two-night trip in one pickup: the 2-person tent, the backpacking stove kit, and two headlamps.",
    coverage: 340,
    bundle: ["two-person-tent", "sample-camp-stove", "sample-headlamps"],
  },
];

export const sampleItems: Item[] = rawSamples.map((item) => ({ ...item, sample: true }));

export const categories: { name: Category; symbol: string }[] = [
  { name: "Projectors", symbol: "▱" },
  { name: "Tools", symbol: "⌁" },
  { name: "Outdoors", symbol: "△" },
];

export const PICKUP_SPOT = "UCI Student Center";

export const pickupOf = (item: Item) => item.pickup?.trim() || PICKUP_SPOT;

const SYMBOLS: Record<Category, string> = { Projectors: "▱", Tools: "⌁", Outdoors: "△" };

/** The item's photo, or a category illustration when the lender didn't upload one. */
export function photoSrc(item: Item) {
  if (item.photo) return item.photo;
  if (item.bundle?.length) {
    const parts = item.bundle
      .map((id) => sampleItems.find((entry) => entry.id === id))
      .filter((entry): entry is Item => Boolean(entry));
    const tiles = parts
      .map((part, i) => {
        const x = 70 + i * 95;
        const rot = [-8, 3, -3][i % 3];
        return `<g transform="rotate(${rot} ${x + 45} 150)"><rect x="${x}" y="95" width="90" height="110" rx="16" fill="#fff" stroke="#c9dbe8" stroke-width="2"/><text x="${x + 45}" y="150" font-family="sans-serif" font-size="46" fill="#0064a4" text-anchor="middle" dominant-baseline="central">${SYMBOLS[part.category]}</text></g>`;
      })
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eaf3f9"/><circle cx="330" cy="40" r="70" fill="none" stroke="#ffcf55" stroke-width="22" opacity=".5"/>${tiles}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eaf3f9"/><circle cx="330" cy="40" r="70" fill="none" stroke="#ffcf55" stroke-width="22" opacity=".5"/><text x="200" y="150" font-family="sans-serif" font-size="110" fill="#0064a4" text-anchor="middle" dominant-baseline="central">${SYMBOLS[item.category]}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** Explore search: same matching rules as the prototype. */
export function searchItems(query: string, items: Item[]) {
  const normalized = query.trim().toLowerCase();
  const matchedCategory = categories.find((category) => {
    const categoryName = category.name.toLowerCase();
    return (
      (normalized && normalized.includes(categoryName.slice(0, -1))) ||
      (category.name === "Outdoors" && /(camp|tent|sleep|hike)/.test(normalized))
    );
  })?.name;
  const textMatches = items.filter((item) =>
    `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(normalized),
  );
  const results = matchedCategory
    ? items.filter((item) => item.category === matchedCategory)
    : normalized
      ? textMatches
      : items;
  return { matchedCategory, normalized, results };
}

/** Daily price, capped at 4 days' worth for each full week. */
export function rentalCost(price: number, days: number) {
  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  return weeks * price * 4 + Math.min(rest * price, price * 4);
}

/** Bundles that include this item (samples only for now). */
export function bundlesContaining(itemId: string, items: Item[]) {
  return items.filter((item) => item.bundle?.includes(itemId));
}

/** How much a bundle saves per day versus borrowing its items separately. */
export function bundleSavings(bundle: Item, items: Item[]) {
  const separate = (bundle.bundle ?? [])
    .map((id) => items.find((item) => item.id === id)?.price ?? 0)
    .reduce((sum, price) => sum + price, 0);
  return { separate, saves: Math.max(0, separate - bundle.price) };
}

/* ───────── Sample reviews (examples only, always labeled "Sample") ───────── */
export type SampleReview = { itemId: string; author: string; rating: number; body: string; date: string };

export const sampleReviews: SampleReview[] = [
  { itemId: "epson-mini-projector", author: "Maya K.", rating: 5, body: "Bright enough for a dorm lounge with the lights half on. HDMI cable and case were included like the listing said.", date: "2026-10-04" },
  { itemId: "epson-mini-projector", author: "Chris P.", rating: 5, body: "Used it for a club presentation. Easy pickup at the Student Center.", date: "2026-09-21" },
  { itemId: "epson-mini-projector", author: "Leah W.", rating: 4, body: "Works great. The remote needed new batteries, so bring a couple AAAs.", date: "2026-09-12" },
  { itemId: "two-person-tent", author: "Omar F.", rating: 5, body: "Set up in ten minutes at Crystal Cove. Stayed dry through a light drizzle.", date: "2026-10-11" },
  { itemId: "two-person-tent", author: "Grace L.", rating: 4, body: "Clean and complete. A little snug for two people with big packs.", date: "2026-09-28" },
  { itemId: "cordless-drill", author: "Ethan B.", rating: 5, body: "Battery lasted a whole afternoon of hanging shelves.", date: "2026-10-02" },
  { itemId: "projector-and-screen", author: "Sofia R.", rating: 5, body: "Perfect for our film club screening. The screen packs down small.", date: "2026-10-09" },
  { itemId: "sample-movie-night-bundle", author: "Daniel T.", rating: 5, body: "Ran an outdoor movie night with this. One pickup instead of three was the best part.", date: "2026-10-15" },
  { itemId: "sample-movie-night-bundle", author: "Ava M.", rating: 4, body: "Speaker could be louder outdoors, but everything worked together out of the box.", date: "2026-10-01" },
  { itemId: "sample-weekend-camping-bundle", author: "Noah S.", rating: 5, body: "Had everything for a night at Joshua Tree except food. Headlamps were fully charged.", date: "2026-10-18" },
];
