import { describe, expect, it } from "vitest";
import { pickDecision } from "./decision-order";
import { charterReady } from "./world";

describe("decision popups", () => {
  it("charter is not due before 24 hours", () => {
    const now = Date.parse("2026-10-27T12:00:00Z");
    expect(charterReady(new Date(now - 23 * 3.6e6).toISOString(), now)).toBe(false);
    expect(charterReady(new Date(now - 25 * 3.6e6).toISOString(), now)).toBe(true);
  });
  it("opens road before charter before encounter, skipping postponed ones", () => {
    const all = { road: true, charter: true, encounter: true };
    expect(pickDecision(all, () => false).open).toBe("road");
    expect(pickDecision(all, (k) => k === "road").open).toBe("charter");
    expect(pickDecision({ road: false, charter: false, encounter: true }, () => false).open).toBe("encounter");
    expect(pickDecision({ road: false, charter: false, encounter: false }, () => false).open).toBeNull();
  });
});
