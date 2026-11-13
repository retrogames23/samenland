import { describe, it, expect } from "vitest";
import { specialBuild, SPECIAL_BUILD, type Seed } from "./world";
import { BELFRY_FIRE } from "./disasters";

const base: Seed = { id: "steps", name: "S", owner: "L", hue: 1, x: 300, y: 300, user_id: "u", created_at: "2026-01-01T00:00:00Z" };
const withSteps = (key: string, n: number): Seed => ({ ...base, bought: Array.from({ length: n }, (_, i) => ({ item: `${key}${i + 1}`, at: 0 })) });

describe("monument step boons", () => {
  it("each paid Zunftturm step makes bought buildings 5 % faster (15 % at the top)", () => {
    expect(specialBuild(withSteps("guildtower", 0))).toBe(SPECIAL_BUILD);
    expect(specialBuild(withSteps("guildtower", 1))).toBeCloseTo(SPECIAL_BUILD * 0.95);
    expect(specialBuild(withSteps("guildtower", 3))).toBeCloseTo(SPECIAL_BUILD * 0.85);
  });
  it("belfry shortens fires by 10 % from step 1 and 25 % from step 3", () => {
    expect(BELFRY_FIRE).toEqual([0.9, 0.75]);
  });
});
