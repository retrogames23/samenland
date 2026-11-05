import { seasonAt } from "./season";
import { worldTz, worldHour } from "./time";
import { labWeather } from "./lab-ctl";

/** Weather is display only: pure from realm zone + clock, never stored, never touches economy. */
export type WeatherKind = "clear" | "drizzle" | "mist" | "snow" | "storm";
export type Weather = { kind: WeatherKind; amount: number; wind: number; gloom: number };

const SLOT = 3 * 3600_000; // fronts hold for 3 h slots, blended over the slot edges
const hash = (a: number, b: number) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const zoneId = (tz: string) => { let h = 7; for (let i = 0; i < tz.length; i++) h = (h * 31 + tz.charCodeAt(i)) | 0; return h; };

let override: WeatherKind | null = null;
if (typeof location !== "undefined") {
  const q = new URLSearchParams(location.search).get("weather");
  if (q && ["clear", "drizzle", "mist", "snow", "storm"].includes(q)) override = q as WeatherKind;
}

function kindFor(slot: number, now: number): WeatherKind {
  const s = seasonAt(now), r = hash(zoneId(worldTz()), slot), hr = worldHour(now);
  const rain = 0.4 * s.autumn + 0.25 * s.spring + 0.1 * s.summer + 0.2 * s.winter;
  const snow = 0.3 * s.winter;
  const mist = (0.3 * (s.autumn + s.winter) + 0.1 * s.spring) * (hr < 10 || hr > 17 ? 1 : 0.4);
  const storm = s.summer * (hr >= 14 && hr < 20 ? 0.08 : 0);
  let a = storm; if (r < a) return "storm";
  a += snow; if (r < a) return "snow";
  a += rain; if (r < a) return "drizzle";
  a += mist; if (r < a) return "mist";
  return "clear";
}

let cache: { key: number; v: Weather } | null = null;
export function weatherAt(now: number): Weather {
  const key = Math.floor(now / 60_000);
  const lw = labWeather();
  if (lw) { const amount = lw === "clear" ? 0 : 0.9; return { kind: lw, amount, wind: lw === "storm" ? 1 : lw === "mist" ? 0.08 : 0.5, gloom: amount * (lw === "storm" ? 0.45 : lw === "drizzle" ? 0.22 : lw === "snow" ? 0.15 : lw === "mist" ? 0.12 : 0) }; }
  if (cache?.key === key && !override) return cache.v;
  const slot = Math.floor(now / SLOT), f = (now % SLOT) / SLOT;
  const kind = override ?? kindFor(slot, now);
  // ease in over the first 20 min, out over the last 20 min unless the next slot keeps it
  const next = override ?? kindFor(slot + 1, now + SLOT), prev = override ?? kindFor(slot - 1, now - SLOT);
  const inA = prev === kind ? 1 : Math.min(1, f / 0.11), outA = next === kind ? 1 : Math.min(1, (1 - f) / 0.11);
  const amount = kind === "clear" ? 0 : Math.min(inA, outA) * (0.6 + 0.4 * hash(slot, 9));
  const baseWind = 0.25 + 0.5 * hash(slot, 3);
  const wind = kind === "storm" ? 1 : kind === "drizzle" ? baseWind + 0.2 : kind === "mist" ? 0.08 : baseWind;
  const gloom = amount * (kind === "storm" ? 0.45 : kind === "drizzle" ? 0.22 : kind === "snow" ? 0.15 : kind === "mist" ? 0.12 : 0);
  const v = { kind, amount, wind, gloom };
  cache = { key, v };
  return v;
}

/** Rain strength 0..1 (drizzle/storm only) — drives display-only reactions: folk go indoors, laundry comes in, hoods. */
export const wetness = (now: number) => { const w = weatherAt(now); return w.kind === "drizzle" || w.kind === "storm" ? w.amount : 0; };
/** Snow strength 0..1 — hoods and breath puffs. */
export const snowiness = (now: number) => { const w = weatherAt(now); return w.kind === "snow" ? w.amount : 0; };
/** Storm darkness 0..1: workshops light their windows by day. */
export const stormDark = (now: number) => { const w = weatherAt(now); return w.kind === "storm" ? w.amount : 0; };
/** Shelter rule: outdoor leisure, lunch and play move indoors when it rains — each person has their own tolerance. */
export const shelters = (act: string, indoor: boolean, id: number, wet: number) =>
  !indoor && (act === "leisure" || act === "lunch" || act === "play" || act === "stroll") && wet > 0.15 && hash(id, 77) < wet * 1.3;
