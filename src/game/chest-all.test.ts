import { describe, it, expect } from "vitest";
import { walkChest, treasury, chestCap, CAP_ALL_SINCE, CHEST_SINCE, TAX_FOOD, type Purchase } from "./economy";
import { FOOD_CRAFTS, countFoodCrafts } from "./food-crafts";
import { wedGapHours } from "./weddings";
import { CARE_FOOD } from "./world";
import type { Seed } from "./world";

const cap = (c: number) => () => c;
const credit = (t: number, v: number) => ({ t, r: 2, v, k: `c${t}` });
const debit = (t: number, v: number) => ({ t, r: 3, v: -v, k: `d${t}` });

describe("chest cap for every income", () => {
  it("brief example: 24 900 +150 → 25 000, −500 → 24 500, +200 → 24 700", () => {
    expect(walkChest(24900, [credit(1, 150)], cap(25000))).toBe(25000);
    expect(walkChest(24900, [credit(1, 150), debit(2, 500)], cap(25000))).toBe(24500);
    expect(walkChest(24900, [credit(1, 150), debit(2, 500), credit(3, 200)], cap(25000))).toBe(24700);
  });
  it("lost surplus never comes back after spending", () => {
    expect(walkChest(1000, [credit(1, 900), debit(2, 300)], cap(1200))).toBe(900);
  });
  it("each level holds 1200 / 4000 / 10000 / 25000", () => {
    for (const c of [1200, 4000, 10000, 25000]) expect(walkChest(c - 10, [credit(1, 500)], cap(c))).toBe(c);
  });
  it("the cap valid at the moment of the booking applies", () => {
    const capAt = (t: number) => (t >= 5 ? 4000 : 1200);
    expect(walkChest(1100, [credit(1, 500), credit(6, 500)], capAt)).toBe(1700);
  });
  it("same-time order is fixed: tax, dowry, credits, debits, raids", () => {
    const ev = [{ t: 1, r: 3, v: -300, k: "p" }, { t: 1, r: 2, v: 300, k: "q" }];
    expect(walkChest(1200, ev, cap(1200))).toBe(900);
    expect(walkChest(1200, [...ev].reverse(), cap(1200))).toBe(900);
  });
  it("raids never push below zero", () => {
    expect(walkChest(10, [{ t: 1, r: 4, v: 40, k: "r" }], cap(1200))).toBe(0);
  });
  const seed = (created: number) => ({ id: "c", name: "T", owner: "o", hue: 0, x: 306, y: 420, created_at: new Date(created).toISOString(), user_id: "u", bought: [] }) as unknown as Seed;
  const claim = (at: number, reward: number) => ({ id: `q${at}`, seed_id: "c", quest: "x", reward, created_at: new Date(at).toISOString() });
  it("quest/market-type rewards respect the cap after the cutover", () => {
    const s = seed(CHEST_SINCE), now = CAP_ALL_SINCE + 5 * 864e5;
    const big = [claim(CAP_ALL_SINCE + 864e5, 5000)];
    expect(treasury(s, [], now, [], big)).toBeLessThanOrEqual(chestCap("c", []));
  });
  it("balances before the cutover are computed exactly as before", () => {
    const s = seed(CHEST_SINCE), now = CAP_ALL_SINCE - 864e5, big = [claim(CHEST_SINCE + 864e5, 5000)];
    expect(treasury(s, [], now, [], big)).toBe(treasury(s, [], now, [], big, Infinity));
    expect(treasury(s, [], now, [], big)).toBeGreaterThan(1200);
  });
  it("a balance above the cap at the cutover is kept, only new income is blocked", () => {
    const s = seed(CHEST_SINCE), big = [claim(CHEST_SINCE + 864e5, 5000)];
    const atCut = treasury(s, [], CAP_ALL_SINCE, [], big, Infinity);
    expect(atCut).toBeGreaterThan(1200);
    const buy: Purchase = { id: "p", seed_id: "c", item: "hunter", cost: 100, created_at: new Date(CAP_ALL_SINCE + 2 * 864e5).toISOString() };
    const later = treasury(s, [buy], CAP_ALL_SINCE + 3 * 864e5, [], big);
    expect(later).toBeLessThanOrEqual(atCut - 100 + 1);
  });
});

describe("food crafts", () => {
  it("are exactly fisher, hunter, granary, dairy", () => {
    expect([...FOOD_CRAFTS]).toEqual(["fisher", "hunter", "granary", "dairy"]);
    expect([...TAX_FOOD]).toEqual([...FOOD_CRAFTS]);
    expect(countFoodCrafts(new Set(["fisher", "hunter", "granary", "dairy"]))).toBe(4);
  });
  it("market hall and guild hall do not count", () => {
    expect(countFoodCrafts(new Set(["markethall", "guildhall"]))).toBe(0);
    const s = { id: "w", user_id: "u", x: 500, y: 500, created_at: "2026-01-01T00:00:00Z" } as unknown as Seed, t = Date.parse(s.created_at) + 30 * 864e5;
    const halls = { ...s, bought: [{ item: "markethall", at: 0 }, { item: "guildhall", at: 0 }] } as unknown as Seed;
    const fisher = { ...s, bought: [{ item: "fisher", at: 0 }] } as unknown as Seed;
    // halls only act through prosperity, never through the 4 % food-craft cut
    expect(wedGapHours(fisher, t)).toBeLessThan(wedGapHours(s, t));
    expect(wedGapHours(halls, t)).toBeGreaterThanOrEqual(Math.floor(wedGapHours(s, t) * 0.74));
  });
  it("the broader care-gate supply list is unchanged", () => {
    expect(CARE_FOOD).toEqual(["fisher", "hunter", "granary", "dairy", "markethall", "guildhall"]);
  });
});
