/**
 * Gemeindevorhaben — voluntary, repeatable spending (no upkeep, nothing expires, never forced).
 * Only numbered purchase rows bauhuette1, bauhuette2, … are stored; the DB purchase_guard mirrors price, numbering,
 * rank and pause. The effect is derived from those rows and the clock.
 */
import type { Seed } from "./world";
import { workClock, workDone } from "./time";

export type VorhabenKey = "bauhuette";
const H = 3.6e6, DAY = 864e5;
/**
 * Price = max(floor, share × the village's last booked daily tax, rounded to 10 Mark). Floors index = rank 0…5
 * (0 = not offered). Mirrors DB purchase_guard (which reads the newest tax_receipts row).
 */
export const VORHABEN: Record<VorhabenKey, { rank: number; prices: readonly number[]; share: number; len: number; gap: number }> = {
  // Bauhütte: hired carpenters and masons for 48 h — every bought build and monument step works BAUHUETTE_SPEED× as fast
  bauhuette: { rank: 1, prices: [0, 50, 50, 50, 50, 50], share: 1, len: 48 * H, gap: 5 * DAY },
};
/** Work speed on bought builds while a Bauhütte is hired (+50 %). */
export const BAUHUETTE_SPEED = 1.5;
/**
 * Growth from a hired Bauhütte (P0 "Bauhütte kauft Wachstum"): for BAUHUETTE_LEN after payment the village gains
 * `rate` extra growth hours per real hour (rate 2 = +200 % of plain base growth). Only rows paid at or after `since`
 * count, so earlier Bauhütten keep exactly their old effect. Windows are merged (overlap never counts twice), and
 * world.ts adds these hours outside every other bonus (trade, blessing, boons, farm, mentor, twins), so nothing
 * amplifies them; only GROWTH_PACE and the care ceiling apply, like to every growth hour.
 * `since` MUST be the exact publish moment — set it when publishing. RELEASE BLOCKER: 2026-12-01T00:00:00Z is a
 * placeholder, not a decided date (publication not yet scheduled); never publish with it unchanged. Rows paid before
 * `since` never gain growth. The simulation sets it to the founding of its new village (a player who starts after
 * publication); tests may override it, nothing else.
 */
export const bauhuetteGrowth = { since: Date.parse("2026-12-01T00:00:00Z"), rate: 2 };
/** Extra growth hours (before GROWTH_PACE) accumulated by `now` from Bauhütte windows paid since bauhuetteGrowth.since. */
export function bauhuetteHours(s: Pick<Seed, "bought">, now: number): number {
  const { since, rate } = bauhuetteGrowth;
  if (!rate) return 0;
  let ms = 0, end = -Infinity;
  for (const a of vorhabenTimes(s, "bauhuette")) {
    if (a < since || a > now) continue;
    const from = Math.max(a, end), to = Math.min(now, a + VORHABEN.bauhuette.len);
    if (to > from) ms += to - from;
    end = Math.max(end, a + VORHABEN.bauhuette.len);
  }
  return (ms / H) * rate;
}
export const VORHABEN_KEYS = Object.keys(VORHABEN) as VorhabenKey[];
const RE = /^(bauhuette)([1-9][0-9]*)$/;
export const vorhabenOf = (item: string): VorhabenKey | null => (RE.exec(item)?.[1] as VorhabenKey | undefined) ?? null;
export function vorhabenPrice(k: VorhabenKey, rank: number, dayTax = 0): number {
  const floor = VORHABEN[k].prices[Math.max(0, Math.min(5, rank))] ?? 0;
  return floor ? Math.max(floor, 10 * Math.round((VORHABEN[k].share * Math.max(0, dayTax)) / 10)) : 0;
}
/** Newest booked daily tax from the receipts (settlement day → income), 0 when none. */
export const lastDayTax = (receipts?: Readonly<Record<number, number>>) => {
  if (!receipts) return 0; let d = -1, v = 0;
  for (const [k, x] of Object.entries(receipts)) if (+k > d) { d = +k; v = x; }
  return v;
};
/** Next numbered key (unique (seed_id, item) index blocks double payment). */
export const nextVorhaben = (k: VorhabenKey, paid: Iterable<string>) => { let n = 0; for (const p of paid) if (vorhabenOf(p) === k) n++; return `${k}${n + 1}`; };
export const vorhabenTimes = (s: Pick<Seed, "bought">, k: VorhabenKey) => (s.bought ?? []).filter((b) => vorhabenOf(b.item) === k).map((b) => b.at).sort((a, b) => a - b);
export const vorhabenOpen = (s: Pick<Seed, "bought">, k: VorhabenKey, t: number) => vorhabenTimes(s, k).some((a) => t >= a && t < a + VORHABEN[k].len);
/** Earliest moment the next one may be paid (−Infinity when none yet). */
export function vorhabenReady(s: Pick<Seed, "bought">, k: VorhabenKey): number { const ts = vorhabenTimes(s, k); return ts.length ? ts[ts.length - 1]! + VORHABEN[k].gap : -Infinity; }
/**
 * Finish time of a bought build started at `at` that would normally finish at `done` (both on the work clock):
 * the same amount of work, but inside every Bauhütte window it accrues BAUHUETTE_SPEED× as fast. Running and newly
 * started sites benefit alike; outside the windows nothing changes; each window counts once (windows never overlap
 * because the pause is longer than the span), and nothing ever finishes instantly.
 */
export function bauhuetteDone(s: Pick<Seed, "bought">, at: number, done: number): number {
  const ws = vorhabenTimes(s, "bauhuette");
  if (!ws.length || !(done > at)) return done;
  let rem = workClock(done) - workClock(at), cur = at;
  for (const w0 of ws) {
    const w1 = w0 + VORHABEN.bauhuette.len;
    if (w1 <= cur) continue;
    const s0 = Math.max(w0, cur);
    const pre = workClock(s0) - workClock(cur);
    if (pre >= rem) return workDone(cur, rem);
    rem -= pre; cur = s0;
    const inW = (workClock(w1) - workClock(cur)) * BAUHUETTE_SPEED;
    if (inW >= rem) return Math.min(done, workDone(cur, rem / BAUHUETTE_SPEED));
    rem -= inW; cur = w1;
  }
  return Math.min(done, workDone(cur, rem));
}
/** Display only: share of the care soft cap (world.ts careSoftCap) from which the Bauhütte card warns that missing care
 *  will brake its growth. Never used by any mechanic. */
export const BAUHUETTE_CARE_NEAR = 0.9;
/** True when the town is within reach of (or already at) the growth age where the care gate brakes growth. */
export const bauhuetteCareHint = (age: number, softCap: number | null) => softCap !== null && age >= softCap * BAUHUETTE_CARE_NEAR;
