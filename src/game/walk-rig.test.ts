import { describe, expect, it } from "vitest";
import {
  GROUND,
  RIG_AMPS,
  RIG_FRAMES,
  STANCE,
  STEP,
  anklePath,
  gaitPose,
  rigSlide,
  solveKnee,
  stepGait,
} from "./walk-rig";
import { MAN_RIG } from "./man-rig-data";

const J = MAN_RIG.joints;
const len = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);

describe("reference walker gait (P6)", () => {
  it("the planted foot does not slide: its contact point stays on one ground spot for the whole stance", () => {
    // body moves 2·STEP per cycle; contact point in world = relative position + body travel
    for (const side of ["near", "far"] as const) {
      const sole = (phi: number) => {
        const a = anklePath(side, phi, STEP);
        return a;
      };
      let heel0 = NaN;
      for (let phi = 0; phi < 0.42; phi += 0.01) {
        const a = sole(phi),
          body = 2 * STEP * phi;
        // heel locked until the heel rises (flat foot from 0.1): ankle above a fixed ground point
        if (phi >= 0.1) {
          const x = a.ankle[0] + body;
          if (Number.isNaN(heel0)) heel0 = x;
          expect(Math.abs(x - heel0)).toBeLessThan(0.01);
        }
        expect(a.stance).toBe(true);
      }
    }
  });
  it("the swing foot leaves and lands exactly where the stance put it (no pop at toe-off or heel strike)", () => {
    for (const side of ["near", "far"] as const) {
      const a0 = anklePath(side, STANCE - 1e-4, STEP),
        a1 = anklePath(side, STANCE + 1e-4, STEP);
      const b0 = anklePath(side, 1 - 1e-4, STEP),
        b1 = anklePath(side, 0, STEP);
      expect(len(a0.ankle, a1.ankle)).toBeLessThan(0.2);
      expect(Math.abs(a0.sole - a1.sole)).toBeLessThan(0.01);
      expect(len(b0.ankle, b1.ankle)).toBeLessThan(0.2);
      expect(Math.abs(b0.sole - b1.sole)).toBeLessThan(0.01);
    }
  });
  it("loops seamlessly and moves smoothly: no joint jumps more than a few px between neighbouring frames", () => {
    let prev = gaitPose(0, 1);
    for (let i = 1; i <= RIG_FRAMES; i++) {
      const p = gaitPose(i / RIG_FRAMES, 1);
      for (const s of ["near", "far"] as const) {
        expect(len(p.legs[s].ankle, prev.legs[s].ankle)).toBeLessThan(12);
        expect(len(p.legs[s].knee, prev.legs[s].knee)).toBeLessThan(8);
      }
      expect(Math.abs(p.pelvisY - prev.pelvisY)).toBeLessThan(1.5);
      prev = p;
    }
    const a = gaitPose(0, 1),
      b = gaitPose(1, 1);
    expect(len(a.legs.near.ankle, b.legs.near.ankle)).toBeLessThan(1e-6);
  });
  it("legs keep their painted length (IK) and knees never bend backwards", () => {
    for (let i = 0; i < 64; i++) {
      const p = gaitPose(i / 64, 1);
      for (const s of ["near", "far"] as const) {
        const L = p.legs[s],
          j = J[s];
        expect(len(L.hip, L.knee)).toBeCloseTo(len(j.hip, j.knee), 3);
        expect(len(L.knee, L.ankle)).toBeLessThanOrEqual(len(j.knee, j.ankle) + 1e-3);
        // knee in front of the hip–ankle line (figure faces +x): cross product sign
        const cr =
          (L.ankle[0] - L.hip[0]) * (L.knee[1] - L.hip[1]) -
          (L.ankle[1] - L.hip[1]) * (L.knee[0] - L.hip[0]);
        expect(cr).toBeLessThanOrEqual(1e-6);
      }
    }
    expect(solveKnee([0, 0], [0, 500], 50, 40)[1]).toBeGreaterThan(0); // out of reach: clamped, not NaN
  });
  it("feet never sink below the ground; the swing foot clears it", () => {
    let maxLift = 0;
    for (let i = 0; i < 100; i++)
      for (const s of ["near", "far"] as const) {
        const a = anklePath(s, i / 100, STEP);
        expect(a.ankle[1]).toBeLessThan(GROUND);
        if (!a.stance) maxLift = Math.max(maxLift, anklePath(s, 0.3, STEP).ankle[1] - a.ankle[1]);
      }
    expect(maxLift).toBeGreaterThan(8);
  });
  it("weight shift: the pelvis is highest over a single straight stance leg and lowest in double support", () => {
    const ys = Array.from({ length: 100 }, (_, i) => gaitPose(i / 100, 1).pelvisY);
    const bob = Math.max(...ys) - Math.min(...ys);
    expect(bob).toBeGreaterThan(2);
    expect(bob).toBeLessThan(10); // ≈ 1–4 % of the figure height
    expect(gaitPose(0.31, 1).pelvisY).toBeLessThan(gaitPose(0.02, 1).pelvisY); // mid-stance higher (smaller y)
  });
  it("arms swing against the legs: the near arm is forward when the far foot lands", () => {
    const fwd = (u: number) => Math.PI / 2 - gaitPose(u, 1).arms.near.upper;
    expect(fwd(0.5)).toBeGreaterThan(0.2);
    expect(fwd(0)).toBeLessThan(-0.1);
    const far = (u: number) => Math.PI / 2 - gaitPose(u, 1).arms.far.upper;
    expect(far(0)).toBeGreaterThan(0.2);
    expect(far(0.5)).toBeLessThan(-0.1);
  });
  it("standing is the same body at zero stride: feet side by side under the hips, arms hanging", () => {
    const p = gaitPose(0.37, 0);
    expect(Math.abs(p.legs.near.ankle[0] - p.legs.near.hip[0])).toBeLessThan(3);
    expect(Math.abs(p.legs.far.ankle[0] - p.legs.far.hip[0])).toBeLessThan(3);
    expect(Math.abs(p.arms.near.upper - Math.PI / 2)).toBeLessThan(0.06);
  });
  it("sub-frame slide follows the planted foot (one frame = 1/RIG_FRAMES of two steps)", () => {
    expect(rigSlide(RIG_AMPS.length - 1, 1)).toBeCloseTo(-(2 * STEP) / RIG_FRAMES, 6);
    expect(rigSlide(0, 0.5)).toBe(-0);
  });
});

describe("gait driver (distance-driven, frame-rate independent)", () => {
  it("advances the cycle by distance only: same distance at 60 or 15 fps gives the same phase", () => {
    const run = (id: number, fps: number) => {
      let r = { u: 0, ai: 0 };
      for (let k = 0; k <= 4 * fps; k++)
        r = stepGait(id, (k / fps) * 10, true, 30, 1000 + (k * 1000) / fps, 0);
      return r;
    };
    const a = run(9001, 60),
      b = run(9002, 15);
    expect(a.ai).toBe(RIG_AMPS.length - 1);
    expect(b.ai).toBe(a.ai);
    expect(Math.abs(a.u - b.u)).toBeLessThan(1e-6);
  });
  it("standing still settles to the standing pose; a jump in the path phase is not taken as a stride", () => {
    let r = { u: 0, ai: 0 };
    for (let k = 0; k < 60; k++) r = stepGait(9003, k, true, 30, 1000 + k * 33, 0);
    const u0 = r.u;
    r = stepGait(9003, 500, true, 30, 1000 + 60 * 33, 0); // re-sync: 440 phase units at once
    expect(Math.abs(r.u - u0)).toBeLessThan(0.2);
    for (let k = 0; k < 30; k++) r = stepGait(9003, 500, false, 30, 3000 + k * 33, 0);
    expect(r.ai).toBe(0);
  });
});
