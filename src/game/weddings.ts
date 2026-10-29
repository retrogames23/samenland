/**
 * Weddings: a pure calendar per village (first after 2 days, then every 9 days of real time).
 * The dowry is mirrored by the database function village_dowry, so the treasury stays tamper-proof.
 * Which villagers marry is derived in people.ts from this calendar — nothing is stored.
 */
import type { Seed } from "./world";

export const WED_FIRST = 2 * 864e5, WED_EVERY = 9 * 864e5;
/** Taler paid into the village treasury by both families at every wedding. */
export const DOWRY = 40;
/** Wedding joy lasts one day after the ceremony. */
export const WED_JOY = 864e5;
/** Prosperity bonus per craft/food alliance, and its cap. */
export const ALLIANCE_WEALTH = 3, ALLIANCE_MAX = 15;

/** Times of all weddings up to `now` (real ms), oldest first. */
export function weddingTimes(s: Seed, now: number): number[] {
  const c0 = Date.parse(s.created_at), out: number[] = [];
  for (let t = c0 + WED_FIRST; t <= now; t += WED_EVERY) out.push(t);
  return out;
}
export const dowryEarned = (s: Seed, now: number) => weddingTimes(s, now).length * DOWRY;
/** Wedding joy: true for a day after the latest wedding. */
export const weddingJoy = (s: Seed, now: number) => { const w = weddingTimes(s, now); const l = w[w.length - 1]; return l != null && now - l < WED_JOY; };
/** Hours after a wedding begins during which the mayor may answer it (mirrored by DB encounter_guard). */
export const WED_WINDOW_H = 3;
/** The real wedding happening right now (start time), or null. */
export const weddingNow = (s: { created_at: string }, now: number): number | null => {
  const w = weddingTimes(s as Seed, now); const l = w[w.length - 1];
  return l != null && now - l < WED_WINDOW_H * 3.6e6 ? l : null;
};
