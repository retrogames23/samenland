import { describe, it, expect } from "vitest";
import { huntScene, lodgeDens, denFate, denBeast, huntTarget, HUNT_CYCLE, REGEN } from "./wildlife";

// a lodge at (50,50) with a row of houses east of it and a road south of it
const blocked = (x: number, y: number) => (x >= 52 && x <= 58 && y >= 46 && y <= 50) || y === 54;
const free = (x: number, y: number) => !blocked(x, y) && !(x === 50 && y === 50);
const dens = lodgeDens(50, 50, free);

describe("free game and hunt", () => {
  it("has dens to hunt", () => expect(dens.length).toBeGreaterThan(0));
  it("animals never stand on buildings or roads", () => {
    for (let t = 0; t < HUNT_CYCLE * 6; t += 7000) {
      for (const b of huntScene(50, 50, t, free, dens).beasts) expect(blocked(Math.round(b.x), Math.round(b.y))).toBe(false);
      for (const [x, y] of dens) { const b = denBeast(x, y, t, free); expect(blocked(Math.round(b.x), Math.round(b.y))).toBe(false); }
    }
  });
  it("is deterministic", () => {
    expect(huntScene(50, 50, 123456, free, dens)).toEqual(huntScene(50, 50, 123456, free, dens));
  });
  it("a den is never hunted again before it has regrown", () => {
    for (const len of [1, 2, 3, 8]) {
      const last = new Map<number, number>();
      for (let c = 0; c < 200; c++) { const i = huntTarget(c, len); if (i === null) continue;
        const p = last.get(i); if (p !== undefined) expect((c - p) * HUNT_CYCLE).toBeGreaterThan(REGEN); last.set(i, c); }
    }
  });
  it("a hunted den is empty for a while, then has an animal again", () => {
    const phases = new Set<string>();
    for (let t = 0; t < HUNT_CYCLE * 40; t += 30000) phases.add(denFate(50, 50, 0, dens.length, t).phase);
    expect([...phases].sort()).toEqual(["free", "gone", "hunt"]);
  });
  it("hunter leaves, kneels and carries the deer home", () => {
    const frames = new Set<number>();
    for (let t = 0; t < HUNT_CYCLE * 20; t += 2000) { const h = huntScene(50, 50, t, free, dens).hunter; if (h) frames.add(h.frame); }
    expect([...frames].sort()).toEqual([0, 1, 2, 3]);
  });
});
