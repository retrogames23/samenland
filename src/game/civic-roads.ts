import { roadDone, type CivicRoad } from "./world";

export type RoadRow = { seed_id: string; target_id: string; created_at: string };
type Pos = { id: string; x: number; y: number };

/**
 * Finished-road times per village (Seed.civicRoads), aligned with `seeds`, partners in seed order.
 * roadDone(a, b) is null unless a or b decided a road towards the other, so only those pairs are evaluated —
 * each once, with first_roads grouped a single time. Identical to civicRoadsReference (src/game/__ref).
 */
export function civicRoadsOf(seeds: readonly Pos[], rows: readonly RoadRow[]): CivicRoad[][] {
  const idx = new Map<string, number[]>();
  seeds.forEach((s, i) => { const l = idx.get(s.id); if (l) l.push(i); else idx.set(s.id, [i]); });
  const roads = new Map<string, { target: string; at: number }[]>();
  const partners = new Map<string, Set<string>>();
  const link = (a: string, b: string) => { let p = partners.get(a); if (!p) partners.set(a, (p = new Set())); p.add(b); };
  for (const r of rows) {
    let l = roads.get(r.seed_id); if (!l) roads.set(r.seed_id, (l = []));
    l.push({ target: r.target_id, at: Date.parse(r.created_at) });
    if (r.seed_id !== r.target_id) { link(r.seed_id, r.target_id); link(r.target_id, r.seed_id); }
  }
  const pair = new Map<string, number | null>();
  return seeds.map((s) => {
    const list: CivicRoad[] = [];
    const ps = partners.get(s.id);
    if (ps) {
      // every seed carrying a partner id counts (duplicate ids included), in seed order
      const hits: number[] = [];
      for (const id of ps) if (id !== s.id) for (const i of idx.get(id) ?? []) hits.push(i);
      hits.sort((a, b) => a - b);
      for (const i of hits) {
        const o = seeds[i]!;
        const key = s.id < o.id ? `${s.id}|${o.id}|${s.x},${s.y}|${o.x},${o.y}` : `${o.id}|${s.id}|${o.x},${o.y}|${s.x},${s.y}`;
        let at = pair.get(key);
        if (at === undefined) {
          at = roadDone({ ...s, name: "", owner: "", hue: 0, created_at: "", roads: roads.get(s.id) ?? [] }, { ...o, name: "", owner: "", hue: 0, created_at: "", roads: roads.get(o.id) ?? [] });
          pair.set(key, at);
        }
        if (at !== null) list.push({ at });
      }
    }
    return list;
  });
}
