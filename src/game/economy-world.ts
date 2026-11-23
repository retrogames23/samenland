import { roadDone, type Seed, type CharterPath, type PactKind, type WorkKind } from "./world";

type Dated = { seed_id: string; created_at: string };
export type EconomyWorld = {
  seeds: Seed[];
  purchases: (Dated & { item: string; x?: number | null; y?: number | null })[];
  blessings: Dated[];
  charters: (Dated & { path: string })[];
  encounters: (Dated & { event: string; choice: string; cost: number; request_id?: string | null })[];
  roads: (Dated & { target_id: string })[];
  votes: (Dated & { partner_id: string; pact: string })[];
  works: (Dated & { partner_id: string; work: string; cost: number })[];
  gifts: { id: string; from_seed: string; to_seed: string; kind: string; created_at: string }[];
};

/** Rows grouped by seed id, keeping input order inside each group (local to one call, never shared). */
function groupBy<T>(rows: T[], key: (r: T) => string | null): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    if (k === null) continue;
    const g = m.get(k);
    if (g) g.push(r); else m.set(k, [r]);
  }
  return m;
}
const NONE: never[] = [];

/** Rebuild only inputs that existed on the assessed day; later villages/buildings must not rewrite the past. */
export function economyWorldAt(input: EconomyWorld, at: number): Seed[] {
  const sid = (r: Dated) => r.seed_id;
  const purchases = groupBy(input.purchases, sid), blessings = groupBy(input.blessings, sid), charters = groupBy(input.charters, sid);
  const encounters = groupBy(input.encounters, sid), roads = groupBy(input.roads, sid), votes = groupBy(input.votes, sid), works = groupBy(input.works, sid);
  const aid = groupBy(input.gifts, g => g.kind === "aid" ? g.to_seed : null);
  const own = <T extends { created_at: string }>(m: Map<string, T[]>, id: string) => (m.get(id) ?? NONE).filter(r => Date.parse(r.created_at) <= at);
  const seeds: Seed[] = input.seeds.filter(s => Date.parse(s.created_at) <= at).map(s => {
    const charter = own(charters, s.id)[0];
    const { charter: _oldCharter, ...base } = s;
    return ({
    ...base,
    bought: own(purchases, s.id).map(b => ({ item: b.item, at: Date.parse(b.created_at), x: b.x ?? null, y: b.y ?? null })).sort((a, b) => a.at - b.at),
    blessed: own(blessings, s.id).map(b => Date.parse(b.created_at)).sort((a, b) => a - b),
    ...(charter ? { charter: { path: charter.path as CharterPath, at: Date.parse(charter.created_at) } } : {}),
    decisions: own(encounters, s.id).map(d => ({ event: d.event, choice: d.choice, cost: d.cost, at: Date.parse(d.created_at), ...(d.request_id ? { request: d.request_id } : {}) })).sort((a, b) => a.at - b.at),
    roads: own(roads, s.id).map(r => ({ target: r.target_id, at: Date.parse(r.created_at) })),
    votes: own(votes, s.id).map(v => ({ partner: v.partner_id, pact: v.pact as PactKind, at: Date.parse(v.created_at) })),
    works: own(works, s.id).map(w => ({ partner: w.partner_id, work: w.work as WorkKind, cost: w.cost, at: Date.parse(w.created_at) })),
    aid: own(aid, s.id).map(g => Date.parse(g.created_at)),
  }); });
  // roadDone(s, o) is null unless one side decided a road towards the other by `at`: only those pairs are evaluated, in the same seed order.
  const decided = new Set<string>();
  for (const s of seeds) for (const r of s.roads ?? []) { decided.add(`${s.id}|${r.target}`); decided.add(`${r.target}|${s.id}`); }
  return seeds.map(s => ({ ...s, civicRoads: seeds.filter(o => o.id !== s.id && decided.has(`${s.id}|${o.id}`)).flatMap(o => { const done = roadDone(s, o); return done === null ? [] : [{ at: done }]; }) }));
}
