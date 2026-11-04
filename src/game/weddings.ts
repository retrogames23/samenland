/**
 * Weddings: a pure calendar per village. The first comes on day 2; afterwards the gap shrinks with
 * the number of residents and shortens further with prosperity and food crafts ("good times to marry").
 * Calendar and dowries are mirrored by the database function village_weddings, so the treasury and
 * the encounter guard stay tamper-proof. Which villagers marry is derived in people.ts — nothing is stored.
 */
import type { Seed } from "./world";
import { civicWealth } from "./prosperity";

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

const FOOD = ["fisher", "hunter", "granary", "dairy", "markethall", "guildhall"], HEALTH = ["herbs", "healer"];
const NEED: [number, number][] = [[1, 0], [2, 1], [3, 2]];

/** Raw era from real hours, capped by the care gate (mirrors careStage without world.ts). */
export function wedStage(s: Seed, t: number) {
  const h = Math.max(0, (t - Date.parse(s.created_at)) / 3.6e6);
  const raw = [24, 168, 2160, 4380, 8760].filter((a) => h >= a).length;
  if (!s.user_id) return raw;
  const own = new Set((s.bought ?? []).filter((b) => b.at <= t).map((b) => b.item));
  const f = FOOD.filter((i) => own.has(i)).length, hl = HEALTH.filter((i) => own.has(i)).length;
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
const keyOf = (s: Seed) => `${s.id}|${s.created_at}|${s.user_id ?? ""}|${(s.bought ?? []).map((b) => b.item + "@" + b.at).join(",")}|${s.charter ? s.charter.path + s.charter.at : ""}|${(s.civicRoads ?? []).map((r) => r.at).join(",")}`;
/** All weddings up to `now`, oldest first — incremental and cached (the calendar never changes in hindsight). */
export function weddingDates(s: Seed, now: number): WedDate[] {
  const key = keyOf(s);
  let c = cache.get(key);
  if (!c) { if (cache.size > 200) cache.clear(); c = { list: [], next: Date.parse(s.created_at) + WED_FIRST }; cache.set(key, c); }
  while (c.next <= now) {
    const t = c.next, k = c.list.length;
    const town = wedStage(s, t) >= 3;
    c.list.push({ at: t, k, dowry: dowryAt(civicWealth(s, t)), town, grand: !town || k % WED_NOTABLE === WED_NOTABLE - 1 });
    c.next = t + wedGapHours(s, t) * 3.6e6;
  }
  let n = c.list.length;
  while (n > 0 && c.list[n - 1]!.at > now) n--;
  return n === c.list.length ? c.list : c.list.slice(0, n);
}
/** Times of all weddings up to `now` (real ms), oldest first. */
export const weddingTimes = (s: Seed, now: number): number[] => weddingDates(s, now).map((w) => w.at);
export const dowryEarned = (s: Seed, now: number) => weddingDates(s, now).reduce((a, w) => a + w.dowry, 0);
const lastOf = (s: Seed, now: number) => { const w = weddingDates(s, now); return w[w.length - 1]; };
/** Wedding joy: a day after a great wedding (in a village every one, in a town only council weddings). */
export const weddingJoy = (s: Seed, now: number) => { const l = lastOf(s, now); return !!l && l.grand && now - l.at < WED_JOY; };
/** Hours after a wedding begins during which the mayor may answer it (mirrored by DB encounter_guard). */
export const WED_WINDOW_H = 3;
/** The real wedding happening right now, or null. */
export function weddingLive(s: Seed, now: number): WedDate | null {
  const l = lastOf(s, now);
  return l && now - l.at < WED_WINDOW_H * 3.6e6 ? l : null;
}
/** Start of the wedding happening right now, or null. */
export const weddingNow = (s: Seed, now: number): number | null => weddingLive(s, now)?.at ?? null;
