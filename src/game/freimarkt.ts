/**
 * Freimarkt (extra market day called by the headman) — first repeatable early-game spending. Only purchase rows
 * freimarkt1, freimarkt2, … are stored (DB purchase_guard: price, Dorf certificate, numbered in order, FREIMARKT_GAP
 * between two, money; the unique (seed_id, item) index blocks double payment). Stalls on the square and the faster
 * rebuild after fire/flood are derived from those rows and the clock — never stored. No growth, rank or tax formula changes.
 */
import type { Seed } from "./world";
import { vorhabenTimes, VORHABEN } from "./vorhaben";

/** Mirrors DB purchase_guard. */
export const FREIMARKT_PRICE = 150;
/** Settlement rank (Dorf) — mirrors DB need_rank. */
export const FREIMARKT_RANK = 2;
const H = 3.6e6, DAY = 864e5;
/** The market stands this long after it was called. */
export const FREIMARKT_LEN = 24 * H;
/** Minimum time between two markets (mirrors DB guard). */
export const FREIMARKT_GAP = 7 * DAY;
export const isFreimarkt = (item: string) => /^freimarkt[1-9][0-9]*$/.test(item);
/** Item key of the next market to call (numbered rows keep the unique index). */
export const nextFreimarkt = (paid: Iterable<string>) => { let n = 0; for (const p of paid) if (isFreimarkt(p)) n++; return `freimarkt${n + 1}`; };
const times = (s: Pick<Seed, "bought">) => (s.bought ?? []).filter((b) => isFreimarkt(b.item)).map((b) => b.at).sort((a, b) => a - b);
/** Is a market of this village open at t? */
export const freimarktOpen = (s: Pick<Seed, "bought">, t: number) => times(s).some((a) => t >= a && t < a + FREIMARKT_LEN);
/** Earliest moment the next market may be called (−Infinity when none was held yet). */
export function freimarktReady(s: Pick<Seed, "bought">): number { const ts = times(s); return ts.length ? ts[ts.length - 1]! + FREIMARKT_GAP : -Infinity; }
/**
 * Extra rebuild time between `from` and `to`: while a market stands, the carpenters and carters it draws work
 * alongside the villagers, so rebuilding after fire or flood runs at double speed for those hours.
 */
export function marketHelp(s: Pick<Seed, "bought">, from: number, to: number): number {
  let ms = 0;
  for (const a of times(s)) ms += Math.max(0, Math.min(to, a + FREIMARKT_LEN) - Math.max(from, a));
  // Bauhütte (vorhaben.ts): hired carpenters for its whole span
  for (const a of vorhabenTimes(s, "bauhuette")) ms += Math.max(0, Math.min(to, a + VORHABEN.bauhuette.len) - Math.max(from, a));
  return ms;
}
/** One-time carpenter help per market for a bought build already running when the market is called. */
export const MARKET_BOOST = 12 * H;
/**
 * Finish time of a bought build started at `at` that would normally finish at `done`: each market called while the
 * site was already running (at < market < done) pulls the finish forward once by MARKET_BOOST, never before the
 * market itself. Builds started after a market are untouched; each market counts only once per build.
 */
export function marketBoost(s: Pick<Seed, "bought">, at: number, done: number): number {
  for (const a of [...times(s), ...vorhabenTimes(s, "bauhuette")].sort((x, y) => x - y)) if (a > at && a < done) done = Math.max(a, done - MARKET_BOOST);
  return done;
}
