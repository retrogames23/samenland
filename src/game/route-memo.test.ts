import { describe, it, expect, beforeEach } from "vitest";
import { transitRoutes, hubRoutes, transitRoutesRaw, hubRoutesRaw, routeMemoCfg, type Seed } from "./world";
import { setBiome } from "./biome";

const mk = (id: string, x: number, y: number, at: string, user = true, realm = "europe", roads: { target: string; at: number }[] = []) =>
  ({ id, name: id, owner: "", x, y, hue: 30, created_at: at, realm, roads, ...(user ? { user_id: `u-${id}` } : {}) }) as unknown as Seed;
const T = Date.parse("2026-03-01T00:00:00Z"), D = 864e5;
const sig = (s: Seed, seeds: Seed[], now: number) => ({
  t: JSON.stringify(transitRoutes(s, seeds).map((r) => [r.to.id, r.via.id, r.since, r.d, r.bonus(now)])),
  h: JSON.stringify(hubRoutes(s, seeds).map((r) => r.since)),
});
const ref = (s: Seed, seeds: Seed[], now: number) => ({
  t: JSON.stringify(transitRoutesRaw(s, seeds).map((r) => [r.to.id, r.via.id, r.since, r.d, r.bonus(now)])),
  h: JSON.stringify(hubRoutesRaw(s, seeds).map((r) => r.since)),
});
function world(realm = "europe", oneSided = false, extra = false) {
  const a = mk("a", 500, 500, "2026-01-01T00:00:00Z", true, realm, [{ target: "b", at: T }]);
  const b = mk("b", 540, 500, "2026-01-05T00:00:00Z", true, realm, oneSided ? [] : [{ target: "a", at: T + D }, { target: "c", at: T + 2 * D }]);
  const c = mk("c", 580, 505, "2026-01-10T00:00:00Z", false, realm);
  const d = mk("d", 900, 900, "2026-01-10T00:00:00Z", true, realm);
  return extra ? [a, b, c, d, mk("e", 545, 540, "2026-01-12T00:00:00Z", false, realm)] : [a, b, c, d];
}
beforeEach(() => { setBiome("europe"); routeMemoCfg.on = true; });

describe("transitRoutes/hubRoutes memo (P.8a)", () => {
  it("bit-identical to the uncached reference: alone, one-/two-sided roads, networks, realms, many times", () => {
    for (const realm of ["europe", "asia"]) for (const one of [false, true]) for (const ex of [false, true]) {
      setBiome(realm as "europe"); const w = world(realm, one, ex);
      for (const now of [T, T + 10 * D, T + 200 * D]) for (const s of w) { expect(sig(s, w, now)).toEqual(ref(s, w, now)); expect(sig(s, w, now)).toEqual(ref(s, w, now)); }
    }
  });
  it("second call hits the cache and returns the same frozen array", () => {
    const w = world(); const m0 = routeMemoCfg.transitMisses;
    const r1 = transitRoutes(w[0]!, w), r2 = transitRoutes(w[0]!, w);
    expect(r2).toBe(r1); expect(Object.isFrozen(r1)).toBe(true); expect(routeMemoCfg.transitMisses - m0).toBe(1);
  });
  it("changed roads, new seeds and replaced seed objects recompute (realtime updates)", () => {
    const w1 = world(); const before = sig(w1[1]!, w1, T + 30 * D);
    const w2 = [...w1.slice(0, 3).map((s) => (s.id === "b" ? { ...s, roads: [] } : s)), w1[3]!];
    expect(sig(w2[1]!, w2, T + 30 * D)).toEqual(ref(w2[1]!, w2, T + 30 * D));
    const w3 = [...w1, mk("e", 545, 540, "2026-01-12T00:00:00Z", false)];
    for (const s of w3) expect(sig(s, w3, T + 30 * D)).toEqual(ref(s, w3, T + 30 * D));
    expect(sig(w1[1]!, w1, T + 30 * D)).toEqual(before);
  });
});
