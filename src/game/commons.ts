/**
 * Allmende (village commons): about once a week a resident brings a question about the shared wood,
 * oven or stream before the village. Which question comes is a pure function of the seed, its terrain
 * and its earlier answers; only the answer is stored (encounters table, mirrored by the DB encounter_guard).
 * Every answer leaves a visible trace on the map (pigs under the oaks, the bake-day queue, the footbridge).
 */
import { terrain, buildable, riverDistAt, hash, MAP, type Seed } from "./world";
import { pendingEncounter, historyDue, ENCOUNTER_FROM, COMMONS_KEYS, type Decision, type EventKey } from "./encounters";
import { worldHour, workDone } from "./time";
import { seasonAt } from "./season";
import type { Person, Job } from "./people";

export type CommonsKey = "hutewald" | "backtag" | "steg";
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
const spotCache = new Map<string, { oak: Tile | null; steg: [Tile, Tile] | null }>();
/** Terrain spots of a village for the commons (cached per seed position). */
function spots(s: Pick<Seed, "x" | "y">) {
  const key = `${s.x},${s.y}`;
  const hit = spotCache.get(key); if (hit) return hit;
  let oak: Tile | null = null, od = Infinity, steg: [Tile, Tile] | null = null, sd = Infinity;
  for (let j = -R_MAX; j <= R_MAX; j++) for (let i = -R_MAX; i <= R_MAX; i++) {
    const d = Math.hypot(i, j); if (d < R_MIN || d > R_MAX) continue;
    const x = s.x + i, y = s.y + j; if (x < 2 || y < 2 || x >= MAP - 2 || y >= MAP - 2) continue;
    const t = terrain(x, y);
    // old oaks at the wood's edge: a forest tile with open, buildable ground beside it
    if (t === "forest" && d < od && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const n = terrain(x + a!, y + b!); return n !== "forest" && buildable(n); })) { od = d; oak = [x, y]; }
    // a narrow river crossing: land, 1–3 river tiles in a straight line, land again
    if (buildable(t) && t !== "forest" && d < sd) for (const [a, b] of [[1, 0], [0, 1]] as const) {
      let k = 1; while (k <= 3 && terrain(x + a * k, y + b * k) === "water" && riverDistAt(x + a * k, y + b * k) < 0) k++;
      const ex = x + a * k, ey = y + b * k, et = terrain(ex, ey);
      if (k >= 2 && buildable(et) && et !== "forest") { sd = d; steg = [[x, y], [ex, ey]]; break; }
    }
  }
  const out = { oak, steg };
  if (spotCache.size > 256) spotCache.clear();
  spotCache.set(key, out);
  return out;
}
/** The old oaks where the pigs go to mast, or null when the village has no wood nearby. */
export const oakSpot = (s: Pick<Seed, "x" | "y">) => spots(s).oak;
/** Both banks of the footbridge over the mill stream, or null without a narrow river nearby. */
export const stegSpot = (s: Pick<Seed, "x" | "y">) => spots(s).steg;

/** Commons questions this village can be asked now (terrain, bakery, footbridge not yet built). */
export function commonsOptions(s: Pick<Seed, "x" | "y">, decisions: Decision[], growthH: number): CommonsKey[] {
  const out: CommonsKey[] = [];
  if (oakSpot(s)) out.push("hutewald");
  if (growthH >= BAKERY_AGE) out.push("backtag");
  if (stegSpot(s) && !decisions.some((d) => d.event === "steg")) out.push("steg");
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
  const opts = commonsOptions(s, decisions, growthH).filter((k) => k !== prev?.event);
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

const ASKER: Record<CommonsKey, Job[]> = { hutewald: ["farmer", "hunter", "woodcutter"], backtag: ["baker", "homemaker", "miller"], steg: ["miller", "builder", "farmer"] };
/**
 * Who brings the question (a real resident by trade) and who counsels the village: the herb-wife or
 * healer as the community's wise woman, else the eldest. Stable for one question (hashed on the count).
 */
export function commonsVoices(key: CommonsKey, people: Person[], n: number): { asker: Person | null; advisor: Person | null; herb: boolean } {
  const adults = people.filter((p) => p.role !== "mayor" && p.role !== "guest" && p.age >= 18 && !p.sick);
  let asker: Person | null = null;
  for (const j of ASKER[key]) { const l = adults.filter((p) => p.job === j); if (l.length) { asker = l[Math.floor(hash(n, l.length, 1811) * l.length)]!; break; } }
  asker ??= adults.length ? adults[Math.floor(hash(n, adults.length, 1812) * adults.length)]! : null;
  const wise = adults.filter((p) => p !== asker && (p.job === "herbalist" || p.job === "healer")).sort((a, b) => (a.sex === "f" ? 0 : 1) - (b.sex === "f" ? 0 : 1) || b.age - a.age)[0];
  const advisor = wise ?? adults.filter((p) => p !== asker).sort((a, b) => b.age - a.age)[0] ?? null;
  return { asker, advisor, herb: !!wise };
}
/** Counsel variant: 0 in spring/summer, 1 in autumn/winter. */
export function adviceIdx(now: number): 0 | 1 {
  const w = seasonAt(now);
  return w.autumn + w.winter > w.spring + w.summer ? 1 : 0;
}

/** Price of an encounter answer for this village: the bake day is free at the own Gemeindebackhaus (mirrored by DB encounter_guard). */
export const bakeCost = (s: Pick<Seed, "bought">, event: string, choice: string, cost: number) =>
  event === "backtag" && choice === "bake" && s.bought?.some((b) => b.item === "backhaus") ? 0 : cost;
