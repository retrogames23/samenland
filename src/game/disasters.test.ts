import { describe, it, expect } from "vitest";
import { raids, raidLoss, fires, floodFood, floods, RAID_LOSS } from "./disasters";
import type { Seed } from "./world";

const DAY = 864e5, c0 = Date.parse("2026-01-01T00:00:00Z");
const base: Seed = { id: "dis1", name: "T", owner: "o", x: 400, y: 540, hue: 1, created_at: new Date(c0).toISOString() };

describe("disasters", () => {
  it("first raid on day 10, then every 17 days, 25 Taler each", () => {
    expect(raids(base, c0 + 9.9 * DAY)).toHaveLength(0);
    expect(raidLoss(base, c0 + 10 * DAY)).toBe(RAID_LOSS);
    expect(raidLoss(base, c0 + 27 * DAY)).toBe(50);
    expect(RAID_LOSS).toBe(25);
  });
  it("a town guard bought before a raid catches the robber", () => {
    const s = { ...base, bought: [{ item: "guard", at: c0 + 20 * DAY }] };
    expect(raidLoss(s, c0 + 27 * DAY)).toBe(25);
  });
  it("with a fire house no fire ever destroys houses for rebuilding", () => {
    const s = { ...base, bought: [{ item: "firehouse", at: c0 }] };
    expect(fires(s, c0 + 400 * DAY).every((f) => f.guarded && !f.dead)).toBe(true);
  });
  it("floods cost food while under water and bring richer harvests after", () => {
    const wet = [base, { ...base, id: "dis2" }, { ...base, id: "dis3" }].flatMap((s) => floods(s, c0 + 700 * DAY).map((f) => [s, f] as const));
    for (const [s, f] of wet.slice(0, 3)) {
      expect(floodFood(s, f.at + 3600e3)).toBeLessThan(0);
      expect(floodFood(s, f.end + DAY)).toBeGreaterThan(0);
    }
  });
});
