/**
 * Item categories. Names must match the `listings_category_check` constraint in
 * supabase/migrations/004_categories_photos.sql.
 * Icons are 24×24 line drawings (stroke-based, like Icon.tsx); some are adapted from Lucide (ISC license).
 */
export const CATEGORY_NAMES = [
  "Projectors",
  "Cameras",
  "Audio",
  "Electronics",
  "Gaming",
  "Tools",
  "Outdoors",
  "Sports",
  "Bikes & Scooters",
  "Music",
  "Kitchen",
  "Party & Events",
  "Dorm & Home",
  "Study",
  "Costumes",
  "Other",
] as const;

export type Category = (typeof CATEGORY_NAMES)[number];

type CategoryInfo = {
  name: Category;
  /** Inner SVG markup for a 24×24 stroke icon. */
  icon: string;
  /** Search words that jump straight to this category. */
  keywords: string[];
};

export const categories: CategoryInfo[] = [
  {
    name: "Projectors",
    icon: '<rect x="2" y="7" width="20" height="11" rx="3"/><circle cx="15" cy="12.5" r="3"/><path d="M6 11h3M6 14h2"/>',
    keywords: ["projector", "screen", "movie"],
  },
  {
    name: "Cameras",
    icon: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
    keywords: ["camera", "lens", "tripod", "gopro", "photo"],
  },
  {
    name: "Audio",
    icon: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><circle cx="12" cy="14.5" r="3.5"/><path d="M12 7h.01"/>',
    keywords: ["speaker", "mic", "microphone", "headphone", "audio"],
  },
  {
    name: "Electronics",
    icon: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19.5h20"/>',
    keywords: ["laptop", "charger", "monitor", "ipad", "tablet", "electronic", "cable"],
  },
  {
    name: "Gaming",
    icon: '<path d="M6.5 8h11a4 4 0 0 1 3.9 4.8l-.9 4.4a2.4 2.4 0 0 1-4.2 1L15 16H9l-1.3 2.2a2.4 2.4 0 0 1-4.2-1l-.9-4.4A4 4 0 0 1 6.5 8Z"/><path d="M8 10.5v3.5M6.25 12.25h3.5M15.5 11.5h.01M17.5 13.5h.01"/>',
    keywords: ["game", "gaming", "switch", "playstation", "xbox", "controller", "vr"],
  },
  {
    name: "Tools",
    icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z"/>',
    keywords: ["tool", "drill", "hammer", "saw", "wrench"],
  },
  {
    name: "Outdoors",
    icon: '<path d="M2 20h20M12 4 3.5 20M12 4l8.5 16M12 12.5 9 20M12 12.5l3 7.5"/>',
    keywords: ["camp", "tent", "sleep", "hike", "hiking", "outdoor", "beach", "cooler"],
  },
  {
    name: "Sports",
    icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6a9 9 0 0 1 0 12.8M18.4 5.6a9 9 0 0 0 0 12.8"/>',
    keywords: ["sport", "ball", "racket", "surf", "skate", "gym", "fitness", "yoga"],
  },
  {
    name: "Bikes & Scooters",
    icon: '<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5 9.5 9h6l3 7.5M9.5 9l3 7.5h-7M15.5 9l-1-3H12"/>',
    keywords: ["bike", "bicycle", "scooter", "helmet", "lock"],
  },
  {
    name: "Music",
    icon: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    keywords: ["guitar", "keyboard", "piano", "ukulele", "instrument", "music", "amp"],
  },
  {
    name: "Kitchen",
    icon: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6Z"/><path d="M2 10h20M9 7c0-1 1-1.5 1-2.5M14 7c0-1 1-1.5 1-2.5"/>',
    keywords: ["kitchen", "blender", "air fryer", "rice cooker", "pan", "pot", "cook", "baking"],
  },
  {
    name: "Party & Events",
    icon: '<path d="M12 3a6 6 0 0 1 6 6c0 4-3.4 7-6 7s-6-3-6-7a6 6 0 0 1 6-6Z"/><path d="M11 18h2l-1-2-1 2ZM12 18c0 2-2 2-2 4"/>',
    keywords: ["party", "event", "lights", "decor", "table", "karaoke", "fog"],
  },
  {
    name: "Dorm & Home",
    icon: '<path d="M3 6.5V19M21 19v-6a3 3 0 0 0-3-3h-7v4M3 14h18"/><circle cx="7" cy="11.5" r="1.5"/>',
    keywords: ["dorm", "fan", "heater", "lamp", "vacuum", "mattress", "chair", "furniture"],
  },
  {
    name: "Study",
    icon: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 22h14"/><path d="M8 7h8"/>',
    keywords: ["calculator", "textbook", "book", "lab coat", "goggles", "study", "graphing"],
  },
  {
    name: "Costumes",
    icon: '<path d="M12 7.5a2 2 0 1 1 2-2c0 1.2-2 1.4-2 3V9l8.6 6.2a1 1 0 0 1-.6 1.8H4a1 1 0 0 1-.6-1.8L12 9"/>',
    keywords: ["costume", "halloween", "suit", "dress", "tux", "formal", "gown", "cap and gown"],
  },
  {
    name: "Other",
    icon: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    keywords: [],
  },
];

/** Shown first on Discover; the rest appear after "See all". */
export const FEATURED_CATEGORIES: Category[] = ["Projectors", "Cameras", "Audio", "Outdoors", "Gaming", "Tools", "Party & Events"];

/** Featured categories first, then the rest in their usual order. */
export const categoriesForBrowsing = () => [
  ...FEATURED_CATEGORIES.map((name) => byName.get(name)!),
  ...categories.filter((category) => !FEATURED_CATEGORIES.includes(category.name)),
];

const byName = new Map(categories.map((category) => [category.name, category]));

export const isCategory = (value: string | null | undefined): value is Category =>
  Boolean(value && byName.has(value as Category));

export const categoryInfo = (name: string | null | undefined) => byName.get(name as Category) ?? byName.get("Other")!;

/** A category's icon as a standalone SVG string (for the placeholder art in data URLs). */
export function categorySvg(name: string, { size = 24, color = "#0064a4", x = 0, y = 0, stroke = 2 } = {}) {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${categoryInfo(name).icon}</svg>`;
}

/** Which category a search jumps to, if any: an exact name, or a keyword at the start of a word. */
export function matchCategory(query: string): Category | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const exact = categories.find((category) => category.name.toLowerCase() === q);
  if (exact) return exact.name;
  return categories.find((category) =>
    category.keywords.some((word) => q === word || q.startsWith(`${word} `) || q.startsWith(word) && word.length >= 4),
  )?.name;
}
