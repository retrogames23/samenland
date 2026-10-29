import { describe, it, expect } from "vitest";
import { sacksAt, fishingNow, breadOut } from "./crafts";

describe("craft scenes", () => {
  it("fisher rests at night, on Sundays and on winter ice", () => {
    expect(fishingNow(10, false, 0)).toBe(true);
    expect(fishingNow(2, false, 0)).toBe(false);
    expect(fishingNow(10, true, 0)).toBe(false);
    expect(fishingNow(10, false, 0.9)).toBe(false);
  });
  it("flour sack stack grows through the workday", () => {
    expect(sacksAt(5, false)).toBe(0);
    expect(sacksAt(7, false)).toBe(1);
    expect(sacksAt(17, false)).toBe(4);
    expect(sacksAt(12, true)).toBe(0);
    expect(sacksAt(9, false)).toBeLessThanOrEqual(sacksAt(15, false));
  });
  it("bread basket only by day", () => {
    expect(breadOut(10)).toBe(true);
    expect(breadOut(23)).toBe(false);
  });
});
