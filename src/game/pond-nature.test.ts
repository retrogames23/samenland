import { describe, it, expect } from "vitest";
import { natureBlocked } from "./render";
import { MAP } from "./world";

// A dug carp pond has no structure of its own, so the renderer used to draw the tile's wild tree into the water.
describe("no wild nature on carp ponds", () => {
  it("blocks exactly the pond tiles", () => {
    const ponds = new Set([512 * MAP + 300]);
    expect(natureBlocked(300, 512, ponds)).toBe(true);
    expect(natureBlocked(301, 512, ponds)).toBe(false);
    expect(natureBlocked(300, 511, ponds)).toBe(false);
  });
});
