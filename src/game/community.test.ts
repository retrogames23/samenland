import { describe, it, expect } from "vitest";
import { ITEMS, BADESTUBE_HEALTH, BADESTUBE_WEALTH } from "./economy";
import { SPECIAL_KIND } from "./world";
import { BATH_DAY } from "./people";
import { ITEM_RANK } from "./disasters";
import { specialBuild, type Seed } from "./world";
import { sickRate } from "./people";
const base: Seed = { id: "c1", name: "a", owner: "o", x: 500, y: 500, hue: 0, created_at: "2026-01-01T00:00:00Z" };
describe("community buildings", () => {
  it("prices and unlock eras", () => {
    expect([ITEMS.backhaus, ITEMS.herberge, ITEMS.beginen]).toEqual([260, 420, 900]);
    expect([ITEM_RANK["backhaus"], ITEM_RANK["herberge"], ITEM_RANK["beginen"]]).toEqual([1, 1, 2]);
  });
  it("bathhouse costs 700 Mark, unlocks at Kleinstadt, +10 health +5 prosperity, bath day Saturday", () => {
    expect(ITEMS.badestube).toBe(700);
    expect(ITEM_RANK["badestube"]).toBe(2);
    expect([BADESTUBE_HEALTH, BADESTUBE_WEALTH]).toEqual([10, 5]);
    expect(SPECIAL_KIND["badestube"]).toBe("badestube");
    expect(BATH_DAY).toBe(6);
  });
  it("hostel makes bought builds 15 % faster", () => {
    const h = { ...base, bought: [{ item: "herberge", at: 0 }] } as Seed;
    expect(specialBuild(h) / specialBuild(base)).toBeCloseTo(0.85);
  });
  it("beguinage lowers sickness", () => {
    const now = Date.parse("2026-06-01T12:00:00Z"), b = { ...base, bought: [{ item: "beginen", at: 0 }] } as Seed;
    expect(sickRate(base, now) - sickRate(b, now)).toBeCloseTo(0.015);
  });
});

import { bakeCost } from "./commons";
import { HERBERGE_WALZ } from "./wander";
describe("community follow-ups", () => {
  it("bake day is free with the Gemeindebackhaus, 10 Taler otherwise", () => {
    expect(bakeCost({ bought: [{ item: "backhaus", at: 0 }] } as never, "backtag", "bake", 10)).toBe(0);
    expect(bakeCost({ bought: [] } as never, "backtag", "bake", 10)).toBe(10);
  });
  it("Herberge draws journeymen more often than plain roads", () => {
    expect(HERBERGE_WALZ).toBeGreaterThan(0.3);
  });
});
