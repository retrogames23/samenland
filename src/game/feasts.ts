import { worldTz, worldHour, YEAR_SHIFT } from "./time";

/**
 * Church year around 1500 (north Germany): which feast the realm's calendar day is. Pure and derived
 * from the shared realm clock — nothing is stored, so every player on a map celebrates the same day.
 * Easter follows the Julian computus of the game year (real year − YEAR_SHIFT), snapped to the nearest
 * real Sunday so the feast falls on the map's shared Sunday; movable feasts hang off that Easter.
 */
export type FeastCode =
  | "christmas" | "epiphany" | "candlemas" | "shrovetide" | "ashwed" | "palm" | "goodfriday" | "easter"
  | "ascension" | "pentecost" | "corpus" | "midsummer" | "michaelmas" | "allsaints" | "martinmas";
/** How the village keeps the day on the map. */
export type FeastScene = "fire" | "night" | "procession" | "church" | "quiet" | "revel" | "fete" | "green";
export const FEASTS: Record<FeastCode, { rest: boolean; scene: FeastScene }> = {
  christmas: { rest: true, scene: "night" },
  epiphany: { rest: true, scene: "church" },
  candlemas: { rest: true, scene: "church" },
  shrovetide: { rest: false, scene: "revel" },
  ashwed: { rest: false, scene: "quiet" },
  palm: { rest: true, scene: "procession" },
  goodfriday: { rest: true, scene: "quiet" },
  easter: { rest: true, scene: "fire" },
  ascension: { rest: true, scene: "procession" },
  pentecost: { rest: true, scene: "green" },
  corpus: { rest: true, scene: "procession" },
  midsummer: { rest: true, scene: "fire" },
  michaelmas: { rest: true, scene: "fete" },
  allsaints: { rest: true, scene: "church" },
  martinmas: { rest: true, scene: "fete" },
};

/** Julian Easter (month 1-12, day) for a year — the calendar in force in 1500. */
export function julianEaster(y: number): [number, number] {
  const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, n = d + e + 114;
  return [Math.floor(n / 31), (n % 31) + 1];
}
const DAY = 864e5;
const utcDay = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / DAY;
/** Day number (UTC days) of the map's Easter Sunday in real year `ry`. */
export function easterDay(ry: number): number {
  const [m, d] = julianEaster(ry - YEAR_SHIFT), n = utcDay(ry, m, d);
  const wd = new Date(n * DAY).getUTCDay(); // 0 = Sunday
  return wd === 0 ? n : wd <= 3 ? n - wd : n + 7 - wd;
}
let fmt: { tz: string; f: Intl.DateTimeFormat } | null = null;
/** Realm calendar date [year, month, day] for timestamp `now`. */
export function realmDate(now: number): [number, number, number] {
  const tz = worldTz();
  if (!fmt || fmt.tz !== tz) fmt = { tz, f: new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" }) };
  const p = fmt.f.formatToParts(new Date(now)), g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return [g("year"), g("month"), g("day")];
}
const FIXED: Record<string, FeastCode> = { "12-25": "christmas", "1-6": "epiphany", "2-2": "candlemas", "6-24": "midsummer", "9-29": "michaelmas", "11-1": "allsaints", "11-11": "martinmas" };
const MOVABLE: [number, FeastCode][] = [[-47, "shrovetide"], [-46, "ashwed"], [-7, "palm"], [-2, "goodfriday"], [0, "easter"], [39, "ascension"], [49, "pentecost"], [60, "corpus"]];

/** The feast kept on the realm day of `now`, or null. Christmas begins with the midnight mass on the eve (from 20:00). */
export function feastOn(now: number): FeastCode | null {
  const [y, m, d] = realmDate(now);
  if (m === 12 && d === 24 && worldHour(now) >= 20) return "christmas";
  const off = utcDay(y, m, d) - easterDay(y);
  for (const [k, c] of MOVABLE) if (k === off) return c;
  return FIXED[`${m}-${d}`] ?? null;
}
/** A commanded day of rest (like Sunday): fields, workshops and sites stand still. */
export const isFeastRest = (now: number) => { const f = feastOn(now); return f ? FEASTS[f].rest : false; };
/** Key for "seen" receipts of the feast overlay: one per feast and game year. */
export const feastKey = (code: FeastCode, now: number) => `${code}:${realmDate(now)[0] - YEAR_SHIFT}`;
/** Evening of a fire feast (Easter / St John's): the bonfire burns 19:30–23:30. */
export const bonfireLit = (now: number) => { const f = feastOn(now); if (!f || FEASTS[f].scene !== "fire") return false; const h = worldHour(now); return h >= 19.5 && h < 23.5; };
/** Christmas night: every household keeps a light burning for the midnight mass. */
export const christmasNight = (now: number) => { const f = feastOn(now); if (f !== "christmas") return false; const h = worldHour(now); return h >= 20 || h < 2; };
