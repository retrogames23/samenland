import { labEvent } from "./lab-ctl";
/**
 * Weddings: a pure calendar per village. The first comes on day 2; afterwards the gap shrinks with
 * the number of residents and shortens further with prosperity and food crafts ("good times to marry").
 * Calendar and dowries are mirrored by the database function village_weddings, so the treasury and
 * the encounter guard stay tamper-proof. Which villagers marry is derived in people.ts — nothing is stored.
 */
import { stepsDone, careHealthExtra, type Seed } from "./world";
import { gemeinwesenGate } from "./gemeinwesen";
import { feastOn } from "./feasts";
import { isSunday } from "./time";
import { civicWealth } from "./prosperity";
import { FOOD_CRAFTS } from "./food-crafts";

export const WED_FIRST = 2 * 864e5;
/** Gap in days at WED_REF_POP residents; scales with sqrt(WED_REF_POP / pop), clamped to [WED_MIN, WED_MAX]. */
export const WED_BASE_DAYS = 9, WED_REF_POP = 40, WED_MIN = 2, WED_MAX = 20;
/** Prosperity above 40 shortens the gap by up to 25 % (full at 80); each food craft by 4 %. */
export const WED_WEALTH_CUT = 0.25, WED_FOOD_CUT = 0.04;
/** Residents counted for the rhythm are capped by the care gate: a neglected village stays a village. */
export const WED_POP_CAP = [84, 84, 84, 150, 260] as const;
/** Dowry paid into the treasury: 20 Mark plus 0.6 per prosperity point (35 in a plain village, 80 at 100). */
export const dowryAt = (wealth: number) => Math.floor(20 + wealth * 0.6);
/** Legacy constant: dowry of a plain young village (prosperity 25). */
export const DOWRY = dowryAt(25);
/** Wedding joy lasts one day after a great (village-wide) wedding. */
export const WED_JOY = 864e5;
/** Prosperity bonus per craft/food alliance, and its cap. */
export const ALLIANCE_WEALTH = 3, ALLIANCE_MAX = 15;
/** In towns only every WED_NOTABLE-th wedding is a council wedding the whole town hears about. */
export const WED_NOTABLE = 5;

const FOOD: readonly string[] = FOOD_CRAFTS, HEALTH_LEGACY = ["herbs", "healer"];
const NEED: [number, number][] = [[1, 0], [2, 1], [3, 2]];

/**
 * Hochzeitspaket (end of the double bookkeeping): weddings at or after weddingSwitchSince(realm) — checked against the
 * wedding's own instant, never against a purchase date — use the unified rule and exist for money only as
 * wedding_receipts written by the trusted server; the database no longer computes them (DB wedding_switch_since,
 * village_wedding_book, village_weddings). Weddings before it keep the legacy rule, which DB village_wedding_list
 * mirrors exactly (wedding-parity.pg.test.ts), so no booked dowry, index or instant changes in hindsight.
 * Both dates stay on the safe placeholder until Stephan releases the switch (lab first, then the public maps).
 */
export const WEDDING_SWITCH_LAB_SINCE = Date.UTC(2100, 0, 4);
export const WEDDING_SWITCH_SINCE = Date.UTC(2100, 0, 4);
export const weddingSwitchSince = (realm: string | null | undefined) =>
  realm === "lab" ? WEDDING_SWITCH_LAB_SINCE : WEDDING_SWITCH_SINCE;
/** Receipt version: 1 = legacy rule (before the switch), 2 = unified rule (from the switch). */
export const wedRuleVersion = (s: Seed, t: number) => (t >= weddingSwitchSince(s.realm) ? 2 : 1);

/** Health side of the wedding rhythm at `t`. Legacy: herb hut and healer only (mirrored by DB village_wedding_list).
 *  OPEN DESIGN QUESTION (Masterplan v6.2 11.3): the unified branch below is the package's proposal, not a decision.
 *  Unified (from the switch): exactly the care gate's Gemeinwesen count — gemeinwesenGate (the five Gemeinwesen from
 *  gemeinwesenSince, before that herb hut, healer, library) plus careHealthExtra (finished Dom step 3, finished
 *  university step 3, Klostergarten paid step 2 without herb hut), the same terms careStage uses in world.ts.
 *  The food side stays FOOD_CRAFTS on purpose (one money-bearing food list; CARE_FOOD is the broader care list). */
export function wedHealth(s: Seed, t: number, own: Set<string>) {
  if (t < weddingSwitchSince(s.realm)) return HEALTH_LEGACY.filter((i) => own.has(i)).length;
  return gemeinwesenGate(s.realm, own, t) + careHealthExtra(s, t, own);
}

