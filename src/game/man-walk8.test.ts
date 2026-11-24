import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  WALK8_DUR,
  WALK8_FRAMES,
  WALK8_LOOP,
  WALK8_REST,
  WALK8_SCALE,
  walk8Bob,
  walk8Frame,
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
