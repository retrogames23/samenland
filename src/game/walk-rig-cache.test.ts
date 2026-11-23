import { afterAll, describe, expect, it, vi } from "vitest";

// a canvas stand-in: every 2D call is a no-op, so the cache bookkeeping can be checked without a real canvas
const ctx = new Proxy(
  {},
  { get: (_t, k) => (k === "canvas" ? undefined : () => undefined), set: () => true },
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
});
