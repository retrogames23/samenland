import { weddingLive } from "./weddings";
import { seasonAt, type Season } from "./season";
import type { Seed } from "./world";
/**
 * Daily encounters ("Schulzen-Entscheidungen"): which encounter a village meets on a UTC day is a pure
 * function of (seed id, day); only the chosen answer is stored. Effects are temporary boons derived from
 * the decision timestamp, so every client computes the same bonuses. Costs mirror the database guard.
 */
/** Only real, derived effects: growth hours via boonHours; h also sets the orphan's stay (orphan.ts). */
export type Effect = { h?: number; growth?: number };
export type Choice = { cost: number; fx: Effect };
export const ENCOUNTERS = {
  journeyman: { host: { cost: 30, fx: { h: 72, growth: 0.15 } }, settle: { cost: 80, fx: { h: 168, growth: 0.08 } }, pass: { cost: 0, fx: {} } },
  merchant: { market: { cost: 0, fx: {} }, inn: { cost: 0, fx: {} }, pass: { cost: 0, fx: {} } },
  boundary: { common: { cost: 0, fx: {} }, award: { cost: -20, fx: {} }, tavern: { cost: 0, fx: {} } },
  ruin: { shrine: { cost: 60, fx: { h: 120, growth: 0.1 } }, stones: { cost: 0, fx: {} } },
  harvest: { feast: { cost: 0, fx: {} }, store: { cost: 0, fx: {} } },
  healer: { invite: { cost: 0, fx: {} }, pass: { cost: 0, fx: {} } },
  minstrel: { play: { cost: 0, fx: {} }, pass: { cost: 0, fx: {} } },
  widow: { shelter: { cost: 40, fx: { h: 168, growth: 0.06 } }, alms: { cost: 0, fx: {} }, pass: { cost: 0, fx: {} } },
  monk: { teach: { cost: 0, fx: {} }, copy: { cost: 45, fx: { h: 120, growth: 0.08 } }, pass: { cost: 0, fx: {} } },
  storm: { repair: { cost: 0, fx: {} }, together: { cost: 0, fx: {} } },
  wolf: { fence: { cost: 0, fx: {} }, hunter: { cost: 0, fx: {} }, wait: { cost: 0, fx: {} } },
  wedding: { gift: { cost: 0, fx: {} }, feast: { cost: 60, fx: { h: 120, growth: 0.1 } }, congrat: { cost: 0, fx: {} } },
  bees: { hive: { cost: 0, fx: {} }, leave: { cost: 0, fx: {} } },
  surveyor: { guide: { cost: 0, fx: {} }, map: { cost: 40, fx: { h: 168, growth: 0.05 } } },
  pilgrims: { lodge: { cost: 0, fx: {} }, water: { cost: 0, fx: {} } },
  orphan: { adopt: { cost: 20, fx: { h: 168, growth: 0.05 } }, apprentice: { cost: 0, fx: { h: 96 } } },
  tinker: { mend: { cost: 0, fx: {} }, scrap: { cost: -15, fx: {} }, pass: { cost: 0, fx: {} } },
  well: { dig: { cost: 0, fx: {} }, dowser: { cost: 0, fx: {} } },
  fair: { stall: { cost: 0, fx: {} }, visit: { cost: 0, fx: {} }, stay: { cost: 0, fx: {} } },
  cow: { show: { cost: 0, fx: {} }, sell: { cost: -30, fx: {} }, keep: { cost: 0, fx: {} } },
  painter: { portrait: { cost: 0, fx: {} }, sign: { cost: 0, fx: {} }, pass: { cost: 0, fx: {} } },
  flood: { dam: { cost: 0, fx: {} }, meadow: { cost: 0, fx: {} } },
  tithe: { pay: { cost: 0, fx: {} }, bargain: { cost: 0, fx: {} }, plead: { cost: 0, fx: {} } },
  nursery: { cherry: { cost: 0, fx: {} }, quince: { cost: 0, fx: {} }, pass: { cost: 0, fx: {} } },
  maypole: { pole: { cost: 0, fx: {} }, games: { cost: 0, fx: {} } },
  // Allmende questions (commons.ts): asked by residents about once a week, never drawn as visitors
  hutewald: { mast: { cost: 0, fx: {} }, wild: { cost: 0, fx: {} } },
  backtag: { bake: { cost: 0, fx: {} }, home: { cost: 0, fx: {} } },
  steg: { together: { cost: 0, fx: {} }, carpenter: { cost: 0, fx: {} } },
  // village life around 1500 (commons.ts LIFE): disputes, common work and pastimes, same weekly slot
  zaun: { buss: { cost: 0, fx: {} }, holz: { cost: 0, fx: {} }, pfand: { cost: 0, fx: {} } },
  flur: { schau: { cost: 0, fx: {} }, hilfe: { cost: 0, fx: {} } },
  plaggen: { mass: { cost: 0, fx: {} }, laub: { cost: 0, fx: {} } },
  schelte: { widerruf: { cost: 0, fx: {} }, spende: { cost: 0, fx: {} } },
  scharwerk: { aufgebot: { cost: 0, fx: {} }, dingen: { cost: 0, fx: {} } },
  pfingsten: { preis: { cost: 0, fx: {} }, reigen: { cost: 0, fx: {} } },
  lichtstube: { reigen: { cost: 0, fx: { h: 120, growth: 0.05 } }, andacht: { cost: 0, fx: {} } },
  besthaupt: { loesen: { cost: 0, fx: {} }, bitte: { cost: 0, fx: {} }, geben: { cost: 0, fx: {} } },
  schwarm: { teilen: { cost: 0, fx: {} }, korb: { cost: 0, fx: {} }, pfarrer: { cost: 0, fx: {} } },
  funken: { kalt: { cost: 0, fx: {} }, helfer: { cost: 0, fx: {} }, lehm: { cost: 0, fx: {} } },
  rotte: { kuhle: { cost: 0, fx: {} }, unten: { cost: 0, fx: {} }, bier: { cost: 0, fx: {} } },
  wolfspur: { treib: { cost: 0, fx: {} }, stall: { cost: 0, fx: {} }, fallen: { cost: 0, fx: {} } },
  frevel: { pflanz: { cost: 0, fx: {} }, pfand: { cost: 0, fx: {} }, warn: { cost: 0, fx: {} } },
  miete: { arbeit: { cost: 0, fx: {} }, korn: { cost: 0, fx: {} }, stein: { cost: 0, fx: {} } },
  // town life from Kleinstadt (commons.ts CITY): market police, guilds, beer, gate, watch; sea and Hanse from Handelsstadt
  brot: { busse: { cost: -10, fx: {} }, spital: { cost: 0, fx: {} } },
  stoerer: { zunft: { cost: 0, fx: {} }, dulden: { cost: -10, fx: { h: 96, growth: 0.03 } } },
  bier: { zoll: { cost: 0, fx: {} }, frei: { cost: -10, fx: {} } },
  torschluss: { zu: { cost: 0, fx: {} }, nachzoll: { cost: -8, fx: {} } },
  wache: { pflicht: { cost: 0, fx: {} }, loskauf: { cost: -15, fx: {} } },
  kaper: { geleit: { cost: 0, fx: {} }, selbst: { cost: 0, fx: {} } },
  gast: { streng: { cost: 0, fx: {} }, frei: { cost: 0, fx: { h: 96, growth: 0.04 } } },
  hansetag: { gefolge: { cost: 0, fx: {} }, vollmacht: { cost: 0, fx: {} } },
  strand: { berge: { cost: 0, fx: {} }, fischer: { cost: 0, fx: {} } },
  seuche: { absondern: { cost: 0, fx: {} }, offen: { cost: 0, fx: {} } },
  // historical news 1500/1501 (HISTORY below): dated, once per village, mirrored by DB encounter_guard
  werber: { fodder: { cost: 0, fx: {} }, quarter: { cost: 0, fx: {} } },
  weser: { carts: { cost: 0, fx: {} }, ransom: { cost: 0, fx: {} } },
  sund: { buy: { cost: 0, fx: {} }, shelter: { cost: 0, fx: {} }, pass: { cost: 0, fx: {} } },
  ablass: { give: { cost: 0, fx: {} }, sermon: { cost: 0, fx: {} } },
} as const satisfies Record<string, Record<string, Choice>>;
export type EventKey = keyof typeof ENCOUNTERS;
/**
 * Rotating visitors; "wedding" only appears while a real village wedding takes place.
 * "flood" is retired (kept for old decisions' boons): floods are a visible disaster in disasters.ts, never a text-only encounter.
 */
