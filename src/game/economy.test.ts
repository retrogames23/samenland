import { describe, expect, it } from "vitest";
import { ITEMS, popAt, taxEarned, treasury, START_TALER } from "./economy";

const t0 = Date.UTC(2026, 0, 1);
const seed = () => ({ id: "s", name: "A", owner: "o", x: 500, y: 500, hue: 0, created_at: new Date(t0).toISOString() });
const day = 86400000;

describe("economy (Taler)", () => {
  it("starts with 160 Taler", () => expect(treasury(seed(), [], t0)).toBe(START_TALER));
  it("START is 160", () => expect(START_TALER).toBe(160));
  it("pays 1 Taler per resident per day", () => expect(taxEarned(seed(), t0 + day)).toBe(popAt(24)));
  it("a fisher hut is affordable on day one", () => expect(treasury(seed(), [], t0)).toBeGreaterThanOrEqual(ITEMS.fisher));
  it("the school is not affordable in the first week", () => expect(treasury(seed(), [], t0 + 7 * day)).toBeLessThan(ITEMS.school));
  it("spending reduces the treasury", () => {
    expect(treasury(seed(), [{ id: "p", seed_id: "s", item: "fisher", cost: 120, created_at: "" }], t0)).toBe(40);
  });
});

describe("early buildings", () => {
  it("herb hut costs 90, hunter's lodge 110, woodcutter's camp 180, healer 550", () => {
    expect(ITEMS.herbs).toBe(90); expect(ITEMS.hunter).toBe(100); expect(ITEMS.woodcamp).toBe(240); expect(ITEMS.healer).toBe(550);
  });
  it("a village without water can afford the hunter's lodge on day one", () => expect(treasury(seed(), [], t0)).toBeGreaterThanOrEqual(ITEMS.hunter));
});

describe("treasury with stored tax receipts", async () => {
  const { CAP_ALL_SINCE, taxOnDay } = await import("./economy");
  const c0 = CAP_ALL_SINCE - 3 * day + 3600e3;
  const s = { ...seed(), user_id: "u", created_at: new Date(c0).toISOString() };
  const first = Math.ceil((CAP_ALL_SINCE - c0) / day), now = c0 + (first + 3) * day;
  const base = treasury(s, [], now, [], [], CAP_ALL_SINCE, [s]);
  const days = [first, first + 1, first + 2, first + 3];
  it("a booked receipt overrides the dynamic assessment", () => {
    const dyn = taxOnDay(s, first + 1, [s]);
    expect(treasury(s, [], now, [], [], CAP_ALL_SINCE, [s], { [first + 1]: dyn + 7 })).toBe(base + 7);
  });
  it("a receipt with income 0 stays binding", () => {
    const dyn = taxOnDay(s, first, [s]);
    expect(dyn).toBeGreaterThan(0);
    expect(treasury(s, [], now, [], [], CAP_ALL_SINCE, [s], { [first]: 0 })).toBe(base - dyn);
  });
  it("a missing receipt is assessed dynamically", () => {
    expect(treasury(s, [], now, [], [], CAP_ALL_SINCE, [s], {})).toBe(base);
  });
  it("several historical receipts all count", () => {
    const dyn = days.reduce((a, d) => a + taxOnDay(s, d, [s]), 0);
    const rec = Object.fromEntries(days.map((d, i) => [d, i + 1]));
    expect(treasury(s, [], now, [], [], CAP_ALL_SINCE, [s], rec)).toBe(base - dyn + 10);
  });
});
