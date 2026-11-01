import type { TownWay } from "./character";
import type { Kind } from "./world";

/** Extra dwellings are inside existing houses, never on invented land tiles. */
const MULTI_HOME = new Set<Kind>(["cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement", "suburb"]);
/** Plains add a lodger floor only to cottages and town houses, so they stay the widest-spread character. */
const GRAIN_FLOORS = new Set<Kind>(["cottage", "fachwerk", "townhouse", "townhouse2"]);
export function dwellingSlots(way: TownWay, kind: Kind, radius: number) {
  if (!MULTI_HOME.has(kind)) return 1;
  // Staggered so no character pulls far ahead mid-game: hills densify first and highest,
  // coasts and plains follow with a second floor once they are small towns.
  if (way === "workshop") return radius >= 24 ? 3 : radius >= 14 ? 2 : 1;
  if (way === "gateway") return radius >= 26 ? 3 : radius >= 16 ? 2 : 1;
  return radius >= 16 && GRAIN_FLOORS.has(kind) ? 2 : 1;
}
// Keep every legacy family/member ID unchanged; new floors occupy disjoint ID blocks.
export const HOME_KEY_SPACE = 1024 * 1024;
export const dwellingKey = (x: number, y: number, unit = 0) => x * 1024 + y + unit * HOME_KEY_SPACE;
export function dwellingTile(key: number): [number, number] {
  const tile = key % HOME_KEY_SPACE;
  return [Math.floor(tile / 1024), tile % 1024];
}