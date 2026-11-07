/**
 * Allmende (village commons): about once a week a resident brings a question about the shared wood,
 * oven or stream before the village. Which question comes is a pure function of the seed, its terrain
 * and its earlier answers; only the answer is stored (encounters table, mirrored by the DB encounter_guard).
 * Every answer leaves a visible trace on the map (pigs under the oaks, the bake-day queue, the footbridge).
 */
import { terrain, buildable, riverDistAt, hash, MAP, type Seed } from "./world";
import { pendingEncounter, historyDue, ENCOUNTER_FROM, COMMONS_KEYS, type Decision, type EventKey } from "./encounters";
import { worldHour, workDone, WORK_START, WORK_END } from "./time";
import { easterDay, realmDate } from "./feasts";
import { seasonAt } from "./season";
import type { Person, Job } from "./people";

export type CommonsKey = (typeof COMMONS_KEYS)[number];
/** Days between two commons questions (mirrored by the DB encounter_guard, with a small tolerance). */
export const COMMONS_DAYS = 7;
/** A village first meets the commons once it is this many hours old (a Weiler with a few families). */
export const COMMONS_FROM_H = 72;
/** The communal bake oven needs the village bakery (landmark age in growth hours). */
export const BAKERY_AGE = 360;
/** How long the pigs stay in the wood pasture and the bake day keeps its weekly date. */
export const MAST_DAYS = 7, BAKE_DAYS = 7;
/** Footbridge work: together a whole working day, the hired carpenter needs a third of it. */
export const STEG_WORK_H = 24, STEG_CARPENTER_H = 8;
/** Bake day hour (world clock): the neighbours queue at the oven for an hour. */
export const BAKE_HOUR = 10;

export const isCommons = (e: string): e is CommonsKey => (COMMONS_KEYS as readonly string[]).includes(e);

type Tile = [number, number];
const R_MIN = 4, R_MAX = 14;
const spotCache = new Map<string, { oak: Tile | null; steg: [Tile, Tile] | null; heath: Tile | null }>();
/** Terrain spots of a village for the commons (cached per seed position). */
function spots(s: Pick<Seed, "x" | "y">) {
  const key = `${s.x},${s.y}`;
  const hit = spotCache.get(key); if (hit) return hit;
  let oak: Tile | null = null, od = Infinity, steg: [Tile, Tile] | null = null, sd = Infinity, heath: Tile | null = null, hd = Infinity;
  for (let j = -R_MAX; j <= R_MAX; j++) for (let i = -R_MAX; i <= R_MAX; i++) {
    const d = Math.hypot(i, j); if (d < R_MIN || d > R_MAX) continue;
    const x = s.x + i, y = s.y + j; if (x < 2 || y < 2 || x >= MAP - 2 || y >= MAP - 2) continue;
    const t = terrain(x, y);
    // open sandy heath or hill grass on the outskirts, where sods could be cut (Geest), never on the shore
    if ((t === "sand" || t === "hill" || t === "grass") && d >= 7 && d < hd && riverDistAt(x, y) > 1 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => { const n = terrain(x + a!, y + b!); return n !== "water" && n !== "deep"; })) { hd = d; heath = [x, y]; }
    // old oaks at the wood's edge: a forest tile with open, buildable ground beside it
    if (t === "forest" && d < od && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const n = terrain(x + a!, y + b!); return n !== "forest" && buildable(n); })) { od = d; oak = [x, y]; }
    // a narrow river crossing: land, 1–3 river tiles in a straight line, land again
    if (buildable(t) && t !== "forest" && d < sd) for (const [a, b] of [[1, 0], [0, 1]] as const) {
      let k = 1; while (k <= 3 && terrain(x + a * k, y + b * k) === "water" && riverDistAt(x + a * k, y + b * k) < 0) k++;
      const ex = x + a * k, ey = y + b * k, et = terrain(ex, ey);
      if (k >= 2 && buildable(et) && et !== "forest") { sd = d; steg = [[x, y], [ex, ey]]; break; }
    }
  }
  const out = { oak, steg, heath };
  if (spotCache.size > 256) spotCache.clear();
  spotCache.set(key, out);
  return out;
}
/** The old oaks where the pigs go to mast, or null when the village has no wood nearby. */
export const oakSpot = (s: Pick<Seed, "x" | "y">) => spots(s).oak;
/** Both banks of the footbridge over the mill stream, or null without a narrow river nearby. */
export const stegSpot = (s: Pick<Seed, "x" | "y">) => spots(s).steg;
/** Open heath or hill grass at the edge of the village where sods (Plaggen) are cut, or null. */
export const heathSpot = (s: Pick<Seed, "x" | "y">) => spots(s).heath;

/** Growth hours from which the (water)mill stands — the mill dam needs it (world.ts LANDMARKS watermill). */
export const MILL_AGE = 168;
/** Realm month (1–12) of a moment; seasons of the village-life questions follow the realm calendar. */
const monthAt = (at: number) => realmDate(at)[1];
/** Days from the map's Whitsunday (negative = before). */
function fromPentecost(at: number): number {
  const [y, m, d] = realmDate(at);
  return Date.UTC(y, m - 1, d) / 864e5 - (easterDay(y) + 49);
}
/**
 * When a village-life question may be asked (at = window start): fences break when the summer corn
 * grows (Apr–Jul), the stubble quarrel comes at harvest (Jul–Sep), the Whitsun green in the week
 * before Whitsun, the spinning room in winter (Nov–Feb). The others can come any time of year.
 */
export function lifeSeason(key: CommonsKey, at: number): boolean {
  const m = monthAt(at);
  switch (key) {
    case "zaun": return m >= 4 && m <= 7;
    case "flur": return m >= 7 && m <= 9;
    case "pfingsten": { const p = fromPentecost(at); return p >= -6 && p <= 0; }
    case "lichtstube": return m >= 11 || m <= 2;
    default: return true;
  }
}

/** Commons questions this village can be asked now (terrain, bakery, footbridge not yet built). */
export function commonsOptions(s: Pick<Seed, "x" | "y">, decisions: Decision[], growthH: number, at?: number): CommonsKey[] {
  const out: CommonsKey[] = [];
  if (oakSpot(s)) out.push("hutewald");
  if (growthH >= BAKERY_AGE) out.push("backtag");
  if (stegSpot(s) && !decisions.some((d) => d.event === "steg")) out.push("steg");
  if (at == null) return out;
  // village life: everyday disputes and pastimes, in their season and only where the village has the place for them
  const life: CommonsKey[] = ["zaun", "flur", "schelte", "pfingsten", "lichtstube"];
  if (heathSpot(s)) life.push("plaggen");
  if (growthH >= MILL_AGE) life.push("scharwerk");
  for (const k of life) if (lifeSeason(k, at)) out.push(k);
  return out;
}

/**
 * The commons question due in the open encounter slot, or null. It is due when the last commons answer
 * is at least COMMONS_DAYS old at the window start, so an open question never changes while it waits.
 * Rotation: never the same question twice in a row, then a stable hashed pick.
 */
export function commonsDue(s: Seed, decisions: Decision[], growthH: number): CommonsKey | null {
  const c0 = Date.parse(s.created_at);
  const last = decisions.reduce((m, d) => d.event === "wedding" ? m : Math.max(m, d.at), -Infinity);
  const from = Number.isFinite(last) ? last : c0 + ENCOUNTER_FROM * 3.6e6;
  if ((from - c0) / 3.6e6 < COMMONS_FROM_H) return null;
  const past = decisions.filter((d) => isCommons(d.event)).sort((a, b) => a.at - b.at);
  const prev = past[past.length - 1];
  if (prev && from - prev.at < COMMONS_DAYS * 864e5) return null;
  const opts = commonsOptions(s, decisions, growthH, from).filter((k) => k !== prev?.event);
  if (!opts.length) return null;
  return opts[Math.floor(hash(c0 % 1e9, past.length, 1801) * opts.length)]!;
}

/** The open encounter including commons questions: a real wedding first, then the commons, then a visitor. */
export function pendingAll(s: Seed, decisions: Decision[], now: number, growthH: number): EventKey | null {
  const p = pendingEncounter(s, decisions, now);
  if (!p || p === "wedding") return p;
  return historyDue(s, decisions, now) ?? commonsDue(s, decisions, growthH) ?? p;
}

const latest = (decisions: Decision[], event: string, choice: string | null, now: number, ms: number) =>
  decisions.filter((d) => d.event === event && (choice === null || d.choice === choice) && d.at <= now && now - d.at < ms).pop() ?? null;
/** Pigs mast under the oaks for MAST_DAYS after the village allowed it. */
export const mastOn = (decisions: Decision[], now: number) => !!latest(decisions, "hutewald", "mast", now, MAST_DAYS * 864e5);
/** Today's bake-day gathering (start ms, world clock), or null: daily at BAKE_HOUR for BAKE_DAYS after the decision. */
export function bakeGathering(decisions: Decision[], now: number): number | null {
  const d = latest(decisions, "backtag", "bake", now, BAKE_DAYS * 864e5);
  if (!d) return null;
  const at = now - worldHour(now) * 3.6e6 + BAKE_HOUR * 3.6e6;
  return at >= d.at && now >= at && now < at + 3.6e6 ? at : null;
}
/** Footbridge: when the work started and when it stands (builders rest at night via workDone). */
export function stegOf(decisions: Decision[]): { at: number; done: number; together: boolean } | null {
  const d = decisions.find((x) => x.event === "steg");
  if (!d) return null;
  const together = d.choice !== "carpenter";
  return { at: d.at, done: workDone(d.at, (together ? STEG_WORK_H : STEG_CARPENTER_H) * 3.6e6), together };
}

const ASKER: Record<CommonsKey, Job[]> = {
  hutewald: ["farmer", "hunter", "woodcutter"], backtag: ["baker", "homemaker", "miller"], steg: ["miller", "builder", "farmer"],
  zaun: ["farmer"], flur: ["farmer"], plaggen: ["farmer"], schelte: ["homemaker", "farmer", "worker"], scharwerk: ["miller"],
  pfingsten: ["innkeeper", "farmer"], lichtstube: ["homemaker", "farmer"],
};
/** The second party named in the question (the neighbour, the accused…), by trade. */
const OTHER: Partial<Record<CommonsKey, Job[]>> = { zaun: ["farmer"], flur: ["farmer", "homemaker"], schelte: ["homemaker", "farmer", "worker"] };
/**
 * Who brings the question (a real resident by trade) and who counsels the village: the herb-wife or
 * healer as the community's wise woman, else the eldest. Stable for one question (hashed on the count).
 */
export function commonsVoices(key: CommonsKey, people: Person[], n: number): { asker: Person | null; other: Person | null; advisor: Person | null; herb: boolean } {
  const adults = people.filter((p) => p.role !== "mayor" && p.role !== "guest" && p.age >= 18 && !p.sick);
  let asker: Person | null = null;
  for (const j of ASKER[key]) { const l = adults.filter((p) => p.job === j); if (l.length) { asker = l[Math.floor(hash(n, l.length, 1811) * l.length)]!; break; } }
  asker ??= adults.length ? adults[Math.floor(hash(n, adults.length, 1812) * adults.length)]! : null;
  let other: Person | null = null;
  const oj = OTHER[key];
  if (oj) {
    // never the asker's own household: a quarrel is between neighbours
    const pool = adults.filter((p) => p !== asker && (!asker || p.home[0] !== asker.home[0] || p.home[1] !== asker.home[1]));
    for (const j of oj) { const l = pool.filter((p) => p.job === j); if (l.length) { other = l[Math.floor(hash(n, l.length, 1813) * l.length)]!; break; } }
    other ??= pool.length ? pool[Math.floor(hash(n, pool.length, 1814) * pool.length)]! : null;
  }
  const wise = adults.filter((p) => p !== asker && p !== other && (p.job === "herbalist" || p.job === "healer")).sort((a, b) => (a.sex === "f" ? 0 : 1) - (b.sex === "f" ? 0 : 1) || b.age - a.age)[0];
  const advisor = wise ?? adults.filter((p) => p !== asker && p !== other).sort((a, b) => b.age - a.age)[0] ?? null;
  return { asker, other, advisor, herb: !!wise };
}
/** Counsel variant: 0 in spring/summer, 1 in autumn/winter. */
export function adviceIdx(now: number): 0 | 1 {
  const w = seasonAt(now);
  return w.autumn + w.winter > w.spring + w.summer ? 1 : 0;
}

/** Price of an encounter answer for this village: the bake day is free at the own Gemeindebackhaus (mirrored by DB encounter_guard). */
export const bakeCost = (s: Pick<Seed, "bought">, event: string, choice: string, cost: number) =>
  event === "backtag" && choice === "bake" && s.bought?.some((b) => b.item === "backhaus") ? 0 : cost;

/**
 * What a village-life answer looks like on the map: who gathers where, from which realm hour and how long.
 * The scene starts at `hour` on the day of the decision (or the next day once that hour has passed).
 */
export type LifePlace = "field" | "meet" | "church" | "mill" | "oven" | "wood" | "heath";
export type LifeScene = { place: LifePlace; hour: number; h: number; share: number; work?: boolean; who?: "young" | "women" | "spinners" | "builders" };
export const LIFE_SCENES: Record<string, LifeScene> = {
  "zaun:buss": { place: "field", hour: 9, h: 2, share: 0.06, work: true },
  "zaun:holz": { place: "field", hour: 9, h: 3, share: 0.2, work: true, who: "builders" },
  "zaun:pfand": { place: "field", hour: 10, h: 1, share: 0.1 },
  "flur:schau": { place: "field", hour: 10, h: 1, share: 0.25 },
  "flur:hilfe": { place: "field", hour: 14, h: 3, share: 0.35, work: true, who: "young" },
  "plaggen:mass": { place: "meet", hour: 18, h: 1, share: 0.3 },
  "plaggen:laub": { place: "wood", hour: 9, h: 3, share: 0.12, work: true },
  "schelte:widerruf": { place: "church", hour: 11, h: 1, share: 0.5 },
  "schelte:spende": { place: "church", hour: 11, h: 1, share: 0.15 },
  "scharwerk:aufgebot": { place: "mill", hour: WORK_START, h: WORK_END - WORK_START, share: 0.35, work: true },
  "scharwerk:dingen": { place: "mill", hour: WORK_START, h: WORK_END - WORK_START, share: 0.3, work: true, who: "builders" },
  "pfingsten:preis": { place: "meet", hour: 15, h: 4, share: 0.55 },
  "pfingsten:reigen": { place: "meet", hour: 15, h: 3, share: 0.45 },
  "lichtstube:reigen": { place: "oven", hour: 18, h: 3, share: 0.4, who: "young" },
  "lichtstube:andacht": { place: "oven", hour: 18, h: 2, share: 0.35, who: "spinners" },
};
/** Village-life scenes playing now: the decision, its scene and start (ms). Pure from decisions + realm clock. */
export function lifeScenes(decisions: Decision[], now: number): { d: Decision; sc: LifeScene; at: number }[] {
  const out: { d: Decision; sc: LifeScene; at: number }[] = [];
  for (const d of decisions) {
    if (d.at > now || now - d.at > 2 * 864e5) continue;
    const sc = LIFE_SCENES[`${d.event}:${d.choice}`]; if (!sc) continue;
    let at = d.at - worldHour(d.at) * 3.6e6 + sc.hour * 3.6e6;
    if (at < d.at) at += 864e5;
    if (now >= at && now < at + sc.h * 3.6e6) out.push({ d, sc, at });
  }
  return out;
}
