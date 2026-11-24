import { afterAll, describe, expect, it, vi } from "vitest";

// a canvas stand-in: every 2D call is a no-op, so the cache bookkeeping can be checked without a real canvas
let drawDelay = 0; // ms each drawImage takes, to imitate a slow phone
const busy = (ms: number) => {
  const t = performance.now();
  while (performance.now() - t < ms);
};
const ctx = new Proxy(
  {},
  {
    get: (_t, k) =>
      k === "canvas" ? undefined : k === "drawImage" ? () => busy(drawDelay) : () => undefined,
    set: () => true,
  },
);
const made: { width: number; height: number }[] = [];
vi.stubGlobal("document", {
  createElement: () => {
    const c = { width: 0, height: 0, getContext: () => ctx };
    made.push(c);
    return c;
  },
});
afterAll(() => vi.unstubAllGlobals());

const R = await import("./walk-rig");
const atlas = { naturalWidth: 316, naturalHeight: 240 } as HTMLImageElement;

describe("rig cell cache", () => {
  it("picks the cell size by drawn height", () => {
    expect(R.rigScaleFor(30)).toBe(0);
    expect(R.rigScaleFor(100)).toBe(1);
    expect(R.rigScaleFor(220)).toBe(2);
  });
  it("builds each cell once and reuses it", () => {
    const a = R.rigFrame(atlas, 4, 3, 0),
      n = made.length;
    expect(R.rigFrame(atlas, 4, 3, 0)).toBe(a);
    expect(made.length).toBe(n);
  });
  it("spreads builds over frames: beyond the per-frame budget the nearest built cell is shown", () => {
    R.rigFrame(atlas, 4, 0, 1); // the scaled atlas copy for this cell size is made once, outside the count
    const before = made.length;
    for (let f = 10; f < 30; f++) R.rigFrame(atlas, 4, f, 1, 1000);
    // count- and time-limited: at least one cell per frame, never more than the count limit
    expect(made.length - before).toBeGreaterThanOrEqual(1);
    expect(made.length - before).toBeLessThanOrEqual(R.RIG_BUILDS_PER_FRAME);
    const next = made.length;
    R.rigFrame(atlas, 4, 20, 1, 1016); // next frame: budget refilled
    expect(made.length).toBe(next + 1);
  });
  it("stays under the byte cap, dropping the least recently drawn cells", () => {
    for (let ai = 1; ai < R.RIG_AMPS.length; ai++)
      for (let f = 0; f < R.RIG_FRAMES; f++) R.rigFrame(atlas, ai, f, 2);
    expect(R.rigCacheBytes()).toBeLessThanOrEqual(R.RIG_CACHE_MAX_BYTES);
    expect(R.rigCacheSize()).toBeGreaterThan(0);
    expect(made.some((c) => c.width === 0)).toBe(true); // evicted cells release their backing store
  });
  it("on a slow device a cell is built a step at a time: no frame blocks much longer than the budget", () => {
    drawDelay = 0.4; // several ms per cell: well over the budget if built at once
    let t = 5000,
      worst = 0;
    const shown: unknown[] = [];
    for (let i = 0; i < 30; i++) {
      t += 16;
      shown.push(R.rigFrame(atlas, 1, 37, 0, t)); // a pose no earlier test built
      worst = Math.max(worst, R.rigBuildSpent());
    }
    drawDelay = 0;
    const done = R.rigFrame(atlas, 1, 37, 0);
    expect(shown[0]).not.toBe(done); // first frames show a stand-in…
    expect(shown[shown.length - 1]).toBe(done); // …until the cell is finished
    // a step only starts if it still fits; only the first step of a frame may overshoot, by itself
    expect(worst).toBeLessThan(R.RIG_BUILD_MS + 5);
  });
  it("while a cell is unfinished the nearest finished pose of the same stride stands in", () => {
    R.rigFrame(atlas, 2, 10, 1); // built at once (no frame time)
    drawDelay = 0.5;
    const shown = R.rigFrame(atlas, 2, 11, 1, 9000);
    drawDelay = 0;
    expect(shown).toBe(R.rigFrame(atlas, 2, 10, 1));
  });
});
