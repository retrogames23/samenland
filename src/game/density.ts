import type { TownWay } from "./character";
import type { Kind } from "./world";

/** Extra dwellings are inside existing houses, never on invented land tiles. */
const MULTI_HOME = new Set<Kind>(["cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement", "suburb"]);
export function dwellingSlots(way: TownWay, kind: Kind, radius: number) {
  if (!MULTI_HOME.has(kind)) return 1;
  if (way === "workshop") return radius >= 24 ? 3 : radius >= 12 ? 2 : 1;
  if (way === "gateway") return radius >= 18 ? 2 : 1;
  return 1;
}
// Keep every legacy family/member ID unchanged; new floors occupy disjoint ID blocks.
export const HOME_KEY_SPACE = 1024 * 1024;
export const dwellingKey = (x: number, y: number, unit = 0) => x * 1024 + y + unit * HOME_KEY_SPACE;
export function dwellingTile(key: number): [number, number] {
  const tile = key % HOME_KEY_SPACE;
  return [Math.floor(tile / 1024), tile % 1024];
}