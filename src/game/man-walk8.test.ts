import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  WALK8_DUR,
  WALK8_FRAMES,
  WALK8_HIP,
  WALK8_LOOP,
  WALK8_REST,
  WALK8_SCALE,
  WALK8_STRIDE,
  walk8Bob,
  WALK8_PAIR,
  resetWalk8Pairs,
  walk8Across,
  walk8Frame,
  walk8Pair,
  walk8PairOffset,
} from "./man-walk8";
import { LOOP_SETTLE_S, resetGait, stepGait } from "./walk-rig";

const GAIT = { len: WALK8_LOOP, rest: WALK8_REST };

describe("man-walk8: frame selection", () => {
  it("plays frames 0..7 in order once per loop and wraps 7 -> 0", () => {
    const seen: number[] = [];
    for (let i = 0; i < 1600; i++) {
      const f = walk8Frame(i / 800).f;
      if (seen[seen.length - 1] !== f) seen.push(f);
    }
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7]);
    expect(walk8Frame(1).f).toBe(0);
    expect(walk8Frame(-0.01).f).toBe(7);
    expect(WALK8_DUR.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });
  it("rests in the middle of the passing frames 2 and 6", () => {
    expect(WALK8_REST.map((u) => walk8Frame(u).f)).toEqual([2, 6]);
  });
  it("bob: down at contact (frames 0 and 4), up at passing (2 and 6)", () => {
    expect(walk8Bob(0)).toBeCloseTo(0, 6);
    expect(walk8Bob(0.5)).toBeCloseTo(0, 6);
    expect(walk8Bob(0.25)).toBeCloseTo(1, 6);
    expect(walk8Bob(0.75)).toBeCloseTo(1, 6);
  });
  it("one common sheet scale, close to 1 (no per-frame scaling)", () => {
    expect(WALK8_SCALE).toBeGreaterThan(1);
    expect(WALK8_SCALE).toBeLessThan(1.05);
  });
});

describe("man-walk8: planted boot over a stance pair", () => {
  const across: [number, number] = [Math.SQRT1_2, -Math.SQRT1_2]; // straight across the screen
  const walk = (id: number, us: number[], dir: [number, number] = across, walking = true) =>
    us.map((u) => walk8PairOffset(id, u, walking, dir));
  it("loop length is the painted stride at the drawn scale; a pair covers two frames of ground", () => {
    expect(WALK8_LOOP).toBeCloseTo(WALK8_STRIDE * WALK8_SCALE, 9);
    expect(WALK8_PAIR).toBeCloseTo((2 * WALK8_LOOP) / 8, 9);
  });
  it("stance pairs are 1–2, 3–4, 5–6 and 7–0", () => {
    const pairOf = (f: number) => walk8Pair((f + 0.5) / 8).pair;
    expect([1, 2, 3, 4, 5, 6, 7, 0].map(pairOf)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
  it("walking: legs shift back by exactly the ground covered, continuous across 7 → 0 and 1 → 2", () => {
    resetWalk8Pairs();
    const us: number[] = [];
    for (let i = 0; i <= 1700; i++) us.push((7 / 8 + i / 3200) % 1); // 400 steps a frame: pair 7–0, then 1–2
    const off = walk(1, us),
      d = WALK8_LOOP / 3200;
    // inside the pair 7–0 (steps 0..799): sole keeps its ground spot, no jump at 7 → 0 (step 400)
    for (let i = 1; i < 800; i++) expect(off[i - 1]! - off[i]!).toBeCloseTo(d, 6);
    expect(off[0]!).toBeCloseTo(WALK8_PAIR / 2, 6);
    expect(off[799]!).toBeCloseTo(-WALK8_PAIR / 2 + d, 6);
    // the reset happens only where the next pair begins (0 → 1, the foot change)
    expect(off[800]! - off[799]!).toBeGreaterThan(WALK8_PAIR * 0.9);
    // 1 → 2 (step 1200) lies inside the next pair: continuous again
    for (let i = 801; i < 1600; i++) expect(off[i - 1]! - off[i]!).toBeCloseTo(d, 6);
  });
  it("zero on average over a pair, at most half a pair of ground either way", () => {
    resetWalk8Pairs();
    const off = walk(
      2,
      Array.from({ length: 1000 }, (_, i) => 3 / 8 + (i + 0.5) / 4000),
    );
    expect(Math.abs(off.reduce((a, b) => a + b, 0) / 1000)).toBeLessThan(1e-6);
    expect(Math.max(...off.map(Math.abs))).toBeLessThanOrEqual(WALK8_PAIR / 2 + 1e-9);
  });
  it("closing the step on the spot (not walking) holds the shift; a pair begun in place stays unsheared", () => {
    resetWalk8Pairs();
    const [a] = walk(3, [3.5 / 8]);
    expect(walk(3, [3.9 / 8], across, false)[0]).toBeCloseTo(a!, 9); // frame 3 → 4 in place: no ground, no change
    expect(walk(3, [5.2 / 8], across, false)[0]).toBeCloseTo(0, 9); // next pair reached in place: plain picture
  });
  it("a jump of the loop (new path) re-anchors instead of shearing far", () => {
    resetWalk8Pairs();
    walk(4, [1.1 / 8]);
    const [o] = walk(4, [4.4 / 8]);
    expect(Math.abs(o!)).toBeLessThanOrEqual(WALK8_PAIR / 2);
    expect(o!).toBeCloseTo(walk8PairOffset(99, 4.4 / 8, true, across), 9);
  });
  it("only the horizontal share of the movement is taken back (none when walking straight up or down)", () => {
    expect(walk8Across([Math.SQRT1_2, Math.SQRT1_2])).toBeCloseTo(0, 9);
    expect(walk8Across([1, 0]) / walk8Across(across)).toBeCloseTo(16 / Math.hypot(16, 8), 6);
  });
  it("the shear starts at the hip, below the tunic's belt; leg lean stays about 12° at most", () => {
    expect(WALK8_HIP).toBeGreaterThan(110);
    expect(WALK8_HIP).toBeLessThan(160);
    const leg = (237 + 3 - WALK8_HIP) * WALK8_SCALE; // hip to ground row, as drawn
    expect((Math.atan(WALK8_PAIR / 2 / leg) * 180) / Math.PI).toBeLessThan(12.5);
  });
});

describe("man-walk8: driven by the distance walked", () => {
  it("advances by screen distance over the painted stride; time alone moves nothing while walking", () => {
    resetGait();
    stepGait(1, 0, true, 10, 0, 0, GAIT);
    const g = stepGait(1, 4, true, 10, 100, 0, GAIT); // 40 px walked
    const u0 = WALK8_REST[0]!;
    expect(g.u).toBeCloseTo(u0 + 40 / WALK8_LOOP, 9);
    expect(stepGait(1, 4, true, 10, 3000, 0, GAIT).u).toBeCloseTo(g.u, 9);
  });
  it("same distance, same frame at 30 and 144 fps", () => {
    const run = (fps: number) => {
      resetGait();
      let u = 0;
      for (let i = 0; i <= fps * 3; i++)
        u = stepGait(2, i * (2 / fps), true, 25, (i * 1000) / fps, 0, GAIT).u;
      return u;
    };
    expect(run(30)).toBeCloseTo(run(144), 9);
  });
  it("a path jump (re-sync) is not a walk", () => {
    resetGait();
    stepGait(3, 0, true, 10, 0, 0, GAIT);
    const g = stepGait(3, 500, true, 10, 16, 0, GAIT);
    expect(g.u).toBeCloseTo(WALK8_REST[0]!, 9);
  });
  it("on stopping it closes the step on the spot to a passing frame, then stands (ai 0) and stays", () => {
    resetGait();
    let t = 0;
    stepGait(4, 0, true, 10, t, 0, GAIT);
    stepGait(4, 13, true, 10, (t += 400), 0, GAIT); // somewhere mid-stride
    let g = stepGait(4, 13, false, 10, (t += 16), 0, GAIT);
    expect(g.ai).toBeGreaterThan(0); // still finishing the step
    for (let i = 0; i < Math.ceil((LOOP_SETTLE_S * 1000) / 16) + 2; i++)
      g = stepGait(4, 13, false, 10, (t += 16), 0, GAIT);
    expect(g.ai).toBe(0);
    expect([2, 6]).toContain(walk8Frame(g.u).f);
    const held = stepGait(4, 13, false, 10, (t += 5000), 0, GAIT);
    expect(held.u).toBe(g.u);
    expect(held.ai).toBe(0);
  });
  it("starting from standing begins at a passing frame (no jump to a wide stride)", () => {
    resetGait();
    const g = stepGait(5, 0, false, 10, 0, 0, GAIT);
    expect(g.ai).toBe(0);
    const w = stepGait(5, 0.1, true, 10, 16, 0, GAIT);
    expect(walk8Frame(w.u).f).toBe(2);
  });
});

describe("man-walk8: asset", () => {
  it("is the delivered 8 × 160 × 240 atlas (lossless WebP)", () => {
    const b = readFileSync("src/assets/sprites/folk/man-walk8.webp");
    expect(b.subarray(0, 4).toString()).toBe("RIFF");
    expect(b.subarray(12, 16).toString()).toBe("VP8L"); // lossless: the painted pixels are kept exactly
    const w = 1 + (b[21]! | ((b[22]! & 0x3f) << 8)),
      h = 1 + ((b[22]! >> 6) | (b[23]! << 2) | ((b[24]! & 0x0f) << 10));
    expect([w, h]).toEqual([WALK8_FRAMES * 160, 240]);
  });
});
