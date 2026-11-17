import { describe, it, expect } from "vitest";
import { effAge, ageMemoStats, AGE_SLOTS, type Seed } from "./world";

const H = 3.6e6, DAY = 864e5, c0 = Date.parse("2026-11-12T00:00:00Z");
const mk = (id: string, x: number, y: number, extra: Partial<Seed> = {}): Seed =>
  ({ id, name: id, owner: id, x, y, hue: 0, realm: "europe", user_id: id, created_at: new Date(c0).toISOString(), bought: [], ...extra });
const world = () => {
  const a = mk("a", 500, 340, { charter: { path: "craft", at: c0 + DAY }, bought: [
    { item: "belfry1", at: c0 + 10 * DAY }, { item: "cathedral1", at: c0 + 30 * DAY }, { item: "herbs", at: c0 + 5 * DAY }, { item: "hunter", at: c0 + 4 * DAY }] });
  const b = mk("b", 515, 340, { created_at: new Date(c0 - 60 * DAY).toISOString() });
  return { a, b, seeds: [a, b] };
};
/** Reference value without any cache: a fresh array per call can never hit ageMemo. */
const fresh = (s: Seed, seeds: Seed[], t: number) => effAge(s, [...seeds], t);

describe("effAge multi-slot LRU", () => {
  it("now → now+1h → now: identical values and the third call is served from its slot", () => {
    const { a, seeds } = world(), now = c0 + 120 * DAY;
    const ref0 = fresh(a, seeds, now), ref1 = fresh(a, seeds, now + H);
    const m0 = ageMemoStats.misses;
    const v1 = effAge(a, seeds, now), v2 = effAge(a, seeds, now + H);
    const m1 = ageMemoStats.misses;
    const v3 = effAge(a, seeds, now);
    expect(ageMemoStats.misses).toBe(m1); // no recomputation of effAgeBase for the first timestamp
    expect(m1 - m0).toBeGreaterThanOrEqual(2); // both timestamps computed (plus nested [s] calls)
    expect([v1, v2, v3]).toEqual([ref0, ref1, ref0]);
  });
  it("arbitrary alternation over 4 timestamps: no misses after warm-up, exact values", () => {
    const { a, seeds } = world(), ts = [0, 1, 2, 3].map((k) => c0 + 90 * DAY + k * H);
    const ref = ts.map((t) => fresh(a, seeds, t));
    ts.forEach((t) => effAge(a, seeds, t));
    const m = ageMemoStats.misses;
    for (const k of [3, 0, 2, 1, 0, 3, 3, 1, 2, 0]) expect(effAge(a, seeds, ts[k]!)).toBe(ref[k]);
    expect(ageMemoStats.misses).toBe(m);
  });
  it("more than AGE_SLOTS timestamps evicts the least recently used one", () => {
    const { a, seeds } = world(), ts = Array.from({ length: AGE_SLOTS + 1 }, (_, k) => c0 + 60 * DAY + k * H);
    for (let k = 0; k < AGE_SLOTS; k++) effAge(a, seeds, ts[k]!);
    effAge(a, seeds, ts[0]!); // ts[0] most recent, ts[1] now least recent
    effAge(a, seeds, ts[AGE_SLOTS]!); // evicts ts[1]
    let m = ageMemoStats.misses;
    effAge(a, seeds, ts[0]!); effAge(a, seeds, ts[2]!); effAge(a, seeds, ts[AGE_SLOTS]!);
    expect(ageMemoStats.misses).toBe(m);
    m = ageMemoStats.misses;
    expect(effAge(a, seeds, ts[1]!)).toBe(fresh(a, seeds, ts[1]!));
    expect(ageMemoStats.misses).toBeGreaterThan(m);
  });
  it("different seeds in one slot never share results", () => {
    const { a, b, seeds } = world(), now = c0 + 100 * DAY;
    expect(effAge(a, seeds, now)).toBe(fresh(a, seeds, now));
    expect(effAge(b, seeds, now)).toBe(fresh(b, seeds, now));
    expect(effAge(a, seeds, now)).not.toBe(effAge(b, seeds, now));
  });
  it("historical timestamps and the recursive [s] paths (sawmill, care gate, monuments) stay exact", () => {
    const { a, seeds } = world();
    for (const d of [1, 14, 45, 150, 300, 500]) {
      const t = c0 + d * DAY;
      expect(effAge(a, seeds, t)).toBe(fresh(a, seeds, t));
      expect(effAge(a, [a], t)).toBe(fresh(a, [a], t));
    }
  });
});
