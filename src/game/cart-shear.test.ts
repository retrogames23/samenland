import { describe, it, expect } from "vitest";
import { cartShear } from "./render";
describe("cartShear", () => {
  it("keeps the painted 2:1 diagonal untouched", () => {
    expect(cartShear(2, 1, false)).toBeCloseTo(0);
    expect(cartShear(2, -1, true)).toBeCloseTo(0);
  });
  it("tilts the team downward on a steep southbound road", () => {
    expect(cartShear(0.1, 1, false)).toBeGreaterThan(0.9);
  });
});
