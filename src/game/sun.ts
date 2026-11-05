import { worldHour, worldTz } from "./time";

/** Representative coordinates per realm time zone (Europe: north German plain near Lübeck/Hamburg). */
const COORDS: Record<string, [number, number]> = {
  "Europe/Berlin": [53.7, 10.3],
  "America/Los_Angeles": [37.8, -122.3],
  "America/New_York": [40.7, -74.0],
  "Asia/Tokyo": [35.7, 139.7],
};

export type SunTimes = { dawn: number; rise: number; set: number; dusk: number };
let cache: { key: string; v: SunTimes } | null = null;

/**
 * Real dawn/sunrise/sunset/dusk in realm clock hours for the day of `now` (DST follows the zone,
 * because worldHour already reads Intl). Pure from date + coordinates, so every client agrees.
 */
export function sunTimes(now: number): SunTimes {
  const tz = worldTz(), h = worldHour(now);
  const d = new Date(now), utcH = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  let off = Math.round((h - utcH) * 4) / 4; if (off > 14) off -= 24; if (off < -12) off += 24;
  const doy = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
  const key = `${tz}:${d.getUTCFullYear()}:${doy}:${off}`;
  if (cache?.key === key) return cache.v;
  const [lat, lon] = COORDS[tz] ?? COORDS["Europe/Berlin"]!;
  const rad = Math.PI / 180;
  const decl = 23.45 * Math.sin(rad * (360 / 365) * (284 + doy));
  const b = rad * (360 / 365) * (doy - 81);
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const noon = 12 - eot / 60 - ((lon - off * 15) * 4) / 60;
  const ha = (alt: number) => {
    const c = (Math.sin(alt * rad) - Math.sin(lat * rad) * Math.sin(decl * rad)) / (Math.cos(lat * rad) * Math.cos(decl * rad));
    return Math.acos(Math.min(1, Math.max(-1, c))) / rad / 15;
  };
  const s = ha(-0.833), cv = ha(-6);
  const v = { dawn: noon - cv, rise: noon - s, set: noon + s, dusk: noon + cv };
  cache = { key, v };
  return v;
}

const sm = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
/** Darkness 0 (day) .. 1 (night): fades from sunset to an hour past civil dusk, and back before sunrise. */
export function nightLevel(now: number): number {
  const hr = worldHour(now), t = sunTimes(now);
  return hr >= 12 ? sm(t.set - 0.3, t.dusk + 1, hr) : 1 - sm(t.dawn - 1, t.rise + 0.3, hr);
}
/** Golden-hour glow 0..1 around sunrise and sunset. */
export function duskGlow(now: number): number {
  const hr = worldHour(now), t = sunTimes(now);
  return Math.max(0, 1 - Math.abs(hr - (t.set + 0.2)) / 1.4) + Math.max(0, 1 - Math.abs(hr - (t.rise - 0.1)) / 1.1);
}
