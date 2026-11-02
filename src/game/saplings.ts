import { buildable, terrain, structureAt, radiusOf, effAge, type Seed } from "./world";

/** Extra tiles beyond the village radius where a rare sapling may go. */
export const SAPLING_REACH = 3;

/**
 * Every free meadow tile where the player's sapling may be planted: buildable, not forest-blocked by a
 * structure, not already planted, within radius + SAPLING_REACH. If fewer than 3 exist, the ring widens
 * step by step (up to +4) so a planting spot is always offered. Pure — same answer for every client.
 */
export function saplingSpots(my: Seed, seeds: Seed[], planted: (x: number, y: number) => boolean, now: number): [number, number][] {
  const r = radiusOf(effAge(my, seeds, now));
  for (let extra = SAPLING_REACH; extra <= SAPLING_REACH + 4; extra++) {
    const R = r + extra, n = Math.ceil(R), out: [number, number][] = [];
    for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) {
      if (Math.hypot(dx, dy) > R) continue;
      const x = Math.round(my.x) + dx, y = Math.round(my.y) + dy;
      if (!buildable(terrain(x, y)) || structureAt(x, y, seeds, now) || planted(x, y)) continue;
      out.push([x, y]);
    }
    if (out.length >= 3) return out;
  }
  return [];
}
