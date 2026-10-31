import { describe, it, expect } from "vitest";
import { treasury, taxEarned, cappedTax, chestCap, chestBlock, CHEST_SINCE, type Purchase } from "./economy";

const seed = (created: number) => ({ id: "c", name: "T", owner: "o", hue: 0, x: 306, y: 420, created_at: new Date(created).toISOString(), user_id: "u", bought: [] }) as never;
const buy = (item: string, at: number, cost: number): Purchase => ({ id: item, seed_id: "c", item, cost, created_at: new Date(at).toISOString() });

describe("village chest", () => {
  it("base chest holds 800, expansions 2500/6000/15000", () => {
    expect(chestCap("c", [])).toBe(800);
    expect(chestCap("c", [buy("chest2", 0, 250)])).toBe(2500);
    expect(chestCap("c", [buy("chest2", 0, 250), buy("chest3", 0, 800)])).toBe(6000);
    expect(chestCap("c", [buy("chest2", 0, 250), buy("chest3", 0, 800), buy("chest4", 0, 2000)])).toBe(15000);
  });
  it("first expansion needs a week of age", () => {
    const s = seed(CHEST_SINCE);
    expect(chestBlock(s, [], CHEST_SINCE + 100 * 3.6e6)).toBe("age");
    expect(chestBlock(s, [], CHEST_SINCE + 170 * 3.6e6)).toBe(null);
  });
  it("an untended village founded after the rule never holds more than 800 from taxes", () => {
    const s = seed(CHEST_SINCE), now = CHEST_SINCE + 365 * 864e5;
    expect(treasury(s, [], now)).toBeLessThanOrEqual(800 + 400);
    expect(cappedTax(s, [], now)).toBe(800 - 160);
  });
  it("spending makes room again", () => {
    const s = seed(CHEST_SINCE), now = CHEST_SINCE + 60 * 864e5;
    expect(cappedTax(s, [buy("hunter", CHEST_SINCE + 30 * 864e5, 100)], now)).toBe(800 - 160 + 100);
  });
  it("balances earned before the rule are not cut", () => {
    const c0 = CHEST_SINCE - 200 * 864e5, s = seed(c0);
    expect(cappedTax(s, [], CHEST_SINCE - 1)).toBe(taxEarned(s, CHEST_SINCE - 1));
    expect(cappedTax(s, [], CHEST_SINCE + 30 * 864e5)).toBe(taxEarned(s, CHEST_SINCE - 1));
  });
});
