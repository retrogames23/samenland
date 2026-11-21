/**
 * Former production implementations, kept only as references for the identity tests of the monument performance
 * work (worldHour hour cache, monumentOf lookup). Never imported by the game.
 */
import { MONUMENT_DEFS, type MonumentKey } from "../world";

/** worldHour before the hour cache: one formatToParts per whole minute, one-minute cache (one instance per time zone). */
export function legacyWorldHour(tz: string): (now: number) => number {
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  let cache = { min: -1, base: 0 };
  return (now: number) => {
    const min = Math.floor(now / 60000);
    if (min !== cache.min) {
      const p = fmt.formatToParts(new Date(min * 60000));
      const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
      cache = { min, base: g("hour") + g("minute") / 60 };
    }
    return cache.base + (now - cache.min * 60000) / 3.6e6;
  };
}

/** monumentOf before the lookup table (pattern test per purchase row). */
export const legacyMonumentOf = (item: string): MonumentKey | null => {
  const m = /^([a-z]+)(\d)$/.exec(item); const k = m?.[1] as MonumentKey | undefined;
  return k && k in MONUMENT_DEFS && +m![2]! >= 1 && +m![2]! <= MONUMENT_DEFS[k].n ? k : null;
};
