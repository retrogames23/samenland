import { describe, it, expect } from "vitest";
import { chronicle } from "./chronicle";
import { citizensOf, townOf } from "./people";
import type { Seed } from "./world";

const seed = { id: "pop-test", x: 512, y: 512, name: "P", hue: 30, created_at: new Date(0).toISOString() } as Seed;

describe("population", () => {
  it("chronicle counts the real residents living in homes", () => {
    const to = 30 * 864e5;
    const c = chronicle(seed, [seed], to - 7 * 864e5, to);
    expect(c.popTo).toBe(citizensOf(townOf(seed, [seed], to)).length);
  });
  it("residents arrive in whole households, not one by one", () => {
    let prev = townOf(seed, [seed], 864e5).people.length, jumps = 0;
    for (let h = 25; h < 24 * 20; h++) {
      const n = townOf(seed, [seed], h * 3.6e6).people.length;
      if (n - prev >= 2) jumps++;
      prev = n;
    }
    expect(jumps).toBeGreaterThan(0);
  });
});
