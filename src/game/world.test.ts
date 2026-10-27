import { describe, expect, it } from "vitest";
import { bonusOf, MIN_SEED_DISTANCE, TRADE_DIST } from "./world";

describe("trade synergy bonus", () => {
  it("is +10% for a far, young neighbour", () => {
    expect(bonusOf(TRADE_DIST, 0)).toBeCloseTo(0.1);
  });
  it("is +25% for the closest possible, mature neighbour", () => {
    expect(bonusOf(MIN_SEED_DISTANCE, 5000)).toBeCloseTo(0.25);
  });
});
