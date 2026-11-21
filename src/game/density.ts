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
/** P1-1 Wohnraum: what bought buildings change in dwellingSlots. All flags false / shift 0 = the old rule exactly. */
export type HousingPerks = {
  /** Holzfällerlager: second family in half-timbered and town houses from WOODCAMP_SECOND instead of 18. */
  woodcamp: boolean;
  /** Gesellenherberge (journeymen's chambers): one more family in craftsmen's houses from HERBERGE_FROM. */
  herberge: boolean;
  /** Small way building (Großspeicher / Steinmetzhütte / Fischhalle): second family from WORKSHOP_EARLY in WAY_EARLY_HOME[way]. */
  wayEarly: boolean;
  /** Large way building (Windmühlenreihe / Hammerwerk / Salzkontor): third family from WAY_BIG_THIRD instead of 30. */
  wayBig: boolean;
  /** Salzkontor am Kai: fourth family in merchant houses (steinhaus) from SALT_FOURTH. */
  saltquay: boolean;
  /** Finished Zunftturm steps: every floor threshold comes this many radii earlier. */
  shift: number;
};
export const NO_PERKS: HousingPerks = { woodcamp: false, herberge: false, wayEarly: false, wayBig: false, saltquay: false, shift: 0 };
export const WOODCAMP_SECOND = 16, HERBERGE_FROM = 12, WAY_BIG_THIRD = 26, SALT_FOURTH = 26;
const WOOD_HOME = new Set<Kind>(["fachwerk", "townhouse", "townhouse2"]);
/** Houses each way's small building lifts early (WORKSHOP_EARLY pattern): plain farm-town timber houses, the
 *  workshop's brick fronts not yet in STONE_HOME, the gateway's merchant and harbour houses. */
export const WAY_EARLY_HOME: Record<TownWay, ReadonlySet<Kind>> = {
  grain: new Set<Kind>(["cottage", "fachwerk", "townhouse", "townhouse2"]),
  workshop: new Set<Kind>(["townhouse2", "patrician", "villa"]),
  gateway: new Set<Kind>(["steinhaus", "patrician", "tenement"]),
};
export function dwellingSlots(way: TownWay, kind: Kind, radius: number, p: HousingPerks = NO_PERKS) {
  if (!MULTI_HOME.has(kind)) return 1;
  const r = radius + p.shift;
  // Shared base rule: second family from radius 18, third from radius 30. Way rules and bought perks only ever add.
  const t2 = p.woodcamp && WOOD_HOME.has(kind) ? WOODCAMP_SECOND : 18, t3 = p.wayBig ? WAY_BIG_THIRD : 30;
  let n = r >= t3 ? 3 : r >= t2 ? 2 : 1;
  if (p.wayEarly && WAY_EARLY_HOME[way].has(kind) && r >= WORKSHOP_EARLY) n = Math.max(n, 2);
  if (way === "workshop" && STONE_HOME.has(kind) && r >= WORKSHOP_EARLY) n = Math.max(n, r >= 24 ? 3 : 2);
  if (way === "gateway" && MERCHANT_HOME.has(kind) && r >= GATEWAY_FOURTH) n = 4;
  if (p.saltquay && kind === "steinhaus" && r >= SALT_FOURTH) n = 4;
  if (p.herberge && kind === "handwerker" && r >= HERBERGE_FROM) n = Math.min(MAX_SLOTS, n + 1);
  return n;
}
// Keep every legacy family/member ID unchanged; new floors occupy disjoint ID blocks.
export const HOME_KEY_SPACE = 1024 * 1024;
export const dwellingKey = (x: number, y: number, unit = 0) => x * 1024 + y + unit * HOME_KEY_SPACE;
export function dwellingTile(key: number): [number, number] {
  const tile = key % HOME_KEY_SPACE;
  return [Math.floor(tile / 1024), tile % 1024];
}