/** Commons questions (commons.ts) share the encounter slot but are never drawn as visitors. */
export const COMMONS_KEYS = ["hutewald", "backtag", "steg", "zaun", "flur", "plaggen", "schelte", "scharwerk", "pfingsten", "lichtstube", "besthaupt", "schwarm", "funken", "rotte", "wolfspur", "frevel", "miete", "brot", "stoerer", "bier", "torschluss", "wache", "kaper", "gast", "hansetag", "strand", "seuche"] as const;
/**
 * Historical news that reached a north German village 1500/1501, as real-calendar UTC windows
 * (game year = real year - YEAR_SHIFT, so 2026-11 is November 1500). Each comes once per village,
 * from HISTORY_FROM_H on, inside the visitor rhythm; mirrored by DB encounter_guard — change both together.
 */
export const HISTORY = [
  { key: "werber", from: Date.UTC(2026, 10, 6), to: Date.UTC(2027, 2, 1) },   // winter 1500/01: muster after Hemmingstedt
  { key: "weser", from: Date.UTC(2027, 4, 25), to: Date.UTC(2027, 9, 1) },    // 25 May–Sept 1501: league against Butjadingen/Stadland
  { key: "sund", from: Date.UTC(2027, 7, 1), to: Date.UTC(2027, 10, 1) },     // Aug–Oct 1501: Swedish revolt, Stockholm besieged
  { key: "ablass", from: Date.UTC(2027, 10, 15), to: Date.UTC(2028, 1, 1) },  // late 1501: Peraudi's indulgence preached
] as const;
export const HISTORY_KEYS = HISTORY.map((h) => h.key);
export const HISTORY_FROM_H = 24;
export const isHistory = (e: string) => (HISTORY_KEYS as readonly string[]).includes(e);
/** The dated news due now (not yet answered by this village), or null. */
export function historyDue(seed: Pick<Seed, "created_at">, decisions: Decision[], now: number): EventKey | null {
  if ((now - Date.parse(seed.created_at)) / 3.6e6 < HISTORY_FROM_H) return null;
  const h = HISTORY.find((w) => now >= w.from && now < w.to && !decisions.some((d) => d.event === w.key));
  return h ? h.key : null;
}
const NOT_DRAWN: ReadonlySet<string> = new Set(["wedding", "flood", ...COMMONS_KEYS, ...HISTORY.map((h) => h.key)]);
export const EVENT_KEYS = (Object.keys(ENCOUNTERS) as EventKey[]).filter((k) => !NOT_DRAWN.has(k));
/** `request`: the Ratsbuch request this row answers (encounters.request_id) — a guest, but never part of the visitor rhythm. */
export type Decision = { event: string; choice: string; at: number; cost: number; request?: string | null };