/** Raw era from real hours, capped by the care gate (food crafts and wedHealth). */
export function wedStage(s: Seed, t: number) {
  const h = Math.max(0, (t - Date.parse(s.created_at)) / 3.6e6);
  const raw = [24, 168, 2160, 4380, 8760].filter((a) => h >= a).length;
  if (!s.user_id) return raw;
  const own = new Set((s.bought ?? []).filter((b) => b.at <= t).map((b) => b.item));
  const f = FOOD.filter((i) => own.has(i)).length;
  // the health count is only needed once food would lift the stage (keeps monument chains out of plain villages)
  if (f < 2) return Math.min(raw, f >= 1 ? 3 : 2);
  const hl = wedHealth(s, t, own);
  let st = 2;
  for (const [nf, nh] of NEED) { if (f >= nf && hl >= nh) st++; else break; }
  return Math.min(raw, st);
}
/** Residents the rhythm counts (same formula as popAt in economy.ts), capped by the care gate. */
export function wedPop(s: Seed, t: number) {
  const h = Math.max(0, (t - Date.parse(s.created_at)) / 3.6e6);
  const r = 1.6 + 0.18 * Math.sqrt(h) + 3 * Math.log(1 + h / 60);
  const p = Math.floor(3 + 0.9 * Math.pow(r, 1.6));
  const st = wedStage(s, t);
  return st >= 5 ? p : Math.min(p, WED_POP_CAP[st]!);
}
/** Hours until the next wedding after one at `t` (whole hours, mirrored in SQL). */
export function wedGapHours(s: Seed, t: number) {
  const pop = wedPop(s, t), w = civicWealth(s, t);
  const own = new Set((s.bought ?? []).filter((b) => b.at <= t).map((b) => b.item));
  const f = FOOD.filter((i) => own.has(i)).length;
  const days = Math.min(WED_MAX, Math.max(WED_MIN, WED_BASE_DAYS * Math.sqrt(WED_REF_POP / Math.max(10, pop))));
  const cut = (1 - WED_WEALTH_CUT * Math.min(1, Math.max(0, (w - 40) / 40))) * (1 - WED_FOOD_CUT * f);
  return Math.max(1, Math.floor(24 * days * cut + 0.5));
}

export type WedDate = { at: number; k: number; dowry: number; town: boolean; grand: boolean };
const cache = new Map<string, { list: WedDate[]; next: number }>();
/** From the switch, finished Dom/university steps feed the rhythm; their build chain reads blessings, decisions and aid,
 *  so those join the key — only for villages that bought such a step (all others keep today's cheap key). */
const MONUMENT_STAGE = /^(cathedral|university)\d$/;
const chainKey = (s: Seed) =>
  (s.bought ?? []).some((b) => MONUMENT_STAGE.test(b.item))
    ? `|${(s.blessed ?? []).join(",")}|${(s.decisions ?? []).map((d) => d.event + d.at).join(",")}|${(s.aid ?? []).join(",")}`
    : "";
const keyOf = (s: Seed) => `${s.id}|${s.realm ?? ""}|${s.created_at}|${s.user_id ?? ""}|${(s.bought ?? []).map((b) => b.item + "@" + b.at).join(",")}|${s.charter ? s.charter.path + s.charter.at : ""}|${(s.civicRoads ?? []).map((r) => r.at).join(",")}${chainKey(s)}`;
/** One step of the calendar: the wedding at `t` with index `k` and the instant of the next one. The rule itself
 *  (wedStage, wedPop, wedGapHours, dowryAt) is unchanged; the reference calendar and the anchored continuation
 *  (Paket A2) use exactly this step. */
function wedStep(s: Seed, t: number, k: number): { w: WedDate; next: number } {
  const town = wedStage(s, t) >= 3;
  return { w: { at: t, k, dowry: dowryAt(civicWealth(s, t)), town, grand: !town || k % WED_NOTABLE === WED_NOTABLE - 1 }, next: t + wedGapHours(s, t) * 3.6e6 };
}
type CalCache = { list: WedDate[]; next: number; k0: number };
/** Runs the cached calendar `c` up to `now`; returns the weddings up to `now` and the instant of the first one after it. */
function runCalendar(s: Seed, c: CalCache, now: number): { list: WedDate[]; next: number } {
  while (c.next <= now) {
    const { w, next } = wedStep(s, c.next, c.k0 + c.list.length);
    c.list.push(w);
    c.next = next;
  }
  let n = c.list.length;
  while (n > 0 && c.list[n - 1]!.at > now) n--;
  return { list: n === c.list.length ? c.list : c.list.slice(0, n), next: n < c.list.length ? c.list[n]!.at : c.next };
}
const cached = (key: string, init: () => CalCache) => {
  let c = cache.get(key) as CalCache | undefined;
  if (!c) { if (cache.size > 200) cache.clear(); c = init(); cache.set(key, c); }
  return c;
};
/** The pure calendar recomputed from the founding up to `now`, plus the instant of the next wedding after `now`.
 *  No admin-desk overrides. Paket A2: this is the reference for villages without a booked anchor and for the part
 *  of the calendar that is stable by construction (legacy rule before weddingSwitchSince, which only counts
 *  purchases dated at or before each wedding). From the first booked unified-rule receipt on, the trusted server
 *  continues from the anchor instead (weddingCalendarFrom), because later purchases (Gesellenherberge,
 *  Holzfällerlager, Handwerks-Freibrief) shorten monument build times in hindsight and would move booked weddings. */
