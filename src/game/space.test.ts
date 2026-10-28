import { describe, it, expect } from "vitest";
import { separate, sheepSpots, keepRight, FOOT } from "./space";

const ground = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, (b.y - a.y) * 2);

describe("personal space", () => {
  it("a child standing on a sheep is moved off it", () => {
    const kid = { x: 0, y: 0, r: FOOT.child, give: 0.5 }, sheep = { x: 0.3, y: 0.1, r: FOOT.sheep, give: 0.15 };
    separate([kid, sheep]);
    expect(ground(kid, sheep)).toBeGreaterThan((FOOT.child + FOOT.sheep) * 0.95);
  });
  it("sheep on a pasture never overlap over a whole day", () => {
    const day = Date.parse("2026-06-10T00:00:00Z");
    for (let m = 0; m < 24 * 60; m += 7) for (const sd of [101, 5007, 99013]) {
      const f = sheepSpots(sd, 0.9, day + m * 60000);
      for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++)
        expect(ground({ x: f[i]!.m.dx, y: f[i]!.m.dy }, { x: f[j]!.m.dx, y: f[j]!.m.dy })).toBeGreaterThan(FOOT.sheep * 2 * 0.9);
    }
  });
  it("oncoming carts pass on opposite sides of the road", () => {
    const a = keepRight(1, 0.5, 3.2), b = keepRight(-1, -0.5, 3.2);
    expect(Math.hypot(a[0] - b[0], (a[1] - b[1]) * 2)).toBeGreaterThan(5);
  });
});