/**
 * Ratsbuch (M1 Paket 2b): from RATSBUCH_SINCE the six growth visitors no longer come through the lottery but as
 * requests in the council book (DB ratsbuch_requests, created lazily by ratsbuch_refresh). Mirrored by DB
 * ratsbuch_since() — change both together. Far future until Paket 4 sets the real cut-over (a Monday, 00:00 UTC).
 */
export const RATSBUCH_SINCE = Date.UTC(2100, 0, 4);
/** A visitor window opened before the cut-over keeps its old draw for this long (DB encounter_guard: 24 hours). */
export const RATSBUCH_GRACE = 24 * 3.6e6;
/** Growth visitors that ask via the Ratsbuch, with their request weight (= EVENT_WEIGHT; DB ratsbuch_kind). */
export const RATSBUCH_KINDS = ["journeyman", "orphan", "widow", "monk", "ruin", "surveyor"] as const satisfies readonly EventKey[];
/** At most this many growth boons are active at once, and at most this many requests wait (DB encounter_guard, ratsbuch_refresh). */
export const BOON_LIMIT = 6;
export const RATSBUCH_OPEN = 4;
/** The visitor lottery from the cut-over: the same visitors, weights, seasons and eras, without the six. */
export const EVENT_KEYS_RB: readonly EventKey[] = EVENT_KEYS.filter((k) => !(RATSBUCH_KINDS as readonly string[]).includes(k));

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
/** Base lottery weight: everyday visitors often, rare highlights seldom. */
export const EVENT_WEIGHT: Partial<Record<EventKey, number>> = {
  journeyman: 12, healer: 11, tinker: 10, orphan: 10, cow: 10, merchant: 11,
  monk: 7, pilgrims: 7, widow: 7, boundary: 6, well: 6, minstrel: 8, storm: 6, wolf: 6, bees: 6, harvest: 6, fair: 6, maypole: 6,
  painter: 3, surveyor: 3, nursery: 3, ruin: 3, tithe: 4,
};
/** Raw era from real age (mirrors STAGES thresholds in world.ts without importing it). */
const eraOfAge = (h: number) => (h >= 2160 ? 3 : h >= 168 ? 2 : h >= 24 ? 1 : 0);
/** Minimum era per encounter: no fair or painter for three huts. */
const MIN_ERA: Partial<Record<EventKey, number>> = { pilgrims: 1, boundary: 1, tithe: 1, fair: 2, surveyor: 2, painter: 2 };
/** Season multipliers (0 = never in that season). */
const SEASON_MUL: Partial<Record<EventKey, Partial<Record<Season, number>>>> = {
  maypole: { spring: 1.5, summer: 0, autumn: 0, winter: 0 },
  harvest: { spring: 0, winter: 0, summer: 1, autumn: 2 },
  bees: { spring: 2.5, summer: 1, autumn: 0.3, winter: 0 },
  nursery: { spring: 2.5, autumn: 1.5, summer: 0.5, winter: 0.2 },
  fair: { summer: 2, spring: 1, autumn: 1, winter: 0.3 },
  well: { summer: 2 },
  storm: { autumn: 2, winter: 1.5, summer: 0.7 },
  wolf: { winter: 3, autumn: 1.2, spring: 0.5, summer: 0.3 },
};
/** Recent encounters that cannot return yet. */
export const EVENT_COOLDOWN = 4;
export type EventCtx = { ageH: number; season: Season; recent: string[] };
/** Weight of an encounter in the given context (0 = impossible). */
export function eventWeight(e: EventKey, ctx: EventCtx) {
  if (eraOfAge(ctx.ageH) < (MIN_ERA[e] ?? 0)) return 0;
  if (ctx.recent.includes(e)) return 0;
  return (EVENT_WEIGHT[e] ?? 5) * (SEASON_MUL[e]?.[ctx.season] ?? 1);
}
const dominantSeason = (t: number): Season => {
  const w = seasonAt(t);
  return (Object.keys(w) as Season[]).reduce((a, b) => (w[b] > w[a] ? b : a));
};
/** The village's n-th encounter: weighted pseudo-random draw from (seed id, n), filtered by era, season and the last few events. */
export function eventOf(seedId: string, n: number, ctx: EventCtx = { ageH: 1e6, season: "summer", recent: [] }, keys: readonly EventKey[] = EVENT_KEYS): EventKey {
  const opts = keys.map((e) => [e, eventWeight(e, ctx)] as const).filter(([, w]) => w > 0);
  const pool = opts.length ? opts : keys.map((e) => [e, 1] as const);
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = strHash(`${seedId}:draw:${n}`) * total;
  for (const [e, w] of pool) { r -= w; if (r < 0) return e; }
  return pool[pool.length - 1]![0];
}
export const choicesOf = (e: EventKey) => Object.keys(ENCOUNTERS[e]) as string[];
export const choiceOf = (e: string, c: string): Choice | undefined => (ENCOUNTERS as Record<string, Record<string, Choice>>)[e]?.[c];

