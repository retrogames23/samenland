import { raidLoss } from "./disasters";
import { describe, it, expect } from "vitest";
import { weddingTimes, weddingDates, dowryEarned, weddingJoy, dowryAt, wedGapHours, WED_NOTABLE } from "./weddings";
import { pendingEncounter } from "./encounters";
import { treasury, START_TALER, taxEarned } from "./economy";
import type { Seed } from "./world";

const s = { id: "w", user_id: "u", x: 500, y: 500, created_at: "2026-01-01T00:00:00Z" } as unknown as Seed;
const c0 = Date.parse(s.created_at), D = 864e5, H = 3.6e6;
const CARE = ["fisher", "hunter", "granary", "dairy", "herbs", "healer"].map((item) => ({ item, at: 0 }));
const perMonth = (x: Seed, month: number) => { const a = c0 + month * 30 * D; return weddingDates(x, a + 30 * D).filter((w) => w.at >= a).length; };

describe("weddings", () => {
  it("first wedding on day 2", () => {
    expect(weddingTimes(s, c0 + 2 * D - 1)).toHaveLength(0);
    expect(weddingTimes(s, c0 + 2 * D)).toHaveLength(1);
  });
  it("a tiny hamlet waits about two weeks for the next wedding", () => {
    expect(wedGapHours(s, c0 + 2 * D) / 24).toBeGreaterThan(12);
  });
  it("more residents mean more weddings", () => {
    const big = { ...s, bought: CARE } as Seed;
    expect(perMonth(big, 18)).toBeGreaterThan(perMonth(s, 18) * 1.5);
  });
  it("prosperity and food crafts shorten the gap", () => {
    const t = c0 + 30 * D;
    expect(wedGapHours({ ...s, bought: [{ item: "school", at: 0 }, { item: "guildhall", at: 0 }, { item: "markethall", at: 0 }] } as Seed, t)).toBeLessThan(wedGapHours(s, t));
    expect(wedGapHours({ ...s, bought: [{ item: "fisher", at: 0 }] } as Seed, t)).toBeLessThan(wedGapHours(s, t));
  });
  it("a neglected village keeps a village rhythm: never more than 6 weddings a month", () => {
    expect(perMonth(s, 23)).toBeLessThanOrEqual(6);
  });
  it("dowry is 20 Taler plus 0.6 per prosperity point and reaches the treasury", () => {
    expect(dowryAt(25)).toBe(35); expect(dowryAt(100)).toBe(80);
    const now = c0 + 30 * D;
    expect(dowryEarned(s, now)).toBe(weddingDates(s, now).reduce((a, w) => a + w.dowry, 0));
    expect(treasury(s, [], now) + raidLoss(s, now)).toBe(START_TALER + taxEarned(s, now) + dowryEarned(s, now));
  });
  it("in a village every wedding is a great day with joy and the mayor's call", () => {
    expect(weddingDates(s, c0 + 60 * D).every((w) => w.grand && !w.town)).toBe(true);
    expect(weddingJoy(s, c0 + 2 * D + 23 * H)).toBe(true);
    expect(weddingJoy(s, c0 + 3 * D + 1)).toBe(false);
  });
  it("in a town only every fifth wedding is a council wedding; the others stay private", () => {
    const big = { ...s, bought: CARE } as Seed;
    const town = weddingDates(big, c0 + 400 * D).filter((w) => w.town);
    expect(town.length).toBeGreaterThan(10);
    for (const w of town) expect(w.grand).toBe(w.k % WED_NOTABLE === WED_NOTABLE - 1);
    const quiet = town.find((w) => !w.grand)!;
    expect(pendingEncounter(big, [], quiet.at + H)).not.toBe("wedding");
    expect(weddingJoy(big, quiet.at + H)).toBe(false);
  });
});
