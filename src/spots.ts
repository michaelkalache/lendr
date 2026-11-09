/**
 * Campus drop-off spots. Lenders leave items here and borrowers return them here, so the two never
 * have to be in the same place at the same time. Ids must match public.is_spot() in
 * supabase/migrations/003_dropoff_returns.sql. mapId is the location id on the official UCI map
 * (map.uci.edu), so each spot opens with its marker selected.
 */
export type Spot = { id: string; name: string; group: SpotGroup; mapId: string };
export type SpotGroup = "Student life" | "Libraries & study" | "Academic buildings" | "Housing";

export const SPOTS: Spot[] = [
  { id: "student-center", name: "Student Center", group: "Student life", mapId: "1117786" },
  { id: "arc", name: "Anteater Recreation Center (ARC)", group: "Student life", mapId: "1117541" },
  { id: "alp", name: "Anteater Learning Pavilion", group: "Student life", mapId: "1117328" },
  { id: "langson", name: "Langson Library", group: "Libraries & study", mapId: "1117334" },
  { id: "science-library", name: "Science Library", group: "Libraries & study", mapId: "1117479" },
  { id: "gateway-study", name: "Gateway Study Center", group: "Libraries & study", mapId: "1117774" },
  { id: "dbh", name: "Donald Bren Hall (ICS)", group: "Academic buildings", mapId: "1117348" },
  { id: "engineering-gateway", name: "Engineering Gateway", group: "Academic buildings", mapId: "1117586" },
  { id: "humanities-gateway", name: "Humanities Gateway", group: "Academic buildings", mapId: "1117358" },
  { id: "sbsg", name: "Social & Behavioral Sciences Gateway", group: "Academic buildings", mapId: "1117375" },
  { id: "merage", name: "Merage School of Business", group: "Academic buildings", mapId: "1117371" },
  { id: "mesa-court", name: "Mesa Court Community Center", group: "Housing", mapId: "464546" },
  { id: "middle-earth", name: "Middle Earth Housing Office", group: "Housing", mapId: "464549" },
  { id: "plaza-verde", name: "Plaza Verde Community Center", group: "Housing", mapId: "584951" },
];

export const SPOT_GROUPS: SpotGroup[] = ["Student life", "Libraries & study", "Academic buildings", "Housing"];

export const DEFAULT_SPOT = "student-center";

const byId = new Map(SPOTS.map((spot) => [spot.id, spot]));

export const isSpot = (id: string | undefined | null): id is string => Boolean(id && byId.has(id));

export function spotFor(id: string | undefined | null): Spot {
  return (id && byId.get(id)) || byId.get(DEFAULT_SPOT)!;
}

export const spotName = (id: string | undefined | null) => spotFor(id).name;

/** The UCI campus map with this spot's marker open. */
export const spotMapUrl = (id: string | undefined | null) => `https://map.uci.edu/?id=463#!m/${spotFor(id).mapId}`;

/** The UCI campus map overview (buildings, libraries, housing, and student life layers). */
export const CAMPUS_MAP_URL = "https://map.uci.edu/?id=463#!ct/92249,95177,95129,95130,95176?s/";
