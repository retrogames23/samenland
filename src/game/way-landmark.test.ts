import { describe, it, expect } from "vitest";
import { wayLandmark } from "./world";

describe("character landmarks", () => {
  it("hill towns get a dairy instead of the barn", () => expect(wayLandmark("barn", "workshop", false)).toBe("dairy"));
  it("water towns get a fisher's hut instead of the barn only by water", () => {
    expect(wayLandmark("barn", "gateway", true)).toBe("fishery");
    expect(wayLandmark("barn", "gateway", false)).toBe("barn");
  });
  it("farming towns get a granary at the warehouse site", () => expect(wayLandmark("warehouse", "grain", false)).toBe("granary"));
  it("water towns get a harbour at the warehouse site", () => expect(wayLandmark("warehouse", "gateway", true)).toBe("harbor"));
  it("other landmarks stay unchanged", () => expect(wayLandmark("chapel", "workshop", false)).toBe("chapel"));
});
