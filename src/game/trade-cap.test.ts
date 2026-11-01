import { describe, it, expect } from "vitest";
import { softTrade, tollWealth, tradeCapOf, TRADE_CAP, type Seed } from "./world";

const seed = (over: Partial<Seed> = {}): Seed => ({ id: "t", name: "T", owner: "o", x: 300, y: 300, hue: 0, created_at: "2026-01-01T00:00:00Z", ...over });

describe("trade soft cap", () => {
  it("counts trade in full up to 35 %", () => expect(softTrade(0.3, 0.4)).toBeCloseTo(0.3));
  it("never drops below the old hard cap of 35 %", () => expect(softTrade(0.9, 0.4)).toBeGreaterThanOrEqual(TRADE_CAP));
  it("never reaches the town's ceiling", () => expect(softTrade(1.2, 0.4)).toBeLessThan(0.4));
  it("every extra road still adds a little", () => expect(softTrade(0.6, 0.4)).toBeGreaterThan(softTrade(0.5, 0.4)));
  it("ordinary towns have a 40 % ceiling", () => expect(tradeCapOf(seed(), Date.now())).toBeCloseTo(0.4));
  it("trade charter adds 10 %", () => expect(tradeCapOf(seed({ charter: { path: "trade", at: 0 } }), Date.now())).toBeCloseTo(0.5));
  it("market hall adds 5 %", () => expect(tradeCapOf(seed({ bought: [{ item: "markethall", at: 0 }] }), Date.now())).toBeCloseTo(0.45));
  it("toll gives 5 prosperity per 10 % surplus", () => expect(tollWealth(0.8, 0.4)).toBe(20));
  it("toll is capped at 20", () => expect(tollWealth(3, 0.4)).toBe(20));
  it("no toll below 10 % surplus", () => expect(tollWealth(0.45, 0.4)).toBe(0));
});
