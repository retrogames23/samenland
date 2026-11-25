// Ankauf (P1, migration 0151): the TypeScript mirror. The database rules themselves run in src/lib/ankauf.pg.test.ts.
import { describe, expect, it } from "vitest";
import {
  ANKAUF_PRICE,
  KONTOR_PRICE,
  ankaufItem,
  ankaufMark,
  isAnkauf,
  resourceDaily,
  resourceDay,
  resourceRates,
} from "./resources";
import { CAP_ALL_SINCE, CHEST_SINCE, chestCap, treasury, type Purchase } from "./economy";
import { isCivicMoney } from "./civic";
import type { Seed } from "./world";

describe("Ankauf: price and overflow", () => {
  it("pays half the Kontor base price: 2 Mark per wood, 3 Mark per stone", () => {
    expect(ANKAUF_PRICE).toEqual({ wood: 2, stone: 3 });
    expect(ANKAUF_PRICE.wood).toBe(KONTOR_PRICE.wood / 2);
    expect(ANKAUF_PRICE.stone).toBe(KONTOR_PRICE.stone / 2);
    expect(ankaufMark({ wood: 5, stone: 2 })).toBe(16);
    expect(ankaufMark({ wood: 0, stone: 0 })).toBe(0);
  });

  it("only the units above the storage cap are overflow; within the cap nothing is bought", () => {
    // woodcamp on the hill: 7 wood a day, cap 300
    expect(resourceDay(7, 300, 200, 9000)).toEqual({ prod: 7, over: 0 }); // room 100
    expect(resourceDay(7, 300, 293, 9000)).toEqual({ prod: 7, over: 0 }); // exactly full afterwards
    expect(resourceDay(7, 300, 296, 9000)).toEqual({ prod: 4, over: 3 });
    expect(resourceDay(7, 300, 300, 9000)).toEqual({ prod: 0, over: 7 });
    // a stock above the cap (start stock, never shrinking caps) turns the whole day into overflow, never negative
    expect(resourceDay(7, 300, 340, 9000)).toEqual({ prod: 0, over: 7 });
  });

  it("fractional rates follow the daily whole units (0.5 stone: one unit every second day)", () => {
    for (const day of [9000, 9001, 9002, 9003]) {
      const units = resourceDaily(0.5, day);
      expect(resourceDay(0.5, 100, 100, day)).toEqual({ prod: 0, over: units });
      expect(resourceDay(0.5, 100, 50, day)).toEqual({ prod: units, over: 0 });
    }
  });

  it("uses the same storage caps as production (woodcamp, granary, granary2)", () => {
    const r = resourceRates(new Set(["woodcamp", "granary", "granary2"]), "workshop");
    expect(r.wood).toEqual({ rate: 7, cap: 600 });
    expect(r.stone).toEqual({ rate: 0.5, cap: 400 });
    expect(resourceDay(r.wood.rate, r.wood.cap, 598, 9000)).toEqual({ prod: 2, over: 5 });
  });
});

describe("Ankauf rows: money only, never a building", () => {
  it("one item per UTC day, recognised only in its exact form", () => {
    expect(ankaufItem(Date.UTC(2026, 10, 26))).toBe("ankauf:20261126");
    expect(isAnkauf("ankauf:20261126")).toBe(true);
    for (const bad of ["ankauf", "ankauf:2026-11-26", "ankauf:202611260", "xankauf:20261126"])
      expect(isAnkauf(bad)).toBe(false);
    expect(isCivicMoney("ankauf:20261126")).toBe(false);
  });

  const seed = () =>
    ({
      id: "c",
      name: "T",
      owner: "o",
      hue: 0,
      x: 306,
      y: 420,
      created_at: new Date(CHEST_SINCE).toISOString(),
      user_id: "u",
      bought: [],
    }) as unknown as Seed;
  const row = (at: number, mark: number): Purchase => ({
    id: `a${at}`,
    seed_id: "c",
    item: ankaufItem(at),
    cost: -mark,
    created_at: new Date(at).toISOString(),
  });
  const claim = (at: number, reward: number) => ({
    id: `q${at}`,
    seed_id: "c",
    quest: "x",
    reward,
    created_at: new Date(at).toISOString(),
  });

  it("the chest books a credit like any other income: same result as an equal reward", () => {
    const s = seed(),
      at = CAP_ALL_SINCE + 3 * 864e5,
      now = at + 864e5;
    expect(treasury(s, [row(at, 18)], now)).toBe(treasury(s, [], now, [], [claim(at, 18)]));
    expect(treasury(s, [row(at, 18)], now)).toBeGreaterThan(treasury(s, [], now));
  });

  it("the credit only fills the room below the chest cap; the surplus is lost like surplus tax", () => {
    const s = seed(),
      at = CAP_ALL_SINCE + 3 * 864e5,
      now = at + 864e5;
    // a large reward first fills the chest to its cap, then the day's credit finds no room
    const full = [claim(at - 1000, 50000)];
    const cap = chestCap("c", []);
    expect(treasury(s, [], now, [], full)).toBe(cap);
    expect(treasury(s, [row(at, 29)], now, [], full)).toBe(cap);
  });
});
