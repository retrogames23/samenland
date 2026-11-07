import { describe, it, expect } from "vitest";
import { treasury, taxEarned, cappedTax, chestCap, chestBlock, CHEST_SINCE, type Purchase } from "./economy";
import { raidLoss } from "./disasters";

const seed = (created: number) => ({ id: "c", name: "T", owner: "o", hue: 0, x: 306, y: 420, created_at: new Date(created).toISOString(), user_id: "u", bought: [] }) as never;
const buy = (item: string, at: number, cost: number): Purchase => ({ id: item, seed_id: "c", item, cost, created_at: new Date(at).toISOString() });

describe("village chest", () => {
  it("base chest holds 1200, expansions 4000/10000/25000", () => {
    expect(chestCap("c", [])).toBe(1200);
    expect(chestCap("c", [buy("chest2", 0, 250)])).toBe(4000);
    expect(chestCap("c", [buy("chest2", 0, 250), buy("chest3", 0, 800)])).toBe(10000);
    expect(chestCap("c", [buy("chest2", 0, 250), buy("chest3", 0, 800), buy("chest4", 0, 2000)])).toBe(25000);
  });
  it("expansions open by settlement rank, not age: Dorf, Kleinstadt, Handelsstadt", () => {
    const s = seed(CHEST_SINCE), c2 = [buy("chest2", 0, 250)], c3 = [...c2, buy("chest3", 0, 800)];
    expect(chestBlock(s, [], 1)).toBe("rank");
    expect(chestBlock(s, [], 2)).toBe(null);
    expect(chestBlock(s, c2, 2)).toBe("rank");
    expect(chestBlock(s, c2, 3)).toBe(null);
    expect(chestBlock(s, c3, 3)).toBe("rank");
    expect(chestBlock(s, c3, 4)).toBe(null);
  });
  it("an untended village founded after the rule never holds more than 1200 from taxes", () => {
    const s = seed(CHEST_SINCE), now = CHEST_SINCE + 365 * 864e5;
    expect(treasury(s, [], now)).toBeLessThanOrEqual(1200 + 400);
    expect(cappedTax(s, [], now)).toBe(1200 - 160 + raidLoss(s, now));
  });
  it("robbers never push an untended chest below zero, and taxes refill it", () => {
    const s = seed(CHEST_SINCE);
    for (const days of [100, 365, 730, 1500]) {
      const now = CHEST_SINCE + days * 864e5;
      expect(raidLoss(s, now)).toBeGreaterThan(0);
      expect(treasury(s, [], now)).toBeGreaterThanOrEqual(0);
    }
    // two years of robbers steal far more than 800, yet the chest is near full again
    const now = CHEST_SINCE + 730 * 864e5;
    expect(raidLoss(s, now)).toBeGreaterThan(800);
    expect(treasury(s, [], now)).toBeGreaterThan(700);
  });
  it("spending makes room again", () => {
    const s = seed(CHEST_SINCE), now = CHEST_SINCE + 60 * 864e5;
    expect(cappedTax(s, [buy("hunter", CHEST_SINCE + 30 * 864e5, 100)], now)).toBe(1200 - 160 + 100 + raidLoss(s, now));
  });
  it("balances earned before the rule are not cut", () => {
    const c0 = CHEST_SINCE - 200 * 864e5, s = seed(c0);
    expect(cappedTax(s, [], CHEST_SINCE - 1)).toBe(taxEarned(s, CHEST_SINCE - 1));
    expect(cappedTax(s, [], CHEST_SINCE + 30 * 864e5)).toBe(taxEarned(s, CHEST_SINCE - 1));
  });
});
