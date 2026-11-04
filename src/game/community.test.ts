import { describe, it, expect } from "vitest";
import { ITEMS } from "./economy";
import { ITEM_STAGE } from "./disasters";
import { specialBuild, type Seed } from "./world";
import { sickRate } from "./people";
const base: Seed = { id: "c1", name: "a", owner: "o", x: 500, y: 500, hue: 0, created_at: "2026-01-01T00:00:00Z" };
describe("community buildings", () => {
  it("prices and unlock eras", () => {
    expect([ITEMS.backhaus, ITEMS.herberge, ITEMS.beginen]).toEqual([260, 420, 900]);
    expect([ITEM_STAGE.backhaus, ITEM_STAGE.herberge, ITEM_STAGE.beginen]).toEqual([2, 2, 3]);
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
