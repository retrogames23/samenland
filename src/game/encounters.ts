import { weddingLive } from "./weddings";
import type { Seed } from "./world";
/**
 * Daily encounters ("Schulzen-Entscheidungen"): which encounter a village meets on a UTC day is a pure
 * function of (seed id, day); only the chosen answer is stored. Effects are temporary boons derived from
 * the decision timestamp, so every client computes the same bonuses. Costs mirror the database guard.
 */
export type Effect = { h?: number; growth?: number; food?: number; health?: number; wealth?: number };
export type Choice = { cost: number; fx: Effect };
export const ENCOUNTERS = {
  journeyman: { host: { cost: 30, fx: { h: 72, growth: 0.15 } }, settle: { cost: 80, fx: { h: 168, growth: 0.08, wealth: 5 } }, pass: { cost: 0, fx: {} } },
  merchant: { market: { cost: 50, fx: { h: 48, wealth: 15 } }, inn: { cost: 20, fx: { h: 48, health: 5, wealth: 5 } }, pass: { cost: 0, fx: {} } },
  boundary: { common: { cost: 0, fx: { h: 72, health: 10 } }, award: { cost: -20, fx: {} }, tavern: { cost: 10, fx: { h: 72, health: 8, wealth: 5 } } },
  ruin: { shrine: { cost: 60, fx: { h: 120, growth: 0.1, health: 5 } }, stones: { cost: 0, fx: { h: 48, wealth: 5 } } },
  harvest: { feast: { cost: 40, fx: { h: 48, food: 10, health: 10 } }, store: { cost: 0, fx: { h: 96, food: 15 } } },
  healer: { invite: { cost: 35, fx: { h: 96, health: 15 } }, pass: { cost: 0, fx: {} } },
  minstrel: { play: { cost: 15, fx: { h: 48, health: 5, wealth: 5 } }, pass: { cost: 0, fx: {} } },
  widow: { shelter: { cost: 40, fx: { h: 168, growth: 0.06 } }, alms: { cost: 10, fx: { h: 48, health: 5 } }, pass: { cost: 0, fx: {} } },
  monk: { teach: { cost: 25, fx: { h: 96, food: 10 } }, copy: { cost: 45, fx: { h: 120, growth: 0.08 } }, pass: { cost: 0, fx: {} } },
  storm: { repair: { cost: 30, fx: { h: 72, health: 10 } }, together: { cost: 0, fx: { h: 48, health: 5 } } },
  wolf: { fence: { cost: 35, fx: { h: 120, food: 10 } }, hunter: { cost: 20, fx: { h: 72, food: 5, wealth: 5 } }, wait: { cost: 0, fx: {} } },
  wedding: { gift: { cost: 25, fx: { h: 72, health: 10, wealth: 5 } }, feast: { cost: 60, fx: { h: 120, growth: 0.1, health: 5 } }, congrat: { cost: 0, fx: { h: 24, health: 3 } } },
  bees: { hive: { cost: 15, fx: { h: 168, food: 8 } }, leave: { cost: 0, fx: {} } },
  surveyor: { guide: { cost: 0, fx: { h: 48, wealth: 5 } }, map: { cost: 40, fx: { h: 168, growth: 0.05 } } },
  pilgrims: { lodge: { cost: 30, fx: { h: 72, wealth: 10 } }, water: { cost: 0, fx: { h: 24, health: 3 } } },
  orphan: { adopt: { cost: 20, fx: { h: 168, growth: 0.05, health: 5 } }, apprentice: { cost: 0, fx: { h: 96, wealth: 5 } } },
  tinker: { mend: { cost: 15, fx: { h: 72, wealth: 8 } }, scrap: { cost: -15, fx: {} }, pass: { cost: 0, fx: {} } },
  well: { dig: { cost: 50, fx: { h: 168, health: 15 } }, dowser: { cost: 15, fx: { h: 72, health: 8 } } },
  fair: { stall: { cost: 40, fx: { h: 96, wealth: 15 } }, visit: { cost: 10, fx: { h: 48, health: 8 } }, stay: { cost: 0, fx: {} } },
  cow: { show: { cost: 10, fx: { h: 72, wealth: 8 } }, sell: { cost: -30, fx: {} }, keep: { cost: 0, fx: { h: 96, food: 8 } } },
  painter: { portrait: { cost: 45, fx: { h: 168, wealth: 10 } }, sign: { cost: 15, fx: { h: 72, wealth: 5 } }, pass: { cost: 0, fx: {} } },
  flood: { dam: { cost: 40, fx: { h: 120, food: 12 } }, meadow: { cost: 0, fx: { h: 72, food: 5 } } },
  tithe: { pay: { cost: 25, fx: { h: 168, health: 5, wealth: 5 } }, bargain: { cost: 10, fx: {} }, plead: { cost: 0, fx: {} } },
  nursery: { cherry: { cost: 40, fx: { h: 168, health: 5 } }, quince: { cost: 35, fx: { h: 168, food: 8 } }, pass: { cost: 0, fx: {} } },
  maypole: { pole: { cost: 20, fx: { h: 96, health: 10 } }, games: { cost: 0, fx: { h: 48, health: 5 } } },
} as const satisfies Record<string, Record<string, Choice>>;
export type EventKey = keyof typeof ENCOUNTERS;
/**
 * Rotating visitors; "wedding" only appears while a real village wedding takes place.
 * "flood" is retired (kept for old decisions' boons): floods are a visible disaster in disasters.ts, never a text-only encounter.
 */
export const EVENT_KEYS = (Object.keys(ENCOUNTERS) as EventKey[]).filter((k) => k !== "wedding" && k !== "flood");
export type Decision = { event: string; choice: string; at: number; cost: number };

/** Villages meet their first visitor once they are this many hours old (3 minutes). */
export const ENCOUNTER_FROM = 0.05;
const DAY = 86400000;
export const dayOf = (t: number) => Math.floor(t / DAY);
/** Hours between two encounters, by village age: brisk at first, calmer later. Mirrored by the DB encounter_guard. */
export function encounterGap(ageH: number) {
  return ageH < 48 ? 2.5 : ageH < 14 * 24 ? 4 : 6;
}

function strHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}
/** The village's n-th encounter: cycles through a per-village shuffled order, never the same one twice in a row. */
export function eventOf(seedId: string, n: number): EventKey {
  const k = EVENT_KEYS.length;
  const order = (round: number) => [...EVENT_KEYS].sort((p, q) => strHash(`${seedId}:${round}:${p}`) - strHash(`${seedId}:${round}:${q}`));
  const round = Math.floor(n / k), i = ((n % k) + k) % k, o = order(round);
  if (o[0] === order(round - 1)[k - 1]) [o[0], o[1]] = [o[1]!, o[0]!];
  return o[i]!;
}
export const choicesOf = (e: EventKey) => Object.keys(ENCOUNTERS[e]) as string[];
export const choiceOf = (e: string, c: string): Choice | undefined => (ENCOUNTERS as Record<string, Record<string, Choice>>)[e]?.[c];

/**
 * Open encounter, or null when too young or the last decision is more recent than the gap.
 * At most one is ever open — encounters never pile up while nobody watches.
 */
export function pendingEncounter(seed: Pick<Seed, "id" | "created_at"> & Partial<Seed>, decisions: Decision[], now: number): EventKey | null {
  const ageH = (now - Date.parse(seed.created_at)) / 3.6e6;
  if (ageH < ENCOUNTER_FROM) return null;
  // a real wedding (weddings.ts calendar) is answered once, regardless of the visitor rhythm
  // in a village every wedding calls the mayor; in a town only the council weddings (WedDate.grand)
  const w = weddingLive(seed as Seed, now);
  if (w && w.grand && !decisions.some((d) => d.event === "wedding" && d.at >= w.at)) return "wedding";
  const last = decisions.reduce((m, d) => d.event === "wedding" ? m : Math.max(m, d.at), -Infinity);
  if ((now - last) / 3.6e6 < encounterGap(ageH)) return null;
  return eventOf(seed.id, decisions.filter((d) => d.event !== "wedding").length);
}

/** Sum of attribute boons active at `now`. */
export function activeBoons(decisions: Decision[], now: number) {
  const r = { food: 0, health: 0, wealth: 0 };
  for (const d of decisions) {
    const fx = choiceOf(d.event, d.choice)?.fx;
    if (!fx?.h || d.at > now || now - d.at >= fx.h * 3.6e6) continue;
    r.food += fx.food ?? 0; r.health += fx.health ?? 0; r.wealth += fx.wealth ?? 0;
  }
  return r;
}
/** Extra growth hours accumulated from encounter boons (monotonic, like the blessing). */
export function boonHours(decisions: Decision[], now: number) {
  let h = 0;
  for (const d of decisions) {
    const fx = choiceOf(d.event, d.choice)?.fx;
    if (!fx?.growth || !fx.h || d.at > now) continue;
    h += Math.min(now - d.at, fx.h * 3.6e6) / 3.6e6 * fx.growth;
  }
  return h;
}

/** Rare tree kinds a nurseryman encounter grants (one sapling per decision; mirrored by DB sapling_guard). */
export const SAPLINGS = ["cherry", "quince"] as const;
export type Sapling = (typeof SAPLINGS)[number];
/** Saplings bought but not yet planted: purely derived from decisions minus planted rows. */
export function saplingsOwed(decisions: { event: string; choice: string }[], planted: { kind: string }[]): Sapling[] {
  const out: Sapling[] = [];
  for (const k of SAPLINGS) {
    const n = decisions.filter((d) => d.event === "nursery" && d.choice === k).length - planted.filter((p) => p.kind === k).length;
    for (let i = 0; i < n; i++) out.push(k);
  }
  return out;
}

/** Visitors who stand at the village square: while their encounter waits for the mayor, and GUEST_H hours after a welcoming answer. */
export const GUEST_EVENTS: ReadonlySet<string> = new Set(["journeyman", "merchant", "healer", "minstrel", "widow", "monk", "surveyor", "pilgrims", "orphan", "tinker", "painter", "nursery"]);
export const GUEST_H = 4;
/** The visitor currently in the village (pure in decisions + clock): arrival time, departure, and whether they were welcomed. */
export function guestNow(seed: Pick<Seed, "id" | "created_at"> & Partial<Seed>, decisions: Decision[], now: number): { event: EventKey; at: number; until: number } | null {
  const p = pendingEncounter(seed, decisions, now);
  const vis = decisions.filter((d) => d.event !== "wedding" && d.at <= now);
  const last = vis.reduce<Decision | null>((m, d) => (!m || d.at > m.at ? d : m), null);
  if (p && p !== "wedding" && GUEST_EVENTS.has(p)) {
    const c0 = Date.parse(seed.created_at);
    const at = last ? last.at + encounterGap((last.at - c0) / 3.6e6) * 3.6e6 : c0 + ENCOUNTER_FROM * 3.6e6;
    return { event: p, at: Math.min(at, now), until: Infinity };
  }
  if (last && GUEST_EVENTS.has(last.event) && last.choice !== "pass" && now - last.at < GUEST_H * 3.6e6)
    return { event: last.event as EventKey, at: last.at - 1800e3, until: last.at + GUEST_H * 3.6e6 };
  return null;
}
/** Days a raised maypole stands on the village square. */
export const MAYPOLE_DAYS = 30;
export const maypoleUp = (decisions: Decision[], now: number) => decisions.some((d) => d.event === "maypole" && d.choice === "pole" && d.at <= now && now - d.at < MAYPOLE_DAYS * 864e5);
/** Cows from the cow encounter: a kept cow stays for good, a show cow for two days. */
export const cowsOf = (decisions: Decision[], now: number) => decisions.filter((d) => d.event === "cow" && d.at <= now && (d.choice === "keep" || (d.choice === "show" && now - d.at < 48 * 3.6e6))).length;