/**
 * Open encounter, or null when too young or the last decision is more recent than the gap.
 * At most one is ever open — encounters never pile up while nobody watches.
 */
export function pendingEncounter(seed: Pick<Seed, "id" | "created_at"> & Partial<Seed>, decisions: Decision[], now: number, since = RATSBUCH_SINCE): EventKey | null {
  const ageH = (now - Date.parse(seed.created_at)) / 3.6e6;
  if (ageH < ENCOUNTER_FROM) return null;
  // a real wedding (weddings.ts calendar) is answered once, regardless of the visitor rhythm
  // in a village every wedding calls the mayor; in a town only the council weddings (WedDate.grand)
  const w = weddingLive(seed as Seed, now);
  if (w && w.grand && !decisions.some((d) => d.event === "wedding" && d.at >= w.at)) return "wedding";
  // Ratsbuch rows (request) never move the visitor rhythm: not in the gap, the window start or the draw count
  const last = decisions.reduce((m, d) => d.event === "wedding" || d.request ? m : Math.max(m, d.at), -Infinity);
  if ((now - last) / 3.6e6 < encounterGap(ageH)) return null;
  // context is anchored at the window start, so the open encounter never changes while it waits
  // commons answers keep the visitor rhythm (gap) but not the visitor lottery, so visitor draws stay stable
  const past = decisions.filter((d) => d.event !== "wedding" && !d.request && !(COMMONS_KEYS as readonly string[]).includes(d.event) && !isHistory(d.event)).sort((a, b) => a.at - b.at);
  const c0 = Date.parse(seed.created_at), from = past.length ? last : c0 + ENCOUNTER_FROM * 3.6e6;
  const ctx = { ageH: (from - c0) / 3.6e6, season: dominantSeason(from), recent: past.slice(-EVENT_COOLDOWN).map((d) => d.event) };
  // from the cut-over the six growth visitors are drawn no more; a window opened before keeps its draw RATSBUCH_GRACE long
  return eventOf(seed.id, past.length, ctx, from >= since || now >= since + RATSBUCH_GRACE ? EVENT_KEYS_RB : EVENT_KEYS);
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
export const GUEST_EVENTS: ReadonlySet<string> = new Set(["journeyman", "merchant", "healer", "minstrel", "widow", "monk", "surveyor", "pilgrims", "orphan", "tinker", "painter", "nursery", "werber", "weser", "sund", "ablass"]);
export const GUEST_H = 4;
/** The visitor currently in the village (pure in decisions + clock): arrival time, departure, and whether they were welcomed. */
export function guestNow(seed: Pick<Seed, "id" | "created_at"> & Partial<Seed>, decisions: Decision[], now: number): { event: EventKey; at: number; until: number } | null {
  const p0 = pendingEncounter(seed, decisions, now);
  const p = p0 && p0 !== "wedding" ? historyDue(seed, decisions, now) ?? p0 : p0;
  const vis = decisions.filter((d) => d.event !== "wedding" && d.at <= now);
  const last = vis.reduce<Decision | null>((m, d) => (!m || d.at > m.at ? d : m), null);
  if (p && p !== "wedding" && GUEST_EVENTS.has(p)) {
    const c0 = Date.parse(seed.created_at);
    // the waiting visitor arrived one gap after the last visitor answer (Ratsbuch guests keep their own place)
    const lv = vis.reduce<Decision | null>((m, d) => (d.request ? m : !m || d.at > m.at ? d : m), null);
    const at = lv ? lv.at + encounterGap((lv.at - c0) / 3.6e6) * 3.6e6 : c0 + ENCOUNTER_FROM * 3.6e6;
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
