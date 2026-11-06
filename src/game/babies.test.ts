import { describe, expect, it } from "vitest";
import { canPlant, MAP, type Seed } from "./world";
import { townOf, poseOf, BABY_AGE } from "./people";

function spot(): [number, number] {
  for (let y = MAP / 2; y < MAP; y += 3) for (let x = MAP / 2; x < MAP; x += 3) if (canPlant(x, y, []) === null) return [x, y];
  throw new Error("no land");
}
const [sx, sy] = spot();
const BASE = Date.UTC(2026, 5, 10, 0, 0, 0);
const seed: Seed = { id: "baby-seed", name: "Wiegendorf", owner: "T", x: sx, y: sy, hue: 40, created_at: new Date(BASE - 300 * 864e5).toISOString() };

describe("little children", () => {
  it("babies under three are never seen outside, at any hour of the day", () => {
    expect(BABY_AGE).toBe(3);
    let babies = 0;
    for (let hr = 0; hr < 24; hr += 0.5) {
      const now = BASE + hr * 3600e3, t = townOf(seed, [seed], now);
      for (const p of t.people) if (p.job === "child" && p.age < 3) { babies++; expect(poseOf(p, t, [seed], now).visible).toBe(false); }
    }
    expect(babies).toBeGreaterThan(0);
  });
});
