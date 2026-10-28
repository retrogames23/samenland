import { raidLoss } from "./disasters";
import { describe, it, expect } from "vitest";
import { weddingTimes, dowryEarned, weddingJoy, DOWRY } from "./weddings";
import { treasury, START_TALER, taxEarned } from "./economy";
import type { Seed } from "./world";

const s = { id: "w", x: 500, y: 500, created_at: "2026-01-01T00:00:00Z" } as unknown as Seed;
const c0 = Date.parse(s.created_at), D = 864e5;

describe("weddings", () => {
  it("first wedding after 6 days, then every 9 days", () => {
    expect(weddingTimes(s, c0 + 6 * D - 1)).toHaveLength(0);
    expect(weddingTimes(s, c0 + 6 * D)).toHaveLength(1);
    expect(weddingTimes(s, c0 + 15 * D)).toHaveLength(2);
  });
  it("each wedding pays 40 Taler dowry into the treasury", () => {
    expect(DOWRY).toBe(40);
    const now = c0 + 16 * D;
    expect(dowryEarned(s, now)).toBe(80);
    expect(treasury(s, [], now) + raidLoss(s, now)).toBe(START_TALER + taxEarned(s, now) + 80);
  });
  it("wedding joy lasts 24 hours", () => {
    expect(weddingJoy(s, c0 + 6 * D + 23 * 3.6e6)).toBe(true);
    expect(weddingJoy(s, c0 + 7 * D + 1)).toBe(false);
  });
});
