import { describe, it, expect } from "vitest";
import { bookCredit, questRank, simulate } from "./engine";
import { PROFILES } from "./profiles";

describe("economy simulation", () => {
  it("credit only fills the room below the cap, surplus is lost", () => {
    expect(bookCredit(1100, 1200, 300)).toEqual({ balance: 1200, booked: 100, lost: 200 });
    expect(bookCredit(1200, 1200, 50)).toEqual({ balance: 1200, booked: 0, lost: 50 });
  });
  it("metro quest needs Hansestadt", () => {
    expect(questRank(18)).toBe(5);
    expect(questRank(0)).toBe(1);
  });
  it("ledger adds up and is reproducible", () => {
    const cfg = { profile: PROFILES.optimierer, charter: "farm" as const, location: "plain" as const, days: 40 };
    const a = simulate(cfg), b = simulate(cfg);
    expect(a.finalBalance).toBe(b.finalBalance);
    expect(a.gross).toBe(a.booked + a.lost);
    expect(a.finalBalance).toBe(a.booked - a.spent);
    expect(a.daily.every((r) => r.balance <= r.cap)).toBe(true);
  }, 60000);
});
