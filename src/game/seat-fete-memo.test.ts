import { describe, it, expect } from "vitest";
import "./rank";
import { seatFete, rankMemoStats } from "./people";
import { baseMemoCfg, type Seed } from "./world";

const mk = (id: string, x: number, y: number, at: string, user = true) =>
  ({ id, name: id, owner: "", x, y, hue: 30, created_at: at, ...(user ? { user_id: `u-${id}` } : {}) }) as unknown as Seed;
const map = () => [mk("a", 520, 480, "2026-03-01T00:00:00Z"), mk("b", 560, 500, "2026-04-01T00:00:00Z"), mk("c", 500, 540, "2026-05-01T00:00:00Z", false)];

describe("seatFete with the effAgeBase memo (P.3d)", () => {
  it("returns exactly the same result as the unmemoised reference at many times", () => {
    const t0 = Date.parse("2026-08-01T00:00:00Z");
    for (let i = 0; i < 6; i++) {
      const t = t0 + i * 7 * 864e5 + i * 3.7e5;
      baseMemoCfg.on = false; const ref = map(); const A = seatFete(ref[0]!, ref, t);
      baseMemoCfg.on = true; const nw = map(); const B = seatFete(nw[0]!, nw, t);
      expect(B).toEqual(A);
    }
  });
  it("recomputes historical ranks when rows change but the village count stays the same", () => {
    const t = Date.parse("2026-08-20T10:07:00Z");
    const s1 = map(); seatFete(s1[0]!, s1, t);
    const m0 = rankMemoStats.misses;
    const s2 = s1.map((s) => (s.id === "a" ? { ...s, blessed: [t - 3 * 864e5] } : s));
    seatFete(s2[0]!, s2, t);
    expect(rankMemoStats.misses).toBeGreaterThan(m0);
    const m1 = rankMemoStats.misses;
    seatFete(s2[0]!, [...s2], t); // same content, new array: served from the cache
    expect(rankMemoStats.misses).toBe(m1);
  });
});
