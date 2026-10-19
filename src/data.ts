export type Category = "Projectors" | "Tools" | "Outdoors";

export type Owner = {
  id: string;
  name: string;
  rating: string;
  lends: number;
  responseMins: number;
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

export const owners: Record<string, Owner> = {
  jordan: { id: "jordan", name: "Jordan Lee", rating: "4.9", lends: 18, responseMins: 20 },
  priya: { id: "priya", name: "Priya S.", rating: "5.0", lends: 24, responseMins: 15 },
  alex: { id: "alex", name: "Alex R.", rating: "4.8", lends: 11, responseMins: 30 },
  nina: { id: "nina", name: "Nina C.", rating: "4.9", lends: 15, responseMins: 25 },
  sam: { id: "sam", name: "Sam T.", rating: "5.0", lends: 9, responseMins: 20 },
  dani: { id: "dani", name: "Dani M.", rating: "4.8", lends: 13, responseMins: 35 },
};

export const items: Item[] = [
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
];

export const categories: { name: Category; symbol: string }[] = [
  { name: "Projectors", symbol: "▱" },
  { name: "Tools", symbol: "⌁" },
  { name: "Outdoors", symbol: "△" },
];

export const currentUser = {
  name: "Maya Kim",
  initials: "MK",
  program: "Engineering ’27",
};

export const PICKUP_SPOT = "UCI Student Center";

export const getItem = (id: string | undefined) => items.find((item) => item.id === id);
export const getOwner = (id: string) => owners[id];
export const firstName = (name: string) => name.split(" ")[0];
export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .replace(".", "");

/** Explore search: same matching rules as the prototype. */
export function searchItems(query: string) {
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
