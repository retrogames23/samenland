import { describe, it, expect } from "vitest";
import { taxPop, popAt } from "./economy";
const t0 = Date.parse("2026-01-01T00:00:00Z");
const s = (bought: string[] = []) => ({ id: "t", x: 500, y: 500, created_at: new Date(t0).toISOString(), user_id: "u", bought: bought.map((item) => ({ item, at: t0 })) }) as never;
describe("taxes follow the people the land can feed", () => {
  it("untended village pays for at most 85 people", () => expect(taxPop(s(), 5000, t0 + 1)).toBe(85));
  it("each food craft adds 25, each health craft 15", () => expect(taxPop(s(["fisher", "herbs"]), 5000, t0 + 1)).toBe(125));
  it("young village pays its own headcount", () => expect(taxPop(s(), 24, t0 + 1)).toBe(popAt(24)));
});
