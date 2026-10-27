import { describe, it, expect } from "vitest";
import { charterReady, charterFits } from "./world";
describe("charter", () => {
  const now = Date.parse("2026-10-27T12:00:00Z");
  it("unlocks only after 24 hours (Weiler)", () => {
    expect(charterReady("2026-10-26T13:00:00Z", now)).toBe(false);
    expect(charterReady("2026-10-26T12:00:00Z", now)).toBe(true);
  });
  it("farming village fits the farm path but not trade", () => {
    expect(charterFits("plains", "farm")).toBe(true);
    expect(charterFits("plains", "trade")).toBe(false);
  });
});
