/** Shared world clock: every client uses Europe/Berlin time, so day/night and routines are identical worldwide. */
export const WORLD_TZ = "Europe/Berlin";
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: WORLD_TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
let cache = { min: -1, base: 0 };
/** Hour of day (fractional) in Samenland time for timestamp `now`. */
export function worldHour(now: number): number {
  const min = Math.floor(now / 60000);
  if (min !== cache.min) {
    const p = fmt.formatToParts(new Date(min * 60000));
    const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
    cache = { min, base: g("hour") + g("minute") / 60 };
  }
  return cache.base + (now - cache.min * 60000) / 3.6e6;
}
