import { roadDone, type CivicRoad, type Seed } from "../world";
import type { RoadRow } from "../civic-roads";

/** Former Game.tsx computation (all pairs, re-filtering first_roads per pair) — test reference only. */
export function civicRoadsReference(seeds: readonly Seed[], rows: readonly RoadRow[]): CivicRoad[][] {
  return seeds.map((s) => seeds.filter((o) => o.id !== s.id).flatMap((o) => {
    const a = { ...s, roads: rows.filter((r) => r.seed_id === s.id).map((r) => ({ target: r.target_id, at: Date.parse(r.created_at) })) };
    const b = { ...o, roads: rows.filter((r) => r.seed_id === o.id).map((r) => ({ target: r.target_id, at: Date.parse(r.created_at) })) };
    const at = roadDone(a, b);
    return at === null ? [] : [{ at }];
  }));
}
