import { structureAt, type Kind, type Seed } from "./world";
import { townOf, type Job, type Person } from "./people";
import { seasonAt } from "./season";
import { worldHour } from "./time";
import { floodFood } from "./disasters";

/** Stored goods — derived purely from town, clock and season, never saved. */
export type Ware = "log" | "planks" | "stone" | "grain" | "flour" | "bread" | "fish" | "game" | "herbs" | "cheese";
export const WARES: Ware[] = ["log", "planks", "stone", "grain", "flour", "bread", "fish", "game", "herbs", "cheese"];
const FOOD: Ware[] = ["bread", "fish", "game", "cheese"];

/** Recipes: job → [input, output, units per worker per day, input per output]. */
const RECIPE: Partial<Record<Job, [Ware | null, Ware, number, number]>> = {
  woodcutter: [null, "log", 6, 0], mason: [null, "stone", 4, 0], farmer: [null, "grain", 2, 0],
  fisher: [null, "fish", 5, 0], hunter: [null, "game", 2, 0], herbalist: [null, "herbs", 3, 0],
  sawyer: ["log", "planks", 5, 1], miller: ["grain", "flour", 10, 1], baker: ["flour", "bread", 12, 1],
};
/** Seasonal yield of raw goods. */
const SEASON: Partial<Record<Ware, [number, number, number, number]>> = { // winter, spring, summer, autumn
  grain: [0.1, 0.5, 1.2, 2.2], fish: [0.5, 1, 1.2, 1], herbs: [0.2, 1.2, 1.4, 0.8], game: [0.8, 1, 1, 1.3], log: [1.3, 1, 0.8, 1],
};
/** Which buildings hold a ware (first listed fills first). */
export const STORES: Record<Ware, Kind[]> = {
  log: ["woodcamp", "sawmill", "warehouse"], planks: ["sawmill", "warehouse"], stone: ["warehouse", "smithy"],
  grain: ["granary", "barn", "mill", "watermill"], flour: ["mill", "watermill", "bakery"], bread: ["bakery", "inn", "market"],
  fish: ["fishery", "harbor", "market"], game: ["lodge", "inn"], herbs: ["herbhut", "infirmary"], cheese: ["dairy", "market"],
};

export type Flow = { ware: Ware; stock: number; made: number; used: number; trend: -1 | 0 | 1 };
export type Larder = { flows: Flow[]; food: number; eaters: number; byKind: Map<Kind, Tile[]> };
type Tile = [number, number];

const cache = new Map<string, Larder>();

/** Share of today's work done at this world hour (work 7–18). */
const workDone = (h: number) => Math.min(1, Math.max(0, (h - 7) / 11));

/** Daily deadwood/field stones a village gathers before it has woodcutters or masons. */
export const YOUNG_WOOD = 3, YOUNG_STONE = 1.5;
/** Grain storage: a base heap, plus room in every mill and the granary; the rest spoils or feeds the animals. */
export const GRAIN_BASE = 40, GRAIN_PER_MILL = 30, GRAIN_PER_GRANARY = 80;
/** One sheaf as porridge counts as half a meal. */
export const GRAIN_MEAL = 0.5;
export const grainCap = (byKind: Map<Kind, unknown[]>) =>
  GRAIN_BASE + GRAIN_PER_MILL * ((byKind.get("mill")?.length ?? 0) + (byKind.get("watermill")?.length ?? 0)) + GRAIN_PER_GRANARY * (byKind.get("granary")?.length ?? 0);
