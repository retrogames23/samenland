import { describe, it, expect } from "vitest";
import { throwArc, iso, ROOF_LIFT } from "./render";

// Bucket chain: the water must fly from the pail onto the burning roof, not 5 units sideways onto the pavement.
describe("bucket throw toward the blaze", () => {
  it("starts at the rim and lands on the target, in any direction", () => {
    for (const [tx, ty] of [
      [40, -20],
      [-35, -30],
      [5, -45],
      [-20, 10],
    ] as const) {
      const a = throwArc(0, 0, tx, ty);
      expect(a.at(0)).toEqual([0, 0]);
      const [ex, ey] = a.at(1);
      expect(ex).toBeCloseTo(tx, 6);
      expect(ey).toBeCloseTo(ty, 6);
    }
  });
  it("arcs above the straight line, higher for longer throws (6..14 units)", () => {
    const near = throwArc(0, 0, 10, 0),
      far = throwArc(0, 0, 60, -20);
    expect(near.at(0.5)[1]).toBeCloseTo(-near.h, 6);
    expect(near.h).toBeGreaterThanOrEqual(6);
    expect(far.h).toBeGreaterThan(near.h);
    expect(far.h).toBeLessThanOrEqual(14);
  });
  it("a helper two tiles south of the fire reaches its roof, not his own feet", () => {
    const [hx, hy] = iso(102, 100),
      [fx, fy] = iso(100, 100);
    const [ex, ey] = throwArc(hx, hy - 3.2, fx, fy - ROOF_LIFT).at(1);
    expect(Math.hypot(ex - fx, ey - (fy - ROOF_LIFT))).toBeLessThan(1e-6);
    expect(Math.hypot(ex - hx, ey - hy)).toBeGreaterThan(30); // old arc: about 6 units from the pail
  });
});
