import { describe, it, expect } from "vitest";
import { bookCredit, investmentVolume, offerFor, questRank, simulate, TWIN_VOLUME } from "./engine";
import { RANK_PRICE, walkChest } from "../economy";
import { PROFILES } from "./profiles";

describe("economy simulation", () => {
  it("credit only fills the room below the cap, surplus is lost", () => {
    expect(bookCredit(1100, 1200, 300)).toEqual({ balance: 1200, booked: 100, lost: 200 });
    expect(bookCredit(1200, 1200, 50)).toEqual({ balance: 1200, booked: 0, lost: 50 });
  });
  it("chest booking matches the live walkChest", () => {
    const ev = [{ t: 1, r: 0, v: 900, k: "a" }, { t: 1, r: 2, v: 500, k: "b" }, { t: 2, r: 3, v: -700, k: "c" }, { t: 3, r: 0, v: 800, k: "d" }];
    let b = 0; for (const e of ev) b = e.v > 0 ? bookCredit(b, 1200, e.v).balance : b + e.v;
    expect(b).toBe(walkChest(0, ev, () => 1200));
  });
  it("metro quest needs Hansestadt", () => { expect(questRank(18)).toBe(5); expect(questRank(0)).toBe(1); });
  it("town volume: 13 general, 1 charter, 2 way buildings, 1 way monument", () => {
    const o = offerFor("trade", "grain");
    expect(o.filter((e) => e.group === "general")).toHaveLength(13);
    expect(o.filter((e) => e.group === "charter")).toHaveLength(1);
    expect(o.filter((e) => e.group === "way")).toHaveLength(2);
    expect(new Set(o.filter((e) => e.group === "way-monument").map((e) => e.item.replace(/\d+$/, ""))).size).toBe(1);
  });
  it("investment volumes per charter", () => {
    for (const w of ["grain", "workshop", "gateway"] as const) {
      expect(investmentVolume("trade", w)).toBe(44880);
      expect(investmentVolume("craft", w)).toBe(44880);
      expect(investmentVolume("culture", w)).toBe(44810);
      expect(investmentVolume("farm", w)).toBe(44780);
    }
    expect(TWIN_VOLUME).toBe(750);
    expect(RANK_PRICE.rank3).toBe(800);
  });
  it("ledger adds up and is reproducible", () => {
    const cfg = { profile: PROFILES.optimierer, charter: "farm" as const, location: "grain", days: 30 };
    const a = simulate(cfg), b = simulate(cfg);
    expect(a.finalBalance).toBe(b.finalBalance);
    expect(a.gross).toBe(a.booked + a.lost);
    expect(a.finalBalance).toBe(a.booked - a.spent + (a.bySource["raid"] ?? 0));
    expect(a.daily.every((r) => r.balance <= r.cap)).toBe(true);
    expect(a.regularOverflowDay === null || a.regularOverflowDay >= (a.firstOverflowDay ?? 0)).toBe(true);
  }, 120000);
});
