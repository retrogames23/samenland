import type { Realm } from "./time";
import { roadCandidates, type Seed } from "./world";

/**
 * Gründungswarnung (P5): which trade-road partners a village founded at (x, y) could decide by itself.
 *
 * This is exactly roadCandidates — the check the road menu runs once the village exists — applied to a
 * not-yet-stored seed. Every partner it returns becomes, once the road is decided and finished, a link that
 * the rank certificate counts in roadsFor (rank.ts). No rule of its own: reach, decisions and the sea-bridge
 * limit all stay in world.ts. A fixed probe id and creation date keep the road path cache warm while the
 * founder looks at the same spot (fresh-id parity is checked in founding-roads.test.ts). The probe always carries a
 * user id: the founded village belongs to a player, so roads to unowned sample villages need a decision as well.
 */
export const FOUNDING_PROBE = "plant-probe";
export function foundingRoadCandidates(
  x: number,
  y: number,
  realm: Realm,
  seeds: Seed[],
  userId: string | null = null,
): Seed[] {
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
  return roadCandidates(probe, [...seeds.filter((s) => s.id !== FOUNDING_PROBE), probe]);
}
/** Isolated: no other village can be reached by a trade road from this site — the founding parchment warns, never blocks. */
export const foundingIsolated = (
  x: number,
  y: number,
  realm: Realm,
  seeds: Seed[],
  userId: string | null = null,
) => foundingRoadCandidates(x, y, realm, seeds, userId).length === 0;
