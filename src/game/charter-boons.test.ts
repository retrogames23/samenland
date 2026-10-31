import { describe, expect, it } from "vitest";
import { sickRate } from "./people";
import { craftRepair } from "./disasters";
import type { Seed } from "./world";

const base: Seed = { id: "c1", name: "T", owner: "o", x: 0, y: 0, hue: 0, created_at: "2026-06-01T00:00:00Z", user_id: "u" };
const at = Date.parse("2026-07-01T12:00:00Z");

describe("charter boons", () => {
  it("culture charter lowers the sickness chance by 2 points", () => {
    const c = { ...base, charter: { path: "culture" as const, at: at - 1 } };
    expect(sickRate(base, at) - sickRate(c, at)).toBeCloseTo(0.02);
  });
  it("craft charter rebuilds twice as fast, only after sealing", () => {
    const c = { ...base, charter: { path: "craft" as const, at } };
    expect(craftRepair(c, at + 1)).toBe(2);
    expect(craftRepair(c, at - 1)).toBe(1);
    expect(craftRepair(base, at)).toBe(1);
  });
});

import { careStage } from "./world";
describe("culture library counts as health care", () => {
  it("library replaces a second health building for the care gate", () => {
    const mk = (items: string[]) => ({ ...base, user_id: "u", bought: items.map((item) => ({ item, at: 0 })) });
    expect(careStage(mk(["fisher", "hunter", "granary", "herbs"]), at + 1)).toBe(4);
    expect(careStage(mk(["fisher", "hunter", "granary", "herbs", "library"]), at + 1)).toBe(5);
  });
});
