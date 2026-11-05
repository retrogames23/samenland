import { describe, it, expect } from "vitest";
import { HOUSE_BUILD, GROWTH_PACE } from "./world";

describe("organic house build time", () => {
  it("an ordinary house site lasts at most two real hours at base pace, in every town size", () => {
    expect(HOUSE_BUILD / GROWTH_PACE).toBeLessThanOrEqual(2);
  });
});
