import { describe, it, expect } from "vitest";
import { visitReward } from "./economy";
describe("mayor visit gift", () => {
  it("starts at 30 Taler", () => expect(visitReward(2)).toBe(30));
  it("grows with town size", () => { expect(visitReward(24)).toBe(40); expect(visitReward(200)).toBe(50); expect(visitReward(3000)).toBe(75); expect(visitReward(5000)).toBe(100); expect(visitReward(9000)).toBe(150); });
});
