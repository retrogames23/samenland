import { describe, it, expect, afterEach } from "vitest";
import { setRealm, worldHour, workClock, REALMS, REALM_TZ, type Realm } from "./time";
import { legacyWorldHour } from "./__ref/monument-legacy";

/** Identity of the hour-cached worldHour with the former per-minute formatter (src/game/__ref/monument-legacy.ts). */
const ALL: Realm[] = [...REALMS, "lab"];
const ZONES = [...new Set(ALL.map((r) => REALM_TZ[r]))];
const realmOf = (tz: string) => ALL.find((r) => REALM_TZ[r] === tz)!;
const H = 3.6e6, DAY = 864e5;
afterEach(() => setRealm("europe"));

/** Deterministic pseudo-random sequence (no Math.random, so failures reproduce). */
function rng(seed: number) { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 2 ** 32; }; }
/** Offset changes of a zone in [from, to): first UTC hour whose local clock does not continue the previous hour. */
function switches(tz: string, from: number, to: number): number[] {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" });
  const off = (t: number) => f.formatToParts(new Date(t)).find((p) => p.type === "timeZoneName")!.value;
  const out: number[] = [];
  for (let t = from; t < to; t += DAY) {
    if (off(t) === off(t + DAY)) continue;
    let lo = t, hi = t + DAY; // binary search to the minute of the change
    while (hi - lo > 60000) { const m = Math.floor((lo + hi) / 120000) * 60000; if (off(m) === off(lo)) lo = m; else hi = m; }
    out.push(hi);
  }
  return out;
}
/** Compares one sample with the reference, keeping the first mismatches readable. */
function check(ref: (t: number) => number, ts: number[], bad: string[]) {
  for (const t of ts) { const a = worldHour(t), b = ref(t); if (!Object.is(a, b) && bad.length < 5) bad.push(`${new Date(t).toISOString()} new=${a} ref=${b}`); }
}

describe("worldHour hour cache is identical to the per-minute formatter", () => {
  it("covers four time zones with DST switches in the realm list", () => {
    expect(ZONES.sort()).toEqual(["America/Los_Angeles", "America/New_York", "Asia/Tokyo", "Europe/Berlin"]);
  });

  for (const tz of ZONES) {
    it(`${tz}: every minute (and sub-minute) from 30 h before to 30 h after each offset change 2024–2032`, () => {
      setRealm(realmOf(tz));
      const ref = legacyWorldHour(tz), bad: string[] = [];
      const sw = switches(tz, Date.UTC(2024, 0, 1), Date.UTC(2033, 0, 1));
      if (tz !== "Asia/Tokyo") expect(sw.length).toBe(18); else expect(sw.length).toBe(0);
      const days = tz === "Asia/Tokyo" ? [Date.UTC(2026, 2, 29), Date.UTC(2026, 9, 25)] : sw;
      for (const c of days) {
        const ts: number[] = [];
        for (let t = c - 30 * H; t <= c + 30 * H; t += 60000) ts.push(t, t + 1, t + 29999.5, t + 59999);
        check(ref, ts, bad);
        // exactly at, just before and just after the switch instant
        check(ref, [c - 1, c, c + 1, c - 60000, c + 60000, c - 0.001, c + 0.001], bad);
      }
      expect(bad).toEqual([]);
    });

    it(`${tz}: historical offsets with seconds (local mean time) and early DST rules, minute by minute`, () => {
      setRealm(realmOf(tz));
      const ref = legacyWorldHour(tz), bad: string[] = [];
      for (const c of switches(tz, Date.UTC(1880, 0, 1), Date.UTC(1900, 0, 1)).concat(switches(tz, Date.UTC(1916, 0, 1), Date.UTC(1920, 0, 1)), switches(tz, Date.UTC(1945, 0, 1), Date.UTC(1950, 0, 1)))) {
        const ts: number[] = [];
        for (let t = c - 3 * H; t <= c + 3 * H; t += 60000) ts.push(t, t + 12345);
        check(ref, ts, bad);
      }
      expect(bad).toEqual([]);
    });

    it(`${tz}: 40 000 random timestamps 1850–2150 in non-chronological order, each asked twice`, () => {
      setRealm(realmOf(tz));
      const ref = legacyWorldHour(tz), bad: string[] = [], r = rng(tz.length * 7919);
      const lo = Date.UTC(1850, 0, 1), hi = Date.UTC(2150, 0, 1), ts: number[] = [];
      for (let i = 0; i < 20000; i++) { const t = lo + Math.floor(r() * (hi - lo)) + (r() < 0.3 ? r() : 0); ts.push(t); }
      check(ref, ts, bad); check(ref, [...ts].reverse(), bad);
      expect(bad).toEqual([]);
    });
  }

  it("alternating historic and current queries, repeated, across all realm switches", () => {
    const refs = new Map(ZONES.map((z) => [z, legacyWorldHour(z)]));
    const r = rng(42), bad: string[] = [];
    const base = [Date.UTC(2026, 2, 29, 1), Date.UTC(2026, 9, 25, 1), Date.UTC(2026, 2, 8, 10), Date.UTC(2026, 10, 1, 9), Date.UTC(1893, 3, 1), Date.UTC(2030, 5, 1)];
    for (let i = 0; i < 4000; i++) {
      const realm = ALL[Math.floor(r() * ALL.length)]!;
      setRealm(realm);
      const t = base[Math.floor(r() * base.length)]! + Math.floor((r() - 0.5) * 6 * H);
      check(refs.get(REALM_TZ[realm])!, [t, t - 37 * DAY, t, t + 0.5], bad);
    }
    expect(bad).toEqual([]);
  });

  it("workClock (anchored on worldHour) is identical around every 2026 switch in all zones", () => {
    for (const tz of ZONES) {
      setRealm(realmOf(tz));
      const ref = legacyWorldHour(tz);
      const refClock = (now: number) => { // former workClock body on the reference hour
        const h = ref(now), utcH = (now % 864e5) / 3.6e6;
        const off = Math.round(((h - utcH + 36) % 24) - 12);
        const day = Math.floor((now + off * 3.6e6) / 864e5) * 864e5;
        return day + Math.min(Math.max(h - 6, 0), 20 - 6) * (24 / 14) * 3.6e6;
      };
      const bad: string[] = [];
      for (const c of [...switches(tz, Date.UTC(2026, 0, 1), Date.UTC(2027, 0, 1)), Date.UTC(2026, 5, 1)]) {
        for (let t = c - 26 * H; t <= c + 26 * H; t += 60000 + 7) { const a = workClock(t), b = refClock(t); if (!Object.is(a, b) && bad.length < 5) bad.push(`${tz} ${t} ${a} ${b}`); }
      }
      expect(bad).toEqual([]);
    }
  });

  it("invalid times fail exactly like the formatter did", () => {
    setRealm("europe");
    const ref = legacyWorldHour(REALM_TZ.europe);
    const run = (f: (t: number) => number, t: number) => { try { return f(t); } catch (e) { return (e as Error).name; } };
    for (const t of [NaN, Infinity, -Infinity, 8.64e15 + 1, 8.64e15 + 60000, 8.64e15 - 1, -8.64e15, -8.64e15 - 1, -8.64e15 + 60000, 8.64e15 - 864e5 - 1])
      expect(run(worldHour, t)).toBe(run(ref, t));
    expect(run(worldHour, NaN)).toBe("RangeError");
  });
});
