import { describe, it, expect } from "vitest";
import { TRANSIT_SHARE, TRANSIT_HUB } from "./world";
describe("trade networks", () => {
  it("routed trade yields three quarters of a direct road", () => expect(TRANSIT_SHARE).toBe(0.75));
  it("hub earns +2 % per routed pair", () => expect(TRANSIT_HUB).toBe(0.02));
});
