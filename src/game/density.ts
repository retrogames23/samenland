import type { TownWay } from "./character";
import type { Kind } from "./world";

/** Extra dwellings are inside existing houses, never on invented land tiles. */
const MULTI_HOME = new Set<Kind>(["cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement", "suburb"]);
/** Workshop (hill) towns build stone and craft houses upwards earlier: their second floor comes from WORKSHOP_EARLY. */
const STONE_HOME = new Set<Kind>(["steinhaus", "handwerker", "tenement"]);
/** Gateway (coast/river) towns: merchant houses and tenements carry a fourth family (lofts/counting floors) from radius 30. */
const MERCHANT_HOME = new Set<Kind>(["patrician", "tenement"]);
export const WORKSHOP_EARLY = 12, GATEWAY_FOURTH = 30;
/** Maximum families any dwelling can hold (households.ts loops up to this). */
export const MAX_SLOTS = 4;
export function dwellingSlots(way: TownWay, kind: Kind, radius: number) {
  if (!MULTI_HOME.has(kind)) return 1;
  // Shared base rule: second family from radius 18, third from radius 30. Way rules only ever add.
  const base = radius >= 30 ? 3 : radius >= 18 ? 2 : 1;
  if (way === "workshop" && STONE_HOME.has(kind) && radius >= WORKSHOP_EARLY) return Math.max(base, radius >= 24 ? 3 : 2);
  if (way === "gateway" && MERCHANT_HOME.has(kind) && radius >= GATEWAY_FOURTH) return 4;
  return base;
}
// Keep every legacy family/member ID unchanged; new floors occupy disjoint ID blocks.
export const HOME_KEY_SPACE = 1024 * 1024;
export const dwellingKey = (x: number, y: number, unit = 0) => x * 1024 + y + unit * HOME_KEY_SPACE;
export function dwellingTile(key: number): [number, number] {
  const tile = key % HOME_KEY_SPACE;
  return [Math.floor(tile / 1024), tile % 1024];
}
