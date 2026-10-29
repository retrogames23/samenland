import { describe, it, expect } from "vitest";
import { huntScene, huntGrounds, HUNT_CYCLE } from "./wildlife";

// a lodge at (50,50) with a row of houses east of it and a road south of it
const blocked = (x: number, y: number) => (x >= 52 && x <= 58 && y >= 46 && y <= 50) || y === 54;
const free = (x: number, y: number) => !blocked(x, y) && !(x === 50 && y === 50);

describe("free hunt", () => {
  it("animals never stand on buildings or roads", () => {
    for (let t = 0; t < HUNT_CYCLE * 6; t += 7000) {
      for (const b of huntScene(50, 50, 50050, t, free).beasts) {
        expect(blocked(Math.round(b.x), Math.round(b.y))).toBe(false);
      }
    }
  });
  it("is deterministic", () => {
    expect(huntScene(50, 50, 50050, 123456, free)).toEqual(huntScene(50, 50, 50050, 123456, free));
  });
  it("hunting grounds lie away from the lodge door", () => {
    for (const [x, y] of huntGrounds(50, 50, free)) expect(Math.hypot(x - 50, y - 50)).toBeGreaterThanOrEqual(3);
  });
  it("hunter leaves, kneels and carries the deer home", () => {
    const frames = new Set<number>();
    for (let t = 0; t < HUNT_CYCLE; t += 2000) { const h = huntScene(50, 50, 50050, t, free).hunter; if (h) frames.add(h.frame); }
    expect([...frames].sort()).toEqual([0, 1, 2, 3]);
  });
});
