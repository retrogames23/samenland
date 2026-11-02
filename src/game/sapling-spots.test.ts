import { describe, it, expect } from "vitest";
import { saplingSpots } from "./saplings";
import { buildable, terrain, structureAt, canPlant } from "./world";

describe("sapling spots", () => {
  it("always offers at least 3 free meadow tiles, none built or planted", () => {
    const now = Date.now();
    for (let y = 150; y < 850; y += 140) for (let x = 150; x < 850; x += 140) {
      if (canPlant(x, y, []) !== null) continue;
      const s = { id: "t", x, y, created_at: new Date(now - 500 * 3.6e6).toISOString(), realm: "europe" } as never;
      const spots = saplingSpots(s, [s], (a, b) => a === x + 4 && b === y, now);
      expect(spots.length).toBeGreaterThanOrEqual(3);
      for (const [a, b] of spots) { expect(buildable(terrain(a, b))).toBe(true); expect(structureAt(a, b, [s], now)).toBeNull(); expect(a === x + 4 && b === y).toBe(false); }
    }
  });
});
