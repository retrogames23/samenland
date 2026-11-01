import { describe, it, expect } from "vitest";
import { townOf } from "./people";

describe("smiths", () => {
  it("a forge has at most two smiths and only one hammers outdoors", () => {
    const s = { id: "448114c1-5110-4677-89e5-bc4e7ebaf616", name: "Testau", realm: "lab", x: 307, y: 460, created_at: "2024-10-27T23:40:00Z" } as never;
    const t = townOf(s, [s], Date.parse("2026-11-01T12:00:00Z"));
    const per = new Map<string, { all: number; out: number }>();
    for (const p of t.people) if (p.job === "smith" && p.work) {
      const k = p.work.join(","), e = per.get(k) ?? { all: 0, out: 0 };
      e.all++; if (!p.workIndoor) e.out++; per.set(k, e);
    }
    expect(per.size).toBeGreaterThan(0);
    for (const e of per.values()) expect(e.out).toBeLessThanOrEqual(1);
  }, 30000);
});
