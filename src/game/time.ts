import { setBiome } from "./biome";
/** Four realms (separate maps), each with one shared clock, so everyone on a map sees the same day/night. */
export type Realm = "us-west" | "us-west-2" | "us-east" | "us-east-2" | "europe" | "europe-2" | "europe-3" | "asia" | "asia-2" | "lab";
export const REALMS: Realm[] = ["us-west", "us-west-2", "us-east", "us-east-2", "europe", "europe-2", "europe-3", "asia", "asia-2"];
export const REALM_TZ: Record<Realm, string> = {
  "us-west": "America/Los_Angeles",
  "us-west-2": "America/Los_Angeles",
  "us-east": "America/New_York",
  "us-east-2": "America/New_York",
  europe: "Europe/Berlin",
  "europe-2": "Europe/Berlin",
  "europe-3": "Europe/Berlin",
  asia: "Asia/Tokyo",
  "asia-2": "Asia/Tokyo",
  lab: "Europe/Berlin",
};
/** Pick a realm from a UTC offset in hours (positive = east of UTC). */
export function realmForOffset(h: number): Realm {
  if (h <= -6.5) return "us-west";
  if (h < -1) return "us-east";
  if (h < 5) return "europe";
  return "asia";
}
/** Villages per map after which newcomers land on the next map of the same time zone (mirrors DB realm_full_guard). */
export const REALM_FULL = 60;
export const EUROPE_FULL = REALM_FULL;
/** Overflow chain per time zone: a full map sends newcomers on to the next one; the last map of a chain never fills. */
export const REALM_NEXT: Partial<Record<Realm, Realm>> = { europe: "europe-2", "europe-2": "europe-3", "us-west": "us-west-2", "us-east": "us-east-2", asia: "asia-2" };
/** First map along the chain from `r` that still has room, given village counts per map. */
export function openRealm(r: Realm, count: (r: Realm) => number): Realm {
  for (let n = REALM_NEXT[r]; n && count(r) >= REALM_FULL; n = REALM_NEXT[r]) r = n;
  return r;
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
  setBiome(r);
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

/**
 * Builders' working day (north German town law around 1500): from the morning bell at WORK_START to the
 * evening bell at WORK_END; at night no site may work (open light near timber meant fire). To keep build
 * times balanced over a full day, the day shift works 24 / (WORK_END - WORK_START) times as fast.
 */
export const WORK_START = 6, WORK_END = 20;
export const WORK_RATE = 24 / (WORK_END - WORK_START);
/** Morning, midday and evening bell (WORK_START, 12, WORK_END): field and site workers pause PEAL_SECS. */
export const PEAL_HOURS = [WORK_START, 12, WORK_END], PEAL_SECS = 20;
export const pealPause = (now: number) => { const h = worldHour(now); return PEAL_HOURS.some((k) => h >= k && h < k + PEAL_SECS / 3600); };
export const isWorkHour = (now: number) => { const h = worldHour(now); return h >= WORK_START && h < WORK_END; };
/** Monotonic "work clock" in ms: advances WORK_RATE× during the working day, stands still at night; equals real time over whole days. */
export function workClock(now: number): number {
  // anchor on the local calendar day (wall-clock ms), not `now - h`: on DST switch days the local hour jumps,
  // which would make the clock step back. Each local day contributes exactly 24 h, so it stays monotonic.
  const h = worldHour(now), utcH = (now % 864e5) / 3.6e6;
  const off = Math.round(((h - utcH + 36) % 24) - 12);
  const day = Math.floor((now + off * 3.6e6) / 864e5) * 864e5;
  return day + Math.min(Math.max(h - WORK_START, 0), WORK_END - WORK_START) * WORK_RATE * 3.6e6;
}
/** Real moment when `ms` of work time have passed since `from` (inverse of workClock; pure). */
export function workDone(from: number, ms: number): number {
  const target = workClock(from) + ms;
  let lo = from, hi = from + ms + 2 * 864e5;
  for (let i = 0; i < 48; i++) { const m = (lo + hi) / 2; if (workClock(m) >= target) hi = m; else lo = m; }
  return Math.ceil(hi);
}

/** Admin test map: time runs LAB_SPEED times faster from LAB_EPOCH, plus an optional jump (game hours). */
export const LAB_EPOCH = Date.parse("2026-10-27T23:40:00Z");
export const LAB_SPEED = 1;
let lab = false, jumpH = 0;
export const isLab = () => lab;
export function setLabJump(h: number) { jumpH = Math.max(0, h); }
export const labJump = () => jumpH;
/** The game's "now": server-synced time on public maps, warped time on the lab map; an explicit argument is used as is. */
export function clock(real?: number): number {
  if (lab) { const r = real ?? Date.now(); return LAB_EPOCH + (r - LAB_EPOCH) * LAB_SPEED + jumpH * 3.6e6; }
  return real ?? (synced ? getSyncedTime() : Date.now());
}

/* ---- server-synced realm clock: anchor pair (T_ref, P_ref) on performance.now(), monotonic via hold/slew ---- */
export const SYNC_RTT_MAX = 800, HOLD_MAX = 3000, SLEW_RATE = 0.5, SYNC_EVERY = 10 * 60e3;
let perfNow: () => number = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
let synced = false;
let tRef = 0, pRef = 0, rate = 1;     // displayed clock: tRef + (p - pRef) * rate
let sT = 0, sP = 0;                   // best server estimate anchor
let last = -Infinity;                 // lastDeliveredClock
let syncInFlight = false;
/** Test hook: replace the monotonic source and reset sync state. */
export function _setPerfSource(f: () => number) { perfNow = f; synced = false; last = -Infinity; rate = 1; syncInFlight = false; }
export function initTimeSync(serverTime: number) {
  const p = perfNow();
  tRef = sT = serverTime; pRef = sP = p; rate = 1; synced = true;
}
export function getSyncedTime(): number {
  const p = perfNow();
  let v: number;
  if (rate === 1) v = tRef + (p - pRef);
  else {
    const d = tRef + (p - pRef) * rate, s = sT + (p - sP);
    if (s >= d) { tRef = sT; pRef = sP; rate = 1; v = s; } // caught up: back to normal speed
    else v = d;
  }
  if (v < last) v = last;
  last = v;
  return v;
}
/** Apply one measured sample (exported for tests). Returns false when discarded. */
export function applySync(serverTime: number, pStart: number, pEnd: number): boolean {
  const rtt = pEnd - pStart;
  if (rtt < 0 || rtt > SYNC_RTT_MAX) return false;
  const tEst = serverTime + rtt / 2;
  if (!synced) { tRef = sT = tEst; pRef = sP = pEnd; rate = 1; synced = true; return true; }
  const cur = getSyncedTime();             // current displayed time at pEnd (≈ now)
  sT = tEst; sP = pEnd;
  if (tEst >= cur) { tRef = tEst; pRef = pEnd; rate = 1; }          // normal / positive correction
  else { tRef = cur; pRef = pEnd; rate = cur - tEst <= HOLD_MAX ? 0 : SLEW_RATE; } // hold or slew, never back
  return true;
}
/** NTP-lite re-sync against the server; parallel calls are dropped. */
export async function syncServerTime(fetchTime: () => Promise<{ serverTime: number }>): Promise<boolean> {
  if (syncInFlight || lab) return false;
  syncInFlight = true;
  try {
    const p0 = perfNow();
    const { serverTime } = await fetchTime();
    return applySync(serverTime, p0, perfNow());
  } catch { return false; } finally { syncInFlight = false; }
}
/** Bucket for structure/town caches: one game minute, or ~1 real second while time is warped. */
export const cacheTick = (now: number) => Math.floor(now / Math.max(60000, LAB_SPEED * 1000));

/** Day of week (0 = Sunday) in the current realm's time; every player on a map shares the same Sunday. */
let wdFmt: { tz: string; f: Intl.DateTimeFormat } | null = null;
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function worldWeekday(now: number): number {
  if (!wdFmt || wdFmt.tz !== tz) wdFmt = { tz, f: new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short" }) };
  return WD.indexOf(wdFmt.f.format(new Date(now)));
}
export const isSunday = (now: number) => worldWeekday(now) === 0;

/** In-game calendar: today's realm date, the year shifted back to around 1500 (2026 → 1500, 2027 → 1501). */
export const YEAR_SHIFT = 526;
export function gameDate(now: number, locale: string, month: "long" | "short" = "long"): string {
  const parts = new Intl.DateTimeFormat(locale, { timeZone: tz, day: "numeric", month, year: "numeric" }).formatToParts(new Date(now));
  return parts.map((p) => p.type === "year" ? String(Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(new Date(now))) - YEAR_SHIFT) : p.value).join("");
}
export function gameYear(now: number): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(new Date(now))) - YEAR_SHIFT;
}
/** Start (ms) of the current realm calendar day; daily limits (blessing, gifts, wonders, decrees) reset at this midnight, mirrored by DB realm_day_start. */
let dsFmt: { tz: string; f: Intl.DateTimeFormat } | null = null;
export function worldDayStart(now: number): number {
  // same as SQL date_trunc('day', now AT TIME ZONE z) AT TIME ZONE z: the real local midnight, DST-safe
  if (!dsFmt || dsFmt.tz !== tz) dsFmt = { tz, f: new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" }) };
  const f = dsFmt.f;
  const wall = (t: number) => { const p = f.formatToParts(new Date(t)); const g = (k: string) => Number(p.find((x) => x.type === k)?.value ?? 0); return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second")); };
  const sec = Math.floor(now / 1000) * 1000, w = wall(sec);
  const mid = Math.floor(w / 864e5) * 864e5; // local midnight as wall-clock ms
  let t = mid - (w - sec); // first guess with today's offset
  t = mid - (wall(t) - t); // correct with the offset valid at midnight
  return t;
}
