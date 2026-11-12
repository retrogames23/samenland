import { describe, it, expect } from "vitest";
import { attemptPurchases, bookCredit, CARE_ORDER, CIVIC, investmentVolume, offerFor, questRank, simulate, TWIN_VOLUME, WAY_MON } from "./engine";
import { CHEST_PRICE, GUILD_OF, ITEMS, MONUMENTS, RANK_PRICE, walkChest } from "../economy";
import type { Profile } from "./types";
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

/** Test harness: a buy() with the same contract as the engine's (owned → false, balance < cost + reserve → false). */
function harness(balance: number, profile: Profile, owned: string[] = []) {
  const set = new Set(owned), log: string[] = [], tried: string[] = [];
  const buy = (item: string, cost: number, reserve = profile.reserve) => {
    tried.push(item);
    if (set.has(item) || balance < cost + reserve) return false;
    balance -= cost; set.add(item); log.push(item); return true;
  };
  return { set, log, tried, buy, get balance() { return balance; } };
}
const bare: Profile = { ...PROFILES.optimierer, reserve: 100, chest: false, civic: false, titles: false, guildRanks: false, way: false, monumentsFrom: null };
const round = (h: ReturnType<typeof harness>, p: Profile, rank: number, chest = 0, day = 1) =>
  attemptPurchases({ day, rank, chest, profile: p, charter: "trade", way: "grain", owned: h.set, buy: h.buy });

describe("attemptPurchases", () => {
  it("tries purchases in the fixed engine order", () => {
    const p: Profile = { ...PROFILES.optimierer, reserve: 0, chest: true, civic: true, titles: true, guildRanks: true, way: true, monumentsFrom: 1 };
    const h = harness(0, p); round(h, p, 5);
    const g = (it: string) => h.tried.indexOf(it);
    expect(g("chest2")).toBe(0);
    expect(g("chest2")).toBeLessThan(g(CARE_ORDER[0]!));
    expect(g(CARE_ORDER.at(-1)!)).toBeLessThan(g(GUILD_OF.trade));
    expect(g(GUILD_OF.trade)).toBeLessThan(g("rank2"));
    expect(g("rank2")).toBeLessThan(g("title1"));
    expect(g("title1")).toBeLessThan(g(CIVIC[0]!));
    expect(g(CIVIC.at(-1)!)).toBeLessThan(g(WAY_MON.grain + "1"));
    expect(h.log).toEqual([]);
  });
  it("first purchase succeeds, second fails at the reserve", () => {
    // 5,000 Mark, reserve 100: hunter + herbs + granary ... until the reserve blocks
    const h = harness(ITEMS.hunter + 100 + ITEMS.herbs - 1, bare); round(h, bare, 5);
    expect(h.log).toEqual(["hunter"]);
    expect(h.tried.slice(0, 2)).toEqual(["hunter", "herbs"]);
    expect(h.balance).toBe(100 + ITEMS.herbs - 1);
  });
  it("a failed purchase leaves owned untouched and succeeds on a later round", () => {
    const h = harness(ITEMS.hunter + 99, bare); round(h, bare, 5);
    expect(h.set.has("hunter")).toBe(false);
    const h2 = harness(ITEMS.hunter + 100, bare); round(h2, bare, 5);
    expect(h2.set.has("hunter")).toBe(true);
  });
  it("chest upgrades use reserve 0 and the stage rises once per bought step", () => {
    const p: Profile = { ...bare, chest: true, reserve: 10000 };
    const h = harness(CHEST_PRICE.chest2 + CHEST_PRICE.chest3, p);
    expect(round(h, p, 5)).toBe(2);
    expect(h.log).toEqual(["chest2", "chest3"]);
    expect(h.balance).toBe(0);
    const h2 = harness(1e6, p, ["chest2"]);
    expect(round(h2, p, 2, 1)).toBe(1); // chest3 needs rank 3
    const h3 = harness(1e6, p); expect(round(h3, p, 1)).toBe(0);
  });
  it("an unaffordable monument step stops all later monuments that day", () => {
    const p: Profile = { ...bare, monumentsFrom: 1, reserve: 0 };
    const first = MONUMENTS[WAY_MON.grain].prices[0]!;
    const h = harness(CARE_COST + first - 1, p); round(h, p, 5);
    expect(h.tried.filter((t) => /\d$/.test(t))).toEqual([WAY_MON.grain + "1"]);
    const h2 = harness(1e6, p, [WAY_MON.grain + "1"]); round(h2, p, 5);
    expect(h2.log).toContain(WAY_MON.grain + "2");
    expect(h2.log).not.toContain(WAY_MON.grain + "1");
  });
  it("rank3 needs rank2 and belfry4", () => {
    const p: Profile = { ...bare, guildRanks: true, reserve: 0 };
    const a = harness(1e6, p, ["rank2"]); round(a, p, 5); expect(a.tried).not.toContain("rank3");
    const b = harness(1e6, p, ["belfry4"]); round(b, p, 5); expect(b.log).toEqual(expect.arrayContaining(["rank2", "rank3"]));
    expect(b.log.indexOf("rank2")).toBeLessThan(b.log.indexOf("rank3"));
    const c = harness(1e6, p, ["rank2", "belfry4"]); round(c, p, 3); expect(c.tried).not.toContain("rank3");
  });
});
const CARE_COST = CARE_ORDER.reduce((a, it) => a + ITEMS[it as keyof typeof ITEMS], 0);
