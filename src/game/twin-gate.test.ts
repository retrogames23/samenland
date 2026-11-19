import { describe, it, expect } from "vitest";
import { links, twinSince, isTwin, pactOf, effAge, sinceStats, type Seed, type Link } from "./world";

// Reference: the pre-P.8d status check, purely via twinSince.
const refIsTwin = (l: Link, seeds: Seed[], now: number) => { const t = twinSince(l, seeds); return t !== null && now >= t; };

const T0 = Date.parse("2026-01-01T00:00:00Z"), DAY = 864e5, Y3 = 3 * 365 * DAY;
const mk = (id: string, x: number, partner: string, extra: Partial<Seed> = {}): Seed => ({
  id, name: id, owner: id, x, y: 400, hue: 0, created_at: new Date(T0).toISOString(), user_id: `u-${id}`,
  bought: ["fisher", "hunter", "granary", "herbs", "healer"].map((item) => ({ item, at: 0 })),
  roads: [{ target: partner, at: T0 }], ...extra,
});

describe("twin status pre-filter (twinSiteAt before twinSince)", () => {
  for (const dist of [30, 45, 60, 80, 110]) {
    it(`isTwin equals reference at d=${dist} incl. minute rounding, founding and 3-year edge`, () => {
      const seeds = [mk("a", 300, "b", { votes: [{ partner: "b", pact: "trade", at: T0 + DAY }] }), mk("b", 300 + dist, "a", { votes: [{ partner: "a", pact: "trade", at: T0 + DAY }] })];
      const l = links(seeds)[0]!;
      const ts = twinSince(l, seeds);
      const ts_ = [T0 - DAY, T0, T0 + 1, T0 + Y3 - 1, T0 + Y3, T0 + Y3 + 1, T0 + 5 * 365 * DAY];
      for (let d = 0; d < 1200; d += 15) ts_.push(T0 + d * DAY);
      if (ts !== null) for (let k = -180; k <= 180; k++) ts_.push(ts + k * 1000);
      for (const t of ts_) {
        expect(isTwin(l, seeds, t)).toBe(refIsTwin(l, seeds, t));
        const p = pactOf(seeds[0]!, seeds[1]!, seeds, t);
        if (!refIsTwin(l, seeds, t)) expect(p).toBeNull();
      }
    });
  }
  it("untouched pair triggers no twinSince call (no bisection)", () => {
    const seeds = [mk("c", 300, "d"), mk("d", 410, "c")];
    const l = links(seeds)[0]!;
    const before = sinceStats.calls;
    expect(isTwin(l, seeds, T0 + 10 * DAY)).toBe(false);
    expect(pactOf(seeds[0]!, seeds[1]!, seeds, T0 + 10 * DAY)).toBeNull();
    effAge(seeds[0]!, seeds, T0 + 10 * DAY + 7);
    expect(sinceStats.calls).toBe(before);
  });
});
