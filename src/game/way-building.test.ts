import { describe, it, expect } from "vitest";
import { ITEMS, WAY_ITEM, WAY_BONUS, canBuyWay } from "./economy";
import { ITEM_RANK } from "./disasters";

const sum = (b: { food?: number; health?: number; wealth?: number }) => (b.food ?? 0) + (b.health ?? 0) + (b.wealth ?? 0);

describe("way buildings", () => {
  it("each character gets one Dorf building for 380 and one Handelsstadt building for 700", () => {
    for (const [small, big] of [["bigstore", "millrow"], ["stonemason", "hammerworks"], ["smokehouse", "saltquay"]] as const) {
      expect(ITEMS[small]).toBe(380); expect(ITEM_RANK[small]).toBe(1);
      expect(ITEMS[big]).toBe(700); expect(ITEM_RANK[big]).toBe(3);
    }
  });
  it("bonus totals are equal per tier (20 / 30)", () => {
    for (const k of ["bigstore", "stonemason", "smokehouse"]) expect(sum(WAY_BONUS[k]!)).toBe(20);
    for (const k of ["millrow", "hammerworks", "saltquay"]) expect(sum(WAY_BONUS[k]!)).toBe(30);
  });
  it("only the matching character may buy", () => {
    expect(WAY_ITEM.hammerworks).toBe("workshop");
    expect(canBuyWay("hammerworks", "workshop")).toBe(true);
    expect(canBuyWay("hammerworks", "grain")).toBe(false);
    expect(canBuyWay("herbs", "gateway")).toBe(true);
  });
});
