import { describe, it, expect } from "vitest";
import { MAP, terrain, resourceAt, canPlant, isWater, buildable } from "./world";

describe("world geography", () => {
  it("map is 1024 tiles wide", () => expect(MAP).toBe(1024));
  it("ore and bog iron only appear on hills or mountains", () => {
    for (let y = 0; y < MAP; y += 7) for (let x = 0; x < MAP; x += 7)
      if (resourceAt(x, y)) expect(["hill", "mountain"]).toContain(terrain(x, y));
  });
  it("mountains cannot be planted on", () => {
    let found = false;
    for (let y = 0; y < MAP && !found; y += 3) for (let x = 0; x < MAP && !found; x += 3)
      if (terrain(x, y) === "mountain") { expect(canPlant(x, y, [])).toBe("hill"); found = true; }
    expect(found).toBe(true);
  });
  it("hills are buildable ground and may be planted on", () => {
    expect(buildable("hill")).toBe(true);
    let found = false;
    for (let y = 0; y < MAP && !found; y += 3) for (let x = 0; x < MAP && !found; x += 3)
      if (terrain(x, y) === "hill") { expect(canPlant(x, y, [])).toBe(null); found = true; }
    expect(found).toBe(true);
  });
  it("water is reported as water, never as mountains", () => {
    let found = false;
    for (let y = 0; y < MAP && !found; y += 5) for (let x = 0; x < MAP && !found; x += 5)
      if (isWater(terrain(x, y))) { expect(canPlant(x, y, [])).toBe("water"); found = true; }
    expect(found).toBe(true);
  });
});