export function weddingCalendarState(s: Seed, now: number): { list: WedDate[]; next: number } {
  const c = cached(keyOf(s), () => ({ list: [], next: Date.parse(s.created_at) + WED_FIRST, k0: 0 }));
  return runCalendar(s, c, now);
}
/** The pure calendar up to `now`, oldest first — recomputed from the founding (see weddingCalendarState). */
export function weddingCalendar(s: Seed, now: number): WedDate[] {
  return weddingCalendarState(s, now).list;
}
/** Paket A2: the last booked wedding receipt — its index, its instant and the instant of the next wedding as the trusted
 *  server computed it when booking (wedding_receipts.next_at). */
export type WeddingAnchor = { k: number; at: number; next: number };
/** Paket A2 (Anker-Fortsetzung): the weddings after the anchor up to `now` (indices anchor.k + 1, …; the first one at
 *  anchor.next) and the instant of the first one after `now`. Booked weddings are never recomputed: whatever changes
 *  later (buildings, supply, charters) only acts on weddings that are not booked yet. Same step and rule as the
 *  reference calendar. */
export function weddingCalendarFrom(s: Seed, anchor: WeddingAnchor, now: number): { list: WedDate[]; next: number } {
  const c = cached(`${keyOf(s)}#${anchor.k}@${anchor.at}>${anchor.next}`, () => ({ list: [], next: anchor.next, k0: anchor.k + 1 }));
  return runCalendar(s, c, now);
}
/** All weddings up to `now` for display and the client prognosis: the pure calendar plus the lab desk's test wedding. */
export function weddingDates(s: Seed, now: number): WedDate[] {
  const out = weddingCalendar(s, now);
  const lw = labEvent("wedding");
  if (lw && lw <= now && (s.user_id || s.realm === "lab") && (!out.length || out[out.length - 1]!.at < lw)) return [...out, { at: lw, k: out.length, dowry: 0, town: false, grand: true }];
  return out;
}
/** Times of all weddings up to `now` (real ms), oldest first. */
export const weddingTimes = (s: Seed, now: number): number[] => weddingDates(s, now).map((w) => w.at);
export const dowryEarned = (s: Seed, now: number) => weddingDates(s, now).reduce((a, w) => a + w.dowry, 0);
const lastOf = (s: Seed, now: number) => { const w = weddingDates(s, now); return w[w.length - 1]; };
/** Wedding joy: a day after a great wedding (in a village every one, in a town only council weddings). */
export const weddingJoy = (s: Seed, now: number) => { const l = lastOf(s, now); return !!l && (l.grand || stepsDone(s, "theater", now) >= 1) && now - l.at < WED_JOY; };
/**
 * Tanzhaus (finished steps only): 1 — every wedding is danced out, so each gives wedding joy, not only grand ones;
 * 2 — church feast days are danced too and count as joy days; 3 — the Sunday dance makes every Sunday a joy day.
 * Joy is the existing wedding-joy effect (no sickness that day, +10 health); no money, no residents, no login needed.
 */
export const festJoy = (s: Seed, now: number) => {
  if (weddingJoy(s, now)) return true;
  const n = s.bought?.length ? stepsDone(s, "theater", now) : 0;
  return (n >= 2 && feastOn(now) !== null) || (n >= 3 && isSunday(now));
};
/** Hours after a wedding begins during which the mayor may answer it (mirrored by DB encounter_guard). */
export const WED_WINDOW_H = 3;
/** The real wedding happening right now, or null. */
export function weddingLive(s: Seed, now: number): WedDate | null {
  const l = lastOf(s, now);
  return l && now - l.at < WED_WINDOW_H * 3.6e6 ? l : null;
}
/** Start of the wedding happening right now, or null. */
export const weddingNow = (s: Seed, now: number): number | null => weddingLive(s, now)?.at ?? null;
