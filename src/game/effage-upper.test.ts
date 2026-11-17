import { describe, expect, it } from "vitest";
import { links, effAge, effAgeUpper, twinSince, radiusOf, type Seed } from "./world";

const T0 = Date.parse("2026-01-01T00:00:00Z"), DAY = 864e5;
const care = ["fisher", "hunter", "granary", "herbs", "healer"].map((item) => ({ item, at: 0 }));
const mk = (id: string, x: number, y: number, partners: string[], extra: Partial<Seed> = {}): Seed => ({
  id, name: id, owner: id, x, y, hue: 0, created_at: new Date(T0).toISOString(), user_id: `u-${id}`,
  bought: care, roads: partners.map((target) => ({ target, at: T0 })), ...extra,
} as Seed);

// Hub with three close partners, full trade pact, joint works and daily blessings: maximum twin bonuses.
const full = (id: string, partners: string[]): Partial<Seed> => ({
  votes: partners.map((partner) => ({ partner, pact: "trade", at: T0 + DAY })),
  works: partners.map((partner) => ({ partner, work: "hall", at: T0 + DAY })),
  blessed: Array.from({ length: 600 }, (_, i) => T0 + i * DAY + 3600e3),
} as unknown as Partial<Seed>);
const hub = mk("h", 320, 430, ["a", "b", "c"], full("h", ["a", "b", "c"]));
const seeds = [hub,
  mk("a", 352, 440, ["h"], full("a", ["h"])), mk("b", 300, 458, ["h"], full("b", ["h"])),
  mk("c", 330, 398, ["h"], { created_at: new Date(T0 + 40 * DAY).toISOString(), ...full("c", ["h"]) })];

describe("effAgeUpper prefilter bound", () => {
  it("is never below effAge, before and long after twins start", () => {
    let twinned = 0;
    for (let d = 1; d <= 1200; d += 7) {
      const t = T0 + d * DAY;
      for (const s of seeds) {
        const e = effAge(s, seeds, t), u = effAgeUpper(s, seeds, t);
        expect(u, `${s.id} day ${d}`).toBeGreaterThanOrEqual(e - 1e-9);
        expect(radiusOf(u)).toBeGreaterThanOrEqual(radiusOf(e) - 1e-9);
      }
      if (links(seeds).filter((l) => { const ts = twinSince(l, seeds); return ts !== null && t >= ts; }).length >= 2) twinned++;
    }
    // Mutation guard: the bound must really carry twin hours (dropping a link or the rate would fail above).
    expect(twinned).toBeGreaterThan(10);
  });
  it("equals effAge exactly when no link is twinned yet", () => {
    const far = [mk("x", 200, 300, ["y"]), mk("y", 260, 300, ["x"])], t = T0 + 5 * DAY;
    for (const s of far) expect(effAgeUpper(s, far, t)).toBe(effAge(s, far, t));
  });
});
