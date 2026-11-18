import { describe, it, expect, beforeEach } from "vitest";
import "./rank";
import { seatFete, rankMemoStats, resetRankMemo } from "./people";
import { rankInput } from "./rank";
import { setBiome } from "./biome";
import { baseMemoCfg, type Seed } from "./world";

const mk = (id: string, x: number, y: number, at: string, user = true, realm = "europe") =>
  ({ id, name: id, owner: "", x, y, hue: 30, created_at: at, realm, ...(user ? { user_id: `u-${id}` } : {}) }) as unknown as Seed;
const map = (realm = "europe") => [mk("a", 520, 480, "2026-03-01T00:00:00Z", true, realm), mk("b", 560, 500, "2026-04-01T00:00:00Z", true, realm), mk("c", 500, 540, "2026-05-01T00:00:00Z", false, realm)];
/** Independent run: empty rank cache, chosen effAgeBase path, counts real effAgeBase work. */
function run(memo: boolean, seeds: Seed[], t: number) {
  resetRankMemo(); baseMemoCfg.on = memo; baseMemoCfg.misses = 0;
  const m0 = rankMemoStats.misses;
  const r = seatFete(seeds[0]!, seeds, t);
  return { r, rankCalls: rankMemoStats.misses - m0, baseMisses: baseMemoCfg.misses };
}
beforeEach(() => { setBiome("europe"); baseMemoCfg.on = true; resetRankMemo(); });

describe("seatFete with the effAgeBase memo (P.3d / P.3d.1)", () => {
  it("1+2+3+9: reference (raw) and memo run independently and agree at many times, in either order", () => {
    const t0 = Date.parse("2026-08-01T00:00:00Z");
    for (let i = 0; i < 6; i++) {
      const t = t0 + i * 7 * 864e5 + i * 3.7e5;
      const A = run(false, map(), t), B = run(true, map(), t);
      expect(A.rankCalls).toBeGreaterThan(0); expect(B.rankCalls).toBe(A.rankCalls); // both really recompute every rank
      expect(A.baseMisses).toBe(0); expect(B.baseMisses).toBeGreaterThan(0); // raw path vs memo path
      expect(B.r).toEqual(A.r);
      const B2 = run(true, map(), t), A2 = run(false, map(), t); // reversed order
      expect(B2.r).toEqual(A2.r); expect(A2.r).toEqual(A.r);
    }
  });
  it("4+5: repeated call and new array with identical content hit the cache", () => {
    const t = Date.parse("2026-08-20T10:07:00Z"); const s = map();
    seatFete(s[0]!, s, t); const m = rankMemoStats.misses;
    seatFete(s[0]!, s, t); expect(rankMemoStats.misses).toBe(m);
    const c = map(); seatFete(c[0]!, c, t); expect(rankMemoStats.misses).toBe(m);
  });
  it("6: changed rows at the same village count recompute", () => {
    const t = Date.parse("2026-08-20T10:07:00Z"); const s1 = map(); seatFete(s1[0]!, s1, t);
    const m0 = rankMemoStats.misses;
    const s2 = s1.map((s) => (s.id === "a" ? { ...s, blessed: [t - 3 * 864e5] } : s));
    seatFete(s2[0]!, s2, t); expect(rankMemoStats.misses).toBeGreaterThan(m0);
  });
  it("7+8: identical rows in another realm never reuse cached ranks (terrain differs per realm)", () => {
    const t = Date.parse("2026-08-01T00:00:00Z");
    const one = (realm: string) => [mk("x1", 590, 480, "2025-01-01T00:00:00Z", true, realm)];
    setBiome("europe"); const e = one("europe"); const ie = rankInput(e[0]!, e, t);
    setBiome("asia"); const a = one("asia"); const ia = rankInput(a[0]!, a, t);
    expect(ia.citizens).not.toBe(ie.citizens); // proven realm dependency (81 vs 93)
    setBiome("europe"); seatFete(e[0]!, e, t); const m0 = rankMemoStats.misses;
    setBiome("asia"); seatFete(a[0]!, a, t);
    expect(rankMemoStats.misses).toBeGreaterThan(m0); // asia had to compute its own ranks
  });
});
