import { describe, expect, it } from "vitest";
import { MAN_RIG } from "./man-rig-data";
import { bodyWarp, gaitPose, ribbonCurve, type Pt } from "./walk-rig";

// P6d: continuous limbs (ribbons) and the row-warped body
describe("limb strips", () => {
  it("the rounded centre line keeps the joints it is pinned to and the limb length", () => {
    const pts: Pt[] = [
      [0, -10],
      [0, 0],
      [-30, 40],
      [-30, 80],
      [-30, 84],
    ];
    const c = ribbonCurve(pts, 9);
    const hip = c.at(10),
      ankle = c.at(10 + 50 + 40);
    expect(Math.hypot(hip[0] - 0, hip[1] - 0)).toBeLessThan(0.6);
    expect(Math.hypot(ankle[0] + 30, ankle[1] - 80)).toBeLessThan(0.6);
    expect(c.len).toBeCloseTo(10 + 50 + 40 + 4, 6);
  });
  it("bends smoothly: no kink at the knee, consecutive bands stay within a pixel", () => {
    const P = gaitPose(0.75, 1),
      L = P.legs.near;
    const up = [L.hip[0] - L.knee[0], L.hip[1] - L.knee[1]],
      dn = [L.ankle[0] - L.knee[0], L.ankle[1] - L.knee[1]];
    const nu = Math.hypot(up[0]!, up[1]!),
      nd = Math.hypot(dn[0]!, dn[1]!);
    const c = ribbonCurve(
      [
        [L.hip[0] + (16 * up[0]!) / nu, L.hip[1] + (16 * up[1]!) / nu],
        L.hip,
        L.knee,
        L.ankle,
        [L.ankle[0] + (4 * dn[0]!) / nd, L.ankle[1] + (4 * dn[1]!) / nd],
      ],
      MAN_RIG.ribbons.near.rad,
    );
    let maxTurn = 0,
      maxGap = 0;
    for (let s = 0; s < c.len - 1; s += 1) {
      const a = c.at(s),
        b = c.at(s + 1);
      maxTurn = Math.max(maxTurn, Math.abs(b[2] - a[2]));
      maxGap = Math.max(maxGap, Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    expect(maxTurn).toBeLessThan(0.1); // < 6° per px of arc: the trousers' outer edge never opens between bands
    expect(maxGap).toBeLessThan(1.05);
  });
  it("the painted strips are as long as their rest line", () => {
    for (const k of ["far", "near", "armFar", "armNear"] as const) {
      const r = MAN_RIG.ribbons[k];
      const L = r.pts
        .slice(1)
        .reduce((a, p, i) => a + Math.hypot(p[0] - r.pts[i]![0], p[1] - r.pts[i]![1]), 0);
      expect(Math.abs(r.len - (Math.floor(L) + 1))).toBeLessThanOrEqual(1);
    }
  });
});

describe("body warp", () => {
  it("loops seamlessly and changes gently between cached poses", () => {
    const keys = ["twist", "hemF", "hemB", "head", "shoulderDy", "belt"] as const;
    const a = bodyWarp(0, 1),
      b = bodyWarp(1, 1);
    for (const k of keys) expect(a[k]).toBeCloseTo(b[k], 6);
    for (let i = 0; i < 64; i++) {
      const p = bodyWarp(i / 64, 1),
        q = bodyWarp((i + 1) / 64, 1);
      expect(Math.abs(p.hemF - q.hemF)).toBeLessThan(1.5);
      expect(Math.abs(p.hemB - q.hemB)).toBeLessThan(1.5);
      expect(Math.abs(p.twist - q.twist)).toBeLessThan(0.3);
      expect(Math.abs(p.head - q.head)).toBeLessThan(0.5);
    }
  });
  it("stays subtle: hem within a few px, belt end within a few degrees, head bobs less than the hips", () => {
    for (let i = 0; i < 64; i++) {
      const w = bodyWarp(i / 64, 1);
      expect(w.hemF).toBeGreaterThanOrEqual(0);
      expect(w.hemF).toBeLessThan(7);
      expect(w.hemB).toBeLessThanOrEqual(0);
      expect(w.hemB).toBeGreaterThan(-7);
      expect(Math.abs(w.belt)).toBeLessThan(0.1);
      expect(Math.abs(w.twist)).toBeLessThan(2);
    }
    const ys = Array.from({ length: 64 }, (_, i) => gaitPose(i / 64, 1).pelvisY);
    const bob = Math.max(...ys) - Math.min(...ys);
    const heads = Array.from(
      { length: 64 },
      (_, i) => gaitPose(i / 64, 1).pelvisY + bodyWarp(i / 64, 1).head,
    );
    expect(Math.max(...heads) - Math.min(...heads)).toBeLessThan(bob * 0.75);
  });
  it("standing: nothing moves", () => {
    const w = bodyWarp(0.3, 0);
    for (const v of [w.twist, w.hemF, w.hemB, w.head, w.shoulderDy, w.belt])
      expect(Math.abs(v)).toBeLessThan(1e-9);
  });
});
