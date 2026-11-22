import { describe, it, expect } from "vitest";
import { structureAt, type Seed } from "./world";

// A freshly founded village shows exactly one campfire (core tile +1/+1); the centre is the well's building site.
const born = Date.UTC(2026, 10, 22, 2, 0);
const s = {
  id: "v",
  name: "V",
  owner: "o",
  x: 400,
  y: 512,
  hue: 0,
  user_id: "u",
  roads: [],
  created_at: new Date(born).toISOString(),
} as unknown as Seed;
const at = (min: number) => born + min * 60e3;

describe("one campfire after founding", () => {
  it("the centre is a well building site during the first minutes, not a campfire", () => {
    for (const m of [0.5, 3, 8]) {
      const c = structureAt(s.x, s.y, [s], at(m));
      expect(c?.kind).toBe("well");
      expect(c?.build).toBeGreaterThanOrEqual(0);
      expect(c?.build).toBeLessThan(1);
    }
  });
  it("the well is finished well before the first hours are over", () => {
    const c = structureAt(s.x, s.y, [s], at(120));
    expect(c?.kind).toBe("well");
    expect(c?.build).toBeUndefined();
  });
  it("only the core tile carries a campfire", () => {
    for (const m of [3, 8, 30]) {
      let fires = 0;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          if (structureAt(s.x + dx, s.y + dy, [s], at(m))?.kind === "campfire") fires++;
      expect(fires, `${m} min`).toBeLessThanOrEqual(1);
    }
  });
});