export function larderOf(s: Seed, seeds: Seed[], now: number): Larder {
  const t = townOf(s, seeds, now);
  const key = `${s.id}|${t.now}|${Math.floor(now / 60000)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size > 40) cache.clear();
  const sw = seasonAt(now);
  const sf = (w: Ware) => { const f = SEASON[w]; return f ? f[0] * sw.winter + f[1] * sw.spring + f[2] * sw.summer + f[3] * sw.autumn : 1; };
  const flood = floodFood(s, now) < 0 ? 0.3 : 1;
  const byKind = new Map<Kind, Tile[]>();
  const seen = new Set<string>();
  for (const p of t.people) {
    if (!p.work) continue;
    const k = `${p.work[0]},${p.work[1]}`;
    if (seen.has(k)) continue; seen.add(k);
    const st = structureAt(p.work[0], p.work[1], seeds, now);
    if (st && st.build === undefined) { if (!byKind.has(st.kind)) byKind.set(st.kind, []); byKind.get(st.kind)!.push(p.work); }
  }
  const made = new Map<Ware, number>(), used = new Map<Ware, number>();
  const add = (m: Map<Ware, number>, w: Ware, v: number) => m.set(w, (m.get(w) ?? 0) + v);
  // raw goods first, then processing limited by available input
  const jobs = new Map<Job, number>();
  for (const p of t.people) jobs.set(p.job, (jobs.get(p.job) ?? 0) + 1);
  for (const [j, n] of jobs) { const r = RECIPE[j]; if (r && !r[0]) add(made, r[1], n * r[2] * sf(r[1]) * (r[1] === "grain" ? flood : 1)); }
  // young villages: households gather deadwood and field stones themselves until real woodcutters/masons exist
  if (!jobs.get("woodcutter")) add(made, "log", Math.min(YOUNG_WOOD, t.people.length * 0.5));
  if (!jobs.get("mason")) add(made, "stone", Math.min(YOUNG_STONE, t.people.length * 0.25));
  for (const j of ["sawyer", "miller", "baker"] as Job[]) {
    const r = RECIPE[j]!, n = jobs.get(j) ?? 0;
    const out = Math.min(n * r[2], (made.get(r[0]!) ?? 0) / r[3] + 2 * n);
    if (out > 0) { add(made, r[1], out); add(used, r[0]!, out * r[3]); }
  }
  if (byKind.has("dairy")) add(made, "cheese", 4 * byKind.get("dairy")!.length);
  // builders use timber and stone; everyone eats once a day, herbs for the sick
  const builders = jobs.get("builder") ?? 0;
  add(used, "planks", builders * 2); add(used, "log", builders * 1); add(used, "stone", builders * 1.5);
  const eaters = t.people.length;
  let need = eaters * 0.8;
  for (const w of FOOD) { const take = Math.min(need, made.get(w) ?? 0); if (take) { add(used, w, take); need -= take; } }
  // porridge: left-over grain fills the remaining hunger (after the mills took their share)
  if (need > 0) add(used, "grain", Math.min(need, Math.max(0, (made.get("grain") ?? 0) - (used.get("grain") ?? 0))));
  add(used, "herbs", Math.min(made.get("herbs") ?? 0, t.people.filter((p) => p.sick).length));
  const h = worldHour(now), done = workDone(h), eaten = Math.min(1, Math.max(0, (h - 6) / 15));
  const cap = grainCap(byKind);
  const flows: Flow[] = [];
  for (const w of WARES) {
    const m = made.get(w) ?? 0, u = used.get(w) ?? 0;
    if (m <= 0 && u <= 0) continue;
    const surplus = Math.max(0, m - u);
    let stock = Math.max(0, Math.round(surplus * 3 + m * done - u * eaten + m * 0.4));
    if (w === "grain") stock = Math.min(stock, cap);
    const rate = m * (done > 0 && done < 1 ? 1 : 0) - u * (eaten < 1 && h > 6 ? 1 : 0);
    flows.push({ ware: w, stock, made: Math.round(m * done), used: Math.round(u * eaten), trend: rate > 0.5 ? 1 : rate < -0.5 ? -1 : 0 });
  }
  const grainStock = flows.find((f) => f.ware === "grain")?.stock ?? 0;
  const food = flows.filter((f) => FOOD.includes(f.ware)).reduce((a, f) => a + f.stock, 0) + Math.floor(grainStock * GRAIN_MEAL);
  const res = { flows, food, eaters, byKind };
  cache.set(key, res);
  return res;
}

/** Stock held in one building: the town stock of each ware split across its stores. */
export function storedAt(kind: Kind, tile: Tile, l: Larder): { ware: Ware; n: number }[] {
  const out: { ware: Ware; n: number }[] = [];
  for (const f of l.flows) {
    const ks = STORES[f.ware];
    const i = ks.indexOf(kind);
    if (i < 0 || !f.stock) continue;
    const holders = ks.flatMap((k, j) => (l.byKind.get(k) ?? []).map((tl) => ({ tl, w: ks.length - j })));
    if (!holders.some((x) => x.tl[0] === tile[0] && x.tl[1] === tile[1])) holders.push({ tl: tile, w: ks.length - i });
    const sum = holders.reduce((a, x) => a + x.w, 0);
    const n = Math.round((f.stock * (ks.length - i)) / sum);
    if (n > 0) out.push({ ware: f.ware, n });
  }
  return out;
}

/** Production chains, each step a set of building kinds. */
export const CHAINS: Kind[][][] = [
  [["field"], ["mill", "watermill"], ["bakery"], ["inn", "market"]],
  [["woodcamp"], ["sawmill"], ["warehouse"]],
  [["fishery", "harbor"], ["market", "inn"]],
  [["lodge"], ["inn"]],
  [["herbhut"], ["infirmary"]],
  [["pasture"], ["dairy"], ["market"]],
];
const JOB_AT: Partial<Record<Kind, Job>> = { field: "farmer", mill: "miller", watermill: "miller", bakery: "baker", inn: "innkeeper", market: "merchant", sawmill: "sawyer", woodcamp: "woodcutter", fishery: "fisher", harbor: "fisher", lodge: "hunter", herbhut: "herbalist", infirmary: "healer" };

export type Link = { kind: Kind; tile: Tile | null; here: boolean };
/** The chain a building belongs to, with the nearest real building for each step. */
export function chainOf(kind: Kind, tile: Tile, l: Larder, people: Person[]): Link[] | null {
  const ch = CHAINS.find((c) => c.some((st) => st.includes(kind)));
  if (!ch) return null;
  const d = (a: Tile) => Math.hypot(a[0] - tile[0], a[1] - tile[1]);
  return ch.map((ks) => {
    if (ks.includes(kind)) return { kind, tile, here: true };
    let best: { kind: Kind; tile: Tile } | null = null;
    for (const k of ks) {
      const tiles = [...(l.byKind.get(k) ?? []), ...people.filter((p) => JOB_AT[k] && p.job === JOB_AT[k] && p.work).map((p) => p.work!)];
      for (const tl of tiles) if (!best || d(tl) < d(best.tile)) best = { kind: k, tile: tl };
    }
    return best ? { ...best, here: false } : { kind: ks[0]!, tile: null, here: false };
  });
}

/** What full stores give back — derived purely from the larder (never stored). */
export type Boons = { fed: boolean; varied: boolean; timber: boolean; surplus: boolean; food: number; health: number; wealth: number };
export const FED_MEALS = 2, FED_FOOD = 10, FED_HEALTH = 5, VARIED_HEALTH = 5, SURPLUS_WEALTH = 5;
const FINISHED: Ware[] = ["planks", "flour", "bread", "cheese"];
export function boonsOf(l: Larder): Boons {
  const fed = l.eaters > 0 && l.food >= l.eaters * FED_MEALS;
  const varied = l.flows.filter((f) => FOOD.includes(f.ware) && f.stock > 0).length >= 2;
  const timber = l.flows.some((f) => (f.ware === "planks" || f.ware === "log") && f.stock > 0);
  const surplus = l.flows.some((f) => FINISHED.includes(f.ware) && f.made > f.used && f.stock >= 10);
  return { fed, varied, timber, surplus, food: fed ? FED_FOOD : 0, health: (fed ? FED_HEALTH : 0) + (varied ? VARIED_HEALTH : 0), wealth: surplus ? SURPLUS_WEALTH : 0 };
}
