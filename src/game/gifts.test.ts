import { describe, expect, it } from "vitest";
import { aidFactor, giftBalance, sentToday, thankable, type Gift } from "./gifts";
const g = (o: Partial<Gift>): Gift => ({ id: "g", from_seed: "a", to_seed: "b", kind: "gift", amount: 25, note: 0, created_at: new Date(0).toISOString(), ...o });
describe("gifts", () => {
  it("moves Taler from sender to receiver", () => { const l = [g({})]; expect(giftBalance("a", l)).toBe(-25); expect(giftBalance("b", l)).toBe(25); });
  it("one paid gift per day", () => { expect(sentToday("a", [g({})], 3600e3)).toBe(true); expect(sentToday("a", [g({})], 25 * 3600e3)).toBe(false); });
  it("a thank-you clears the pending gift", () => {
    expect(thankable("b", [g({})], 1000).length).toBe(1);
    expect(thankable("b", [g({}), g({ id: "t", kind: "thanks", from_seed: "b", to_seed: "a", amount: 0, created_at: new Date(500).toISOString() })], 1000).length).toBe(0);
  });
  it("aid near a disaster doubles rebuild speed", () => { expect(aidFactor([1e6], 1e6 + 3600e3)).toBe(2); expect(aidFactor([0], 1e9)).toBe(1); });
});
