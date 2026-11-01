import { describe, expect, it } from "vitest";
import { allowed, openRewards, tierOf } from "./supporter";

describe("supporter rewards", () => {
  it("3 € unlocks only 3-euro rewards", () => {
    expect(allowed("support_3", "vane")).toBe(true);
    expect(allowed("support_3", "statue")).toBe(false);
  });
  it("5 € unlocks 5-euro and 3-euro rewards", () => {
    expect(allowed("support_5", "statue")).toBe(true);
    expect(allowed("support_5", "seal")).toBe(true);
  });
  it("unknown rewards are never allowed", () => expect(allowed("support_10", "dragon")).toBe(false));
  it("already granted rewards are no longer selectable", () => {
    expect(openRewards(["statue", "seal"])).not.toContain("statue");
    expect(openRewards(["statue", "seal"])).toHaveLength(6);
  });
  it("tiers are 3 and 5 euro", () => { expect(tierOf("linden")).toBe(5); expect(tierOf("lanterns")).toBe(3); });
});
