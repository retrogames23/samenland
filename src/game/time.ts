/** Four realms (separate maps), each with one shared clock, so everyone on a map sees the same day/night. */
export type Realm = "us-west" | "us-east" | "europe" | "asia" | "lab";
export const REALMS: Realm[] = ["us-west", "us-east", "europe", "asia"];
export const REALM_TZ: Record<Realm, string> = {
  "us-west": "America/Los_Angeles",
  "us-east": "America/New_York",
  europe: "Europe/Berlin",
  asia: "Asia/Tokyo",
  lab: "Europe/Berlin",
};
/** Pick a realm from a UTC offset in hours (positive = east of UTC). */
export function realmForOffset(h: number): Realm {
  if (h <= -6.5) return "us-west";
  if (h < -1) return "us-east";
  if (h < 5) return "europe";
  return "asia";
}
export function detectRealm(): Realm {
  return realmForOffset(-new Date().getTimezoneOffset() / 60);
}

let tz = REALM_TZ.europe;
let fmt = makeFmt(tz);
function makeFmt(z: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: z, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
}
let cache = { min: -1, base: 0 };
export function setRealm(r: Realm) {
  lab = r === "lab";
  if (REALM_TZ[r] === tz) return;
  tz = REALM_TZ[r];
  fmt = makeFmt(tz);
  cache = { min: -1, base: 0 };
}
export const worldTz = () => tz;
/** Hour of day (fractional) in the current realm's time for timestamp `now`. */
export function worldHour(now: number): number {
  const min = Math.floor(now / 60000);
  if (min !== cache.min) {
    const p = fmt.formatToParts(new Date(min * 60000));
    const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
    cache = { min, base: g("hour") + g("minute") / 60 };
  }
  return cache.base + (now - cache.min * 60000) / 3.6e6;
}

/** Admin test map: time runs LAB_SPEED times faster from LAB_EPOCH, plus an optional jump (game hours). */
export const LAB_EPOCH = Date.parse("2026-10-27T23:40:00Z");
export const LAB_SPEED = 1000;
let lab = false, jumpH = 0;
export const isLab = () => lab;
export function setLabJump(h: number) { jumpH = Math.max(0, h); }
export const labJump = () => jumpH;
/** The game's "now": real time on public maps, warped time on the lab map. */
export function clock(real = Date.now()): number {
  return lab ? LAB_EPOCH + (real - LAB_EPOCH) * LAB_SPEED + jumpH * 3.6e6 : real;
}
/** Bucket for structure/town caches: one game minute, or ~1 real second on the lab map. */
export const cacheTick = (now: number) => Math.floor(now / (lab ? 60000 * 16 : 60000));

/** Day of week (0 = Sunday) in the current realm's time; every player on a map shares the same Sunday. */
let wdFmt: { tz: string; f: Intl.DateTimeFormat } | null = null;
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function worldWeekday(now: number): number {
  if (!wdFmt || wdFmt.tz !== tz) wdFmt = { tz, f: new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short" }) };
  return WD.indexOf(wdFmt.f.format(new Date(now)));
}
export const isSunday = (now: number) => worldWeekday(now) === 0;
