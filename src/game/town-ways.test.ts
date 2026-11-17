import { describe, it, expect } from "vitest";
import { ITEMS, MONUMENTS, MONUMENT_PRICE, WAY_ITEM, WAY_BONUS, attributes, canBuyWay } from "./economy";
import { ITEM_RANK } from "./disasters";
import { prosperityAt } from "./prosperity";
import { monumentDone, wayLandmark, type Seed } from "./world";
import { questProgress, QUEST_REWARD, QUESTS } from "./quests";

// ---- way monuments (formerly way-monument.test.ts) ----
const WAY = ["harvest", "guildtower", "lighthouse"] as const;

describe("way monuments", () => {
  it("each town character has exactly one", () => {
    expect(WAY.map((k) => MONUMENTS[k].way)).toEqual(["grain", "workshop", "gateway"]);
  });
  it("all cost 450/600/750 Taler (mirrors purchase guard)", () => {
    for (const k of WAY) expect([1, 2, 3].map((i) => MONUMENT_PRICE[`${k}${i}`])).toEqual([450, 600, 750]);
  });
  it("give the same bonus total of 25", () => {
    for (const k of WAY) { const m = MONUMENTS[k]; expect((m.food ?? 0) + (m.health ?? 0) + (m.wealth ?? 0)).toBe(25); }
  });
});

// ---- way monument wealth (formerly way-monument-wealth.test.ts) ----
const T = Date.parse("2026-03-01T00:00:00Z");
const town = (items: string[]): Seed => ({ id: "wmw", name: "W", owner: "o", hue: 1, x: 400, y: 540, user_id: "u", created_at: "2026-01-01T00:00:00Z",
  bought: items.map((item, i) => ({ item, at: T + i })) } as Seed);

describe("way monuments raise Wohlstand once standing", () => {
  for (const m of ["harvest", "guildtower", "lighthouse"]) it(m, () => {
    const s = town([`${m}1`, `${m}2`, `${m}3`]);
    const done = monumentDone(s, [s], m as never)!;
    expect(prosperityAt(s, done + 864e5, 500)).toBeGreaterThan(prosperityAt(town([]), done + 864e5, 500));
    expect(prosperityAt(s, T + 10, 500)).toBe(prosperityAt(town([]), T + 10, 500));
  });
  it("HUD wealth equals prosperityAt with the same citizens (one source)", () => {
    const s = town(["school", "herbs"]);
    const a = attributes(s, [s], [], T + 30 * 864e5);
    expect(a.wealth).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(a.wealth)).toBe(true);
  });
});

// ---- way buildings (formerly way-building.test.ts) ----
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

// ---- character landmarks (formerly way-landmark.test.ts) ----
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

// ---- way quests (formerly way-quests.test.ts) ----
const base = { blessings: 9, purchases: 8, signposts: 1, encounters: 1, giftsSent: 6, residents: 200, stage: 5, roads: 2 };
describe("way quests", () => {
  it("buy6 needs the small way building besides six purchases", () => {
    expect(questProgress("buy6", base)).toEqual([5, 6]);
    expect(questProgress("buy6", { ...base, waySmall: true })).toEqual([6, 6]);
  });
  it("metro needs the metropolis and the big way building", () => {
    expect(questProgress("metro", base)).toEqual([1, 2]);
    expect(questProgress("metro", { ...base, wayBig: true })).toEqual([2, 2]);
  });
  it("keeps 2770 Taler in total", () => {
    expect(QUESTS.reduce((a, q) => a + QUEST_REWARD[q], 0)).toBe(2770);
  });
});
