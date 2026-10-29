import { describe, it, expect } from "vitest";
import { RANK_PRICE, rankOf, rankBlock, rankBoons } from "./economy";
import type { Seed } from "./world";

const now = Date.parse("2027-06-01T00:00:00Z");
const base: Seed = { id: "a", name: "A", owner: "o", x: 0, y: 0, hue: 0, created_at: new Date(now - 200 * 3.6e6).toISOString(), charter: { path: "culture", at: 0 } };
const p = (item: string) => ({ seed_id: "a", item });

describe("guild ranks", () => {
  it("journeyman costs 250, master 800", () => { expect(RANK_PRICE).toEqual({ rank2: 250, rank3: 800 }); });
  it("journeyman needs the own guild building", () => {
    expect(rankBlock(base, [], now, 0)).toBe("guild");
    expect(rankBlock(base, [p("library")], now, 0)).toBeNull();
  });
  it("journeyman needs village stage age (168 h)", () => {
    const young = { ...base, created_at: new Date(now - 100 * 3.6e6).toISOString() };
    expect(rankBlock(young, [p("library")], now, 0)).toBe("age");
  });
  it("master needs belfry and two roads", () => {
    const old = { ...base, created_at: new Date(now - 4400 * 3.6e6).toISOString() };
    expect(rankBlock(old, [p("rank2")], now, 2)).toBe("belfry");
    expect(rankBlock(old, [p("rank2"), p("belfry4")], now, 1)).toBe("roads");
    expect(rankBlock(old, [p("rank2"), p("belfry4")], now, 2)).toBeNull();
  });
  it("culture master gives +30 health in total", () => {
    expect(rankOf(base, [p("rank2"), p("rank3")])).toBe(3);
    expect(rankBoons(base, [p("rank2"), p("rank3")]).health).toBe(30);
  });
});
