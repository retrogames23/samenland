import { describe, it, expect } from "vitest";
import { characterOf, terrain, MAP } from "./world";

describe("village character", () => {
  it("is stable for the same spot", () => expect(characterOf(401, 544)).toBe(characterOf(401, 544)));
  it("a spot surrounded by water is a coast village", () => {
    for (let y = 20; y < MAP; y += 37) for (let x = 20; x < MAP; x += 37) {
      let w = 0; for (let j = -10; j <= 10; j += 5) for (let i = -10; i <= 10; i += 5) if (["water", "deep"].includes(terrain(x + i, y + j))) w++;
      if (w >= 20 && terrain(x, y) !== "deep") { expect(characterOf(x, y)).toBe("coast"); return; }
    }
  });
  it("all four characters exist on the map", () => {
    const set = new Set<string>();
    for (let y = 30; y < MAP; y += 41) for (let x = 30; x < MAP; x += 41) set.add(characterOf(x, y));
    expect(set.size).toBe(4);
  });
});
