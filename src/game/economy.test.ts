import { describe, expect, it } from "vitest";
import { coins, popAt, taxEarned, treasury, START_COPPER } from "./economy";

const seed = (daysAgo: number) => ({ id: "s", name: "A", owner: "o", x: 500, y: 500, hue: 0, created_at: new Date(Date.UTC(2026, 0, 1)).toISOString(), _d: daysAgo });
const t0 = Date.UTC(2026, 0, 1);

describe("economy", () => {
  it("starts with 100 copper", () => expect(treasury(seed(0), [], t0)).toBe(100));
  it("START is 100", () => expect(START_COPPER).toBe(100));
  it("pays 1 copper per resident per day", () => {
    expect(taxEarned(seed(1), t0 + 86400000)).toBe(popAt(24));
  });
  it("100 copper = 1 silver, 100 silver = 1 gold", () => {
    expect(coins(10203)).toEqual({ gold: 1, silver: 2, copper: 3 });
  });
  it("spending reduces the treasury", () => {
    expect(treasury(seed(0), [{ id: "p", seed_id: "s", item: "fisher", cost: 60, created_at: "" }], t0)).toBe(40);
  });
});
