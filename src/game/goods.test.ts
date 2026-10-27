import { describe, it, expect } from "vitest";
import { townOf, poseOf } from "./people";

const seed = { id: "g1", name: "Testdorf", x: 500, y: 500, created_at: new Date(Date.UTC(2025, 0, 1)).toISOString(), user_id: null } as never;
const NOW = Date.UTC(2026, 9, 27, 10, 0, 0);

describe("supply chains", () => {
  it("a mature town has carriers with goods and destinations", () => {
    const t = townOf(seed, [seed], NOW);
    expect(t.people.some((p) => p.haul)).toBe(true);
  });
  it("carried goods are deterministic and only carried outbound", () => {
    const t = townOf(seed, [seed], NOW);
    let seen = 0;
    for (let m = 0; m < 30; m++) {
      const now = NOW + m * 20000;
      for (const p of t.people.filter((p) => p.haul)) {
        const a = poseOf(p, t, [seed], now), b = poseOf(p, t, [seed], now);
        expect(a.carry).toBe(b.carry);
        if (a.carry) { seen++; expect(a.carry).toBe(p.haul!.good); expect(a.walking).toBe(true); }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});
