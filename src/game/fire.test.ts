import { describe, expect, it } from "vitest";
import { FIRE, FLAME_FRAMES, blazeSpots, fireLevel, flamePhase, flameStretch, flameWave, noise1, swing, type FireKind } from "./fire";

const KINDS: FireKind[] = ["hearth", "campfire", "blaze"];

describe("fire intensity (one value for flame, glow and light)", () => {
  it("smooth noise has no jumps and no kinks across knots", () => {
    for (let x = 0; x < 20; x += 0.001) expect(Math.abs(noise1(x + 0.001, 4) - noise1(x, 4))).toBeLessThan(0.002);
    for (let k = 1; k < 20; k++) { // slope just left and right of each knot agree (smoothstep: both ~0)
      const l = (noise1(k, 9) - noise1(k - 1e-4, 9)) / 1e-4, r = (noise1(k + 1e-4, 9) - noise1(k, 9)) / 1e-4;
      expect(Math.abs(l - r)).toBeLessThan(0.01);
    }
  });
  it("stays in 0..1, varies, and never strobes between two 60 fps frames", () => {
    for (const k of KINDS) {
      let lo = 1, hi = 0;
      for (let t = 0; t < 60_000; t += 16) {
        const a = fireLevel(k, t, 3.7), b = fireLevel(k, t + 16.7, 3.7);
        expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThanOrEqual(1);
        // what the eye sees between two frames: cast light and glow change by only a few percent
        expect(Math.abs(swing(b, FIRE[k].light) - swing(a, FIRE[k].light))).toBeLessThan(0.025);
        expect(Math.abs(swing(b, FIRE[k].glow) - swing(a, FIRE[k].glow))).toBeLessThan(0.03);
        lo = Math.min(lo, a); hi = Math.max(hi, a);
      }
      expect(hi - lo).toBeGreaterThan(0.3); // a living fire, not a constant
    }
  });
  it("cast light swings gently around 1: at most ±30 % and smooth", () => {
    for (const k of KINDS) for (let t = 0; t < 20_000; t += 50) {
      const l = swing(fireLevel(k, t, 1.1), FIRE[k].light);
      expect(l).toBeGreaterThanOrEqual(0.7); expect(l).toBeLessThanOrEqual(1.3);
    }
  });
  it("fire kinds differ: a forge is livelier than a burning house", () => {
    const busy = (k: FireKind) => { let d = 0; for (let t = 0; t < 30_000; t += 20) d += Math.abs(fireLevel(k, t + 20, 2) - fireLevel(k, t, 2)); return d; };
    expect(busy("hearth")).toBeGreaterThan(busy("campfire"));
    expect(busy("campfire")).toBeGreaterThan(busy("blaze"));
  });
  it("neighbouring fires flicker independently", () => {
    let same = 0;
    for (let t = 0; t < 10_000; t += 100) if (Math.abs(fireLevel("campfire", t, 1) - fireLevel("campfire", t, 2)) < 0.02) same++;
    expect(same).toBeLessThan(20);
  });
});

describe("flame strip (pre-rendered wavering frames)", () => {
  it("loops seamlessly: the frame after the last equals the first", () => {
    for (let v = 0; v <= 1; v += 0.05) {
      expect(flameWave(v, FLAME_FRAMES)).toBeCloseTo(flameWave(v, 0), 9);
      expect(flameStretch(v, FLAME_FRAMES)).toBeCloseTo(flameStretch(v, 0), 9);
    }
  });
  it("the root stays put while the tip moves; neighbouring frames differ only a little", () => {
    for (let f = 0; f < FLAME_FRAMES; f++) {
      expect(Math.abs(flameWave(1, f))).toBeLessThan(0.01);
      expect(flameStretch(1, f)).toBe(1);
      for (let v = 0; v <= 1; v += 0.1) expect(Math.abs(flameWave(v, f + 1) - flameWave(v, f))).toBeLessThan(4); // < 4 % of the frame width
    }
    const tip = Array.from({ length: FLAME_FRAMES }, (_, f) => flameWave(0.05, f));
    expect(Math.max(...tip) - Math.min(...tip)).toBeGreaterThan(8); // the tip really licks
  });
  it("tongue phase advances continuously (frame crossfade never jumps)", () => {
    for (const k of KINDS) for (let t = 0; t < 30_000; t += 16) {
      const a = flamePhase(k, t, 0.7), b = flamePhase(k, t + 16, 0.7);
      expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThan(FLAME_FRAMES);
      const d = ((b - a) % FLAME_FRAMES + FLAME_FRAMES) % FLAME_FRAMES;
      expect(Math.min(d, FLAME_FRAMES - d)).toBeLessThan(0.6);
    }
  });
});

describe("burning roof spots", () => {
  it("spread across the middle of the painting, ordered, 2–4 by width, jittered per house", () => {
    for (const w of [10, 18, 26, 40]) for (const sd of [1, 77, 12345]) {
      const u = blazeSpots(w, sd);
      expect(u.length).toBeGreaterThanOrEqual(2); expect(u.length).toBeLessThanOrEqual(4);
      for (const x of u) { expect(x).toBeGreaterThan(0.15); expect(x).toBeLessThan(0.85); }
      for (let i = 1; i < u.length; i++) expect(u[i]!).toBeGreaterThan(u[i - 1]!);
    }
    expect(blazeSpots(26, 1)).not.toEqual(blazeSpots(26, 2));
  });
});
