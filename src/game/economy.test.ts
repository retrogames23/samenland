import { describe, expect, it } from "vitest";
import { ITEMS, popAt, taxEarned, treasury, START_TALER } from "./economy";

const t0 = Date.UTC(2026, 0, 1);
const seed = () => ({ id: "s", name: "A", owner: "o", x: 500, y: 500, hue: 0, created_at: new Date(t0).toISOString() });
const day = 86400000;

describe("economy (Taler)", () => {
  it("starts with 150 Taler", () => expect(treasury(seed(), [], t0)).toBe(START_TALER));
  it("START is 150", () => expect(START_TALER).toBe(150));
  it("pays 1 Taler per resident per day", () => expect(taxEarned(seed(), t0 + day)).toBe(popAt(24)));
  it("a fisher hut is affordable on day one", () => expect(treasury(seed(), [], t0)).toBeGreaterThanOrEqual(ITEMS.fisher));
  it("the school is not affordable before day 40", () => expect(treasury(seed(), [], t0 + 39 * day)).toBeLessThan(ITEMS.school));
  it("spending reduces the treasury", () => {
    expect(treasury(seed(), [{ id: "p", seed_id: "s", item: "fisher", cost: 120, created_at: "" }], t0)).toBe(30);
  });
});
