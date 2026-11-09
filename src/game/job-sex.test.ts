import { describe, it, expect } from "vitest";
import { jobKey } from "./people";
describe("trade names", () => {
  it("beguines are named beguines, other herbalists stay herbalists", () => {
    expect(jobKey({ job: "herbalist", beguine: true })).toBe("beguine");
    expect(jobKey({ job: "herbalist" })).toBe("herbalist");
  });
});
