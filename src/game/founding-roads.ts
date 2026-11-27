import type { Realm } from "./time";
import { roadCandidates, roadReach, type Seed } from "./world";

/**
 * Gründungswarnung (P5): which trade-road partners a village founded at (x, y) could decide by itself.
 *
 * This is exactly roadCandidates — the check the road menu runs once the village exists — applied to a
 * not-yet-stored seed. Every partner it returns becomes, once the road is decided, a link that the rank
 * certificate counts in roadsFor (rank.ts) — from the decision on (Link.since), as roadsFor does today.
 * No rule of its own: reach, decisions and the sea-bridge limit all stay in world.ts. A fixed probe id and creation date keep the road path cache warm while the
 * founder looks at the same spot (fresh-id parity is checked in founding-roads.test.ts). The probe always carries a
 * user id: the founded village belongs to a player, so roads to unowned sample villages need a decision as well.
 */
export const FOUNDING_PROBE = "plant-probe";
/** The not-yet-stored village at (x, y) and the seed list it would join. */
function foundingWorld(x: number, y: number, realm: Realm, seeds: Seed[], userId: string | null) {
  const probe: Seed = {
    id: FOUNDING_PROBE,
    name: "",
    owner: "",
    x,
    y,
    hue: 0,
    realm,
    user_id: userId ?? FOUNDING_PROBE,
    roads: [],
    created_at: new Date(0).toISOString(),
  };
  return { probe, world: [...seeds.filter((s) => s.id !== FOUNDING_PROBE), probe] };
}
export function foundingRoadCandidates(
  x: number,
  y: number,
  realm: Realm,
  seeds: Seed[],
  userId: string | null = null,
): Seed[] {
  const { probe, world } = foundingWorld(x, y, realm, seeds, userId);
  return roadCandidates(probe, world);
}
/** The road reach that roadCandidates applies at this site (roadReach): NEAR_ROAD_DIST with two towns within it, else
 *  TRADE_DIST — shown in the warning. A new village has no incoming decisions, so no counter-decision widens it. */
export function foundingReach(
  x: number,
  y: number,
  realm: Realm,
  seeds: Seed[],
  userId: string | null = null,
): number {
  const { probe, world } = foundingWorld(x, y, realm, seeds, userId);
  return roadReach(probe, world);
}
/** Both answers for the founding parchment from one probe: isolated exactly as foundingIsolated, reach exactly as
 *  foundingReach (parity in founding-roads.test.ts). */
export function foundingCheck(
  x: number,
  y: number,
  realm: Realm,
  seeds: Seed[],
  userId: string | null = null,
): { isolated: boolean; reach: number } {
  const { probe, world } = foundingWorld(x, y, realm, seeds, userId);
  return { isolated: roadCandidates(probe, world).length === 0, reach: roadReach(probe, world) };
}
/** Isolated: no other village can be reached by a trade road from this site — the founding parchment warns, never blocks. */
export const foundingIsolated = (
  x: number,
  y: number,
  realm: Realm,
  seeds: Seed[],
  userId: string | null = null,
) => foundingRoadCandidates(x, y, realm, seeds, userId).length === 0;
