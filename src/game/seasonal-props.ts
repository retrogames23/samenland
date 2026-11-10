/**
 * Seasonal traces on the tiles (sheaves, firewood, ice, straw mantles, laundry, fresh wattle): pure
 * functions of tile hash, shared calendar and realm clock — never stored, so every client sees the same.
 */
import { seasonAt, snowCoverAt } from "./season";
import { worldHour, isSunday } from "./time";
import { wetness, snowiness } from "./weather";

const DAY = 864e5;
const h3 = (a: number, b: number, c: number) => { let x = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647); x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const doy = (now: number) => { const d = new Date(now); return Math.floor((now - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY); };

/** Sheaf stooks stand on cut fields from mid-August until ploughing in mid-October. */
export const sheavesOut = (now: number) => { const d = doy(now); return d >= 227 && d < 288; };
/** How many stooks stand on a given field tile (0–3). */
export const sheavesOn = (sd: number, now: number) => sheavesOut(now) ? Math.floor(h3(sd, 1, 71) * 4) : 0;

/** Firewood stack height 0.2–1: grows from September to the end of November, burns down until April. */
export function woodpileLevel(now: number): number {
  const d = doy(now), base = 0.2;
  if (d >= 244 && d < 334) return base + (1 - base) * ((d - 244) / 90);
  if (d >= 334) return 1;
  if (d < 120) return 1 - (1 - base) * (d / 120);
  return base;
}

/** Hard frost: troughs freeze, paths are trodden through the snow. */
export const frost = (now: number) => seasonAt(now).winter >= 0.6;
/**
 * Snow on the ways, quantised so baked ground chunks only refresh on real changes:
 * 0 = none, 1 = thin crust, 2 = light snow (tracks clear), 3 = heavy snow (tracks half filled).
 * Coupled to the real lying snow only: deep winter without cover or falling snow leaves the ways bare.
 */
export function waySnow(now: number): 0 | 1 | 2 | 3 {
  const w = seasonAt(now).winter; if (w < 0.6) return 0;
  const s = snowiness(now), c = snowCoverAt(now);
  if (c < 0.12 && s < 0.3) return 0;
  if (c < 0.3 && s < 0.55) return 1;
  return s > 0.55 || c > 0.75 ? 3 : 2;
}
/** Straw mantles go round young fruit trees from November till March. */
export const strawOn = (now: number) => { const d = doy(now); return d >= 305 || d < 80; };

/** Spring: fresh wattle around gardens, newly hoed beds. */
export const springWork = (now: number) => seasonAt(now).spring >= 0.5;

/** Laundry on the line: spring and summer, dry days only, not on Sundays, taken in at night. */
export function laundryOut(sd: number, now: number): boolean {
  const w = seasonAt(now); if (w.spring + w.summer < 0.5 || isSunday(now)) return false;
  const h = worldHour(now); if (h < 8 || h >= 18 || wetness(now) > 0.1) return false;
  return h3(sd, Math.floor(now / DAY), 73) < 0.3;
}

/** Drying ovens smoke on autumn days (fruit, hops, flax). */
export function dryingSmoke(sd: number, now: number): boolean {
  if (seasonAt(now).autumn < 0.5) return false;
  const h = worldHour(now);
  return h >= 7 && h < 18 && h3(sd, Math.floor(now / DAY), 74) < 0.35;
}
