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
  it("belfry shortens fires by 10 % / 15 % / 25 % at steps 1 / 2 / 3", () => {
    expect(BELFRY_FIRE).toEqual([0.9, 0.85, 0.75]);
  });
});

import { tradeCapOf, transitShare, tradeFactor, seaDist, careStage } from "./world";
import { sickRate } from "./people";
import { townCharacter } from "./character";
describe("monument step effects (paid steps)", () => {
  const T = Date.parse("2026-03-01T00:00:00Z");
  const town = (steps: string[]): Seed => ({ id: "mfx", name: "M", owner: "o", hue: 1, x: 400, y: 540, user_id: "u", created_at: "2026-01-01T00:00:00Z", bought: steps.map((item) => ({ item, at: T })) } as Seed);
  it("exchange: routed trade 0.75 → 0.80 (step 2) → 0.85 (step 4)", () => {
    expect(transitShare(town(["exchange1"]), T + 1)).toBe(0.75);
    expect(transitShare(town(["exchange1", "exchange2"]), T + 1)).toBe(0.8);
    expect(transitShare(town(["exchange1", "exchange2", "exchange3", "exchange4"]), T + 1)).toBe(0.85);
  });
  it("orangery step 2 acts like a herb hut", () => {
    const at = Date.parse("2026-07-21T00:00:00Z");
    expect(sickRate(town(["orangery1", "orangery2"]), at)).toBeCloseTo(sickRate(town(["herbs"]), at));
  });
});
