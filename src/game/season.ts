import { biomeKey } from "./biome";
import { isLab } from "./time";
export type Season = "winter" | "spring" | "summer" | "autumn";
export type SeasonWeights = Record<Season, number>;
const DAY = 86_400_000;
const transitions: [number, Season, Season][] = [[2, "winter", "spring"], [5, "spring", "summer"], [8, "summer", "autumn"], [11, "autumn", "winter"]];
/** Northern-hemisphere seasons; identical for all players, with 14-day UTC crossfades. */
/** Test map only: ?season=winter|spring|summer|autumn pins the season for visual checks; public maps never read it. */
let pinned: Season | null | undefined;
const pinnedSeason = (): Season | null => {
  if (!isLab()) return null;
  if (pinned !== undefined) return pinned;
  try { const v = new URLSearchParams(location.search).get("season"); pinned = v === "winter" || v === "spring" || v === "summer" || v === "autumn" ? v : null; } catch { pinned = null; }
  return pinned;
};
export function seasonAt(now: number): SeasonWeights {
  const pin = typeof location !== "undefined" ? pinnedSeason() : null;
  if (pin) return { winter: 0, spring: 0, summer: 0, autumn: 0, [pin]: 1 };
  const date = new Date(now), year = date.getUTCFullYear(), month = date.getUTCMonth();
  const current: Season = month < 2 || month === 11 ? "winter" : month < 5 ? "spring" : month < 8 ? "summer" : "autumn";
  const weights: SeasonWeights = { winter: 0, spring: 0, summer: 0, autumn: 0 };
  weights[current] = 1;
  for (const [m, from, to] of transitions) {
    const delta = (now - Date.UTC(year, m, 1)) / DAY;
    if (delta < -7 || delta > 7) continue;
    const x = (delta + 7) / 14, smooth = x * x * (3 - 2 * x);
    return { winter: 0, spring: 0, summer: 0, autumn: 0, [from]: 1 - smooth, [to]: smooth };
  }
  return weights;
}
export function seasonKey(now: number) {
  const w = seasonAt(now);
  return `${biomeKey()}:${Math.round(w.winter * 8)}:${Math.round(w.spring * 8)}:${Math.round(w.autumn * 8)}`;
}
