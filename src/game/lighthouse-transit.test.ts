import { describe, it, expect } from "vitest";
import { transitRoutes, monumentChain, LIGHTHOUSE_TRANSIT, type Seed } from "./world";
import { larderOf } from "./goods";
import { townCharacter } from "./character";

// Integration: real A–B–C transit routes and the real larder, coastal vs. inland.
const T = Date.parse("2026-03-02T06:00:00Z"), DAY = 864e5, C = "2025-01-01T00:00:00Z";
const mk = (x: number, y: number, own = false): Seed => ({ id: `t${x}_${y}${own ? "o" : ""}`, name: "T", owner: "o", hue: 1, x, y, created_at: C, ...(own ? { user_id: "u" } : {}) } as Seed);
const isCoast = (s: Seed) => townCharacter(s).main === "gateway";
const grid: Seed[] = [];
for (let y = 60; y < 940; y += 20) for (let x = 60; x < 940; x += 20) grid.push(mk(x, y));
const dist = (a: Seed, b: Seed) => Math.hypot(a.x - b.x, a.y - b.y);
/** first chain s–via–to with s owned, s↔to not linkable (> 80), coast pattern chosen by `want` */
function chain(want: (s: Seed, v: Seed, t: Seed) => boolean) {
  for (const a of grid) for (const v of grid) {
    const d1 = dist(a, v); if (d1 < 45 || d1 > 70) continue;
    for (const t of grid) {
      const d2 = dist(v, t); if (d2 < 45 || d2 > 70 || dist(a, t) <= 85) continue;
      const s = mk(a.x, a.y, true);
      if (want(s, v, t)) return { s, v, t };
    }
  }
  return null;
}
function routeBonus(s0: Seed, v: Seed, t: Seed, steps: number) {
  const s: Seed = { ...s0, id: `${s0.id}-${steps}`, roads: [{ target: v.id, at: T - 60 * DAY }],
    bought: Array.from({ length: steps }, (_, i) => ({ item: `lighthouse${i + 1}`, at: T + i, ...(i ? {} : { x: s0.x + 2, y: s0.y + 1 }) })) } as Seed;
  const now = steps ? monumentChain(s, "lighthouse")[steps - 1]!.done + 1 : T + 30 * DAY;
  const r = transitRoutes(s, [s, v, t]).find((r) => r.to.id === t.id);
  return { r, now, s };
}

describe("Leuchtturm Stufe 3: echter Transitbonus", () => {
  it("Küstenstadt: Route C erhält ×1,2 erst mit fertiger Stufe 3", () => {
    const c = chain((s, v, t) => isCoast(s) && !isCoast(v) && !isCoast(t))!;
    expect(c).toBeTruthy();
    const with3 = routeBonus(c.s, c.v, c.t, 3), none = routeBonus(c.s, c.v, c.t, 0);
    expect(with3.r && none.r).toBeTruthy();
    expect(with3.r!.bonus(with3.now) / none.r!.bonus(with3.now)).toBeCloseTo(LIGHTHOUSE_TRANSIT, 5);
    const two = routeBonus(c.s, c.v, c.t, 2);
    expect(two.r!.bonus(two.now) / none.r!.bonus(two.now)).toBeCloseTo(1, 5);
  });
  it("Binnenstadt mit Küsten-Mittelstadt: ×1,2", () => {
    const c = chain((s, v, t) => !isCoast(s) && isCoast(v) && !isCoast(t));
    if (!c) return; // map offers no such constellation
    const with3 = routeBonus(c.s, c.v, c.t, 3), none = routeBonus(c.s, c.v, c.t, 0);
    expect(with3.r!.bonus(with3.now) / none.r!.bonus(with3.now)).toBeCloseTo(LIGHTHOUSE_TRANSIT, 5);
  });
  it("keine der drei Städte an der Küste: kein Bonus", () => {
    const c = chain((s, v, t) => !isCoast(s) && !isCoast(v) && !isCoast(t))!;
    expect(c).toBeTruthy();
    const with3 = routeBonus(c.s, c.v, c.t, 3), none = routeBonus(c.s, c.v, c.t, 0);
    expect(with3.r!.bonus(with3.now) / none.r!.bonus(with3.now)).toBeCloseTo(1, 5);
  });
});

describe("Leuchtturm Stufe 1: Vorrat ohne Fischerei", () => {
  it("ohne Fischerei entsteht im Winter kein Fisch", () => {
    const base = grid.find(isCoast)!;
    const s: Seed = { ...mk(base.x, base.y, true), id: "lf", bought: [{ item: "lighthouse1", at: T, x: base.x + 2, y: base.y + 1 }] } as Seed;
    const winter = Date.parse("2027-01-15T12:00:00Z");
    expect(monumentChain(s, "lighthouse")[0]!.done).toBeLessThan(winter);
    const fish = larderOf(s, [s], winter).flows.find((f) => f.ware === "fish");
    expect(fish?.made ?? 0).toBe(0);
  });
});
