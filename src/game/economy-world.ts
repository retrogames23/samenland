import { roadDone, type Seed, type CharterPath, type PactKind, type WorkKind } from "./world";

type Dated = { seed_id: string; created_at: string };
export type EconomyWorld = {
  seeds: Seed[];
  purchases: (Dated & { item: string; x?: number | null; y?: number | null })[];
  blessings: Dated[];
  charters: (Dated & { path: string })[];
  encounters: (Dated & { event: string; choice: string; cost: number })[];
  roads: (Dated & { target_id: string })[];
  votes: (Dated & { partner_id: string; pact: string })[];
  works: (Dated & { partner_id: string; work: string; cost: number })[];
  gifts: { id: string; from_seed: string; to_seed: string; kind: string; created_at: string }[];
};

/** Rebuild only inputs that existed on the assessed day; later villages/buildings must not rewrite the past. */
export function economyWorldAt(input: EconomyWorld, at: number): Seed[] {
  const own = <T extends Dated>(rows: T[], id: string) => rows.filter(r => r.seed_id === id && Date.parse(r.created_at) <= at);
  const seeds: Seed[] = input.seeds.filter(s => Date.parse(s.created_at) <= at).map(s => {
    const charter = own(input.charters, s.id)[0];
    const { charter: _oldCharter, ...base } = s;
    return ({
    ...base,
    bought: own(input.purchases, s.id).map(b => ({ item: b.item, at: Date.parse(b.created_at), x: b.x ?? null, y: b.y ?? null })).sort((a, b) => a.at - b.at),
    blessed: own(input.blessings, s.id).map(b => Date.parse(b.created_at)).sort((a, b) => a - b),
    ...(charter ? { charter: { path: charter.path as CharterPath, at: Date.parse(charter.created_at) } } : {}),
    decisions: own(input.encounters, s.id).map(d => ({ event: d.event, choice: d.choice, cost: d.cost, at: Date.parse(d.created_at) })).sort((a, b) => a.at - b.at),
    roads: own(input.roads, s.id).map(r => ({ target: r.target_id, at: Date.parse(r.created_at) })),
    votes: own(input.votes, s.id).map(v => ({ partner: v.partner_id, pact: v.pact as PactKind, at: Date.parse(v.created_at) })),
    works: own(input.works, s.id).map(w => ({ partner: w.partner_id, work: w.work as WorkKind, cost: w.cost, at: Date.parse(w.created_at) })),
    aid: input.gifts.filter(g => g.to_seed === s.id && g.kind === "aid" && Date.parse(g.created_at) <= at).map(g => Date.parse(g.created_at)),
  }); });
  return seeds.map(s => ({ ...s, civicRoads: seeds.filter(o => o.id !== s.id).flatMap(o => { const done = roadDone(s, o); return done === null ? [] : [{ at: done }]; }) }));
}