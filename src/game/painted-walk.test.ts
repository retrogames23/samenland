import { describe, expect, it } from "vitest";
import { MAN_WALK12 } from "./man-walk12-data";
import {
  PAINTED_DUR,
  PAINTED_FRAMES,
  PAINTED_LOOP,
  PAINTED_MIN_STEP,
  paintedFrame,
  paintedSlide,
} from "./painted-walk";
import { resetGait, stepGait } from "./walk-rig";

describe("painted 12-frame walk (P6c)", () => {
  it("prepared frames share one anchor: head centred, same top and ground line", () => {
    expect(MAN_WALK12.frames).toHaveLength(PAINTED_FRAMES);
    for (const f of MAN_WALK12.frames) {
      expect(Math.abs(f.head - 100)).toBeLessThan(1);
      expect(f.top).toBe(MAN_WALK12.frames[0]!.top);
      expect(f.bottom).toBe(MAN_WALK12.ground);
    }
  });
  it("walks the frames in order, each at least the minimum stretch, and wraps to frame 0", () => {
    const seen: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const f = paintedFrame(i / 1000);
      if (seen[seen.length - 1] !== f) seen.push(f);
    }
    expect(seen).toEqual([...Array(PAINTED_FRAMES).keys()]);
    expect(paintedFrame(0.99999)).toBe(PAINTED_FRAMES - 1);
    expect(paintedFrame(1)).toBe(0);
    expect(paintedFrame(-0.001)).toBe(PAINTED_FRAMES - 1);
    for (const d of PAINTED_DUR) expect(d).toBeGreaterThanOrEqual(PAINTED_MIN_STEP);
    expect(PAINTED_LOOP).toBeCloseTo(PAINTED_DUR.reduce((a, b) => a + b, 0));
  });
  it("the shift keeps the figure on its ground anchor on average", () => {
    let s = 0;
    const N = 20000;
    for (let i = 0; i < N; i++) s += paintedSlide(i / N);
    expect(Math.abs(s / N)).toBeLessThan(0.05);
    for (let i = 0; i < N; i++) expect(Math.abs(paintedSlide(i / N))).toBeLessThan(13);
  });
  it("while the painted front sole moves back, it stays on its ground spot across frame changes", () => {
    // ground under the figure at loop phase u is u·LOOP; the drawn sole sits at heel + slide; planted = heel + slide + ground constant
    const pos = (u: number) =>
      MAN_WALK12.frames[paintedFrame(u)]!.heel + paintedSlide(u) + u * PAINTED_LOOP;
    for (let f = 2; f <= 8; f++) {
      const start = PAINTED_DUR.slice(0, f).reduce((a, b) => a + b, 0) / PAINTED_LOOP,
        end = start + PAINTED_DUR[f]! / PAINTED_LOOP;
      const next = MAN_WALK12.frames[f + 1]!,
        cur = MAN_WALK12.frames[f]!;
      if (cur.heel - next.heel < PAINTED_MIN_STEP) continue; // not a planted stretch
      expect(Math.abs(pos(end - 1e-6) - pos(end + 1e-6))).toBeLessThan(0.05);
      expect(Math.abs(pos(start + 1e-6) - pos(end - 1e-6))).toBeLessThan(0.05);
    }
  });
  it("is driven by distance, not time: standing still keeps the frame; stopping finishes the step and rests on frame 0", () => {
    resetGait();
    let g = stepGait(7, 0, true, 10, 0, 0, PAINTED_LOOP);
    g = stepGait(7, 2, true, 10, 100, 0, PAINTED_LOOP); // 20 px walked
    expect(g.u).toBeCloseTo(20 / PAINTED_LOOP);
    const held = stepGait(7, 2, true, 10, 2000, 0, PAINTED_LOOP); // time passes, no distance
    expect(held.u).toBeCloseTo(g.u);
    let t = 2000,
      u = held.u;
    for (let i = 0; i < 40; i++) {
      t += 16;
      u = stepGait(7, 2, false, 10, t, 0, PAINTED_LOOP).u;
    }
    expect(u).toBe(0);
    expect(stepGait(7, 2, false, 10, t + 16, 0, PAINTED_LOOP).ai).toBe(0);
  });
  it("same distance gives the same frame at 30 and 120 fps", () => {
    const run = (fps: number) => {
      resetGait();
      let g = { u: 0, ai: 0 };
      for (let i = 0; i <= fps * 2; i++)
        g = stepGait(9, i * (3 / fps), true, 25, (i * 1000) / fps, 0, PAINTED_LOOP);
      return g.u;
    };
    expect(run(30)).toBeCloseTo(run(120), 6);
  });
});
