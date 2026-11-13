import { describe, it, expect } from "vitest";
import { civicWealth, estateShares, estateAssessment, estateAt, estateHouse, ESTATE_TAX } from "./prosperity";
import { ITEMS, taxEarned, dailyTax } from "./economy";
import { structureAt, type Seed } from "./world";
import { ITEM_RANK } from "./disasters";
const t0 = Date.UTC(2026, 0, 1), day = 864e5;
const seed: Seed = { id: "wealth-test", name: "Test", owner: "Test", x: 500, y: 500, hue: 50, created_at: new Date(t0).toISOString() };
describe("civic prosperity", () => {
  it("ordinary citizens pay 1 Taler daily", () => expect(ESTATE_TAX.ordinary).toBe(1));
  it("skilled workers pay 2 Taler daily", () => expect(ESTATE_TAX.skilled).toBe(2));
  it("wealthy citizens pay 3 Taler daily", () => expect(ESTATE_TAX.wealthy).toBe(3));
  it("school costs 1200 Taler", () => expect(ITEMS.school).toBe(1200));
  it("school opens in the small-town era", () => expect(ITEM_RANK["school"]).toBe(3));
  it("completed roads give 10 civic wealth, capped at 30", () => {
    expect(civicWealth({ ...seed, civicRoads: [{ at: t0 }] }, t0)).toBe(35);
    expect(civicWealth({ ...seed, civicRoads: Array.from({ length: 5 }, () => ({ at: t0 })) }, t0)).toBe(55);
  });
  it.each([[30, 1.1], [55, 1.6], [80, 2.05]])("wealth %i has balanced average tax %f", (w, avg) => {
    const s = estateShares(w); expect(s.ordinary + 2 * s.skilled + 3 * s.wealthy).toBeCloseTo(avg);
  });
  it("does not promote everybody even at maximum wealth", () => expect(estateShares(100).ordinary).toBeCloseTo(0.15));
  it("historical taxes ignore future school purchases", () => {
    const s = { ...seed, bought: [{ item: "school", at: t0 + 10 * day }] };
    expect(taxEarned(s, t0 + 9 * day)).toBe(taxEarned(seed, t0 + 9 * day));
    expect(taxEarned(s, t0 + 11 * day)).toBeGreaterThan(taxEarned(seed, t0 + 11 * day));
  });
  it("school raises wealth by 20 and increases current taxes", () => {
    const s = { ...seed, bought: [{ item: "school", at: t0 }] };
    expect(civicWealth(s, t0)).toBe(civicWealth(seed, t0) + 20);
    expect(dailyTax(s, 168)).toBeGreaterThan(dailyTax(seed, 168));
  });
  it("prestige taxes start after completion, not on purchase", () => {
    const s = { ...seed, bought: [{ item: "belfry4", at: t0 }] };
    expect(civicWealth(s, t0 + 5 * 3.6e6)).toBe(25);
    expect(civicWealth(s, t0 + 6 * 3.6e6)).toBe(40);
  });
  it("household promotion is stable and monotonic", () => {
    for (let x = 490; x < 510; x++) {
      let previous = 1;
      for (let w = 0; w <= 100; w++) { const tax = ESTATE_TAX[estateAt(w, x, 500)]; expect(tax).toBeGreaterThanOrEqual(previous); previous = tax; }
    }
  });
  it("higher assessment never exceeds 3 Taler per estimated resident", () => {
    for (let w = 0; w <= 100; w++) { expect(estateAssessment(100, w)).toBeLessThanOrEqual(300); expect(estateAssessment(100, w)).toBeGreaterThanOrEqual(100); }
  });
  it("home upgrades retain underlying household identity and construction", () => {
    const now = t0 + 100 * day;
    const poor = structureAt(501, 500, [seed], now);
    const richSeed = { ...seed, bought: [{ item: "school", at: t0 }, { item: "guildhall", at: t0 }] };
    const rich = structureAt(501, 500, [richSeed], now);
    expect(poor?.homeKind ?? poor?.kind).toBe(rich?.homeKind ?? rich?.kind);
    expect(rich?.build).toBe(poor?.build);
  });
  it("wealthy homes are painted patrician residences", () => expect(estateHouse("cottage", "wealthy")).toBe("patrician"));
});
import { sickTaxRate, sickLoss } from "./prosperity";
describe("sick villagers pay no tax", () => {
  const s = { id: "x", created_at: "2026-01-01T00:00:00Z", bought: [] } as any;
  it("loses 6 % × 0.4 in summer and 9 % × 0.4 in winter", () => {
    expect(sickTaxRate(s, Date.UTC(2026, 6, 1))).toBeCloseTo(0.06);
    expect(sickTaxRate(s, Date.UTC(2026, 0, 10))).toBeCloseTo(0.09);
    expect(sickLoss(100, 0.09)).toBe(3);
  });
  it("herb hut and healer cut it to the 1 % floor-ish", () => {
    const b = { ...s, bought: [{ item: "herbs", at: 0 }, { item: "healer", at: 0 }] };
    expect(sickTaxRate(b, Date.UTC(2026, 6, 1))).toBeCloseTo(0.01);
  });
});

import { CIVIC_BONUS, PRESTIGE_BONUS } from "./prosperity";
import { ITEMS as PRICES } from "./economy";
describe("rebalanced guild and prestige buildings", () => {
  it("library gives +10 civic wealth", () => expect(CIVIC_BONUS["library"]).toBe(10));
  it("dairy gives +5 civic wealth", () => expect(CIVIC_BONUS["dairy"]).toBe(5));
  it("finished orangery gives +10 civic wealth", () => expect(PRESTIGE_BONUS["orangery3"]).toBe(10));
  it("finished university gives +15 civic wealth", () => expect(PRESTIGE_BONUS["university4"]).toBe(15));
  it("new prices", () => { expect(PRICES.fisher).toBe(140); expect(PRICES.library).toBe(380); expect(PRICES.dairy).toBe(350); expect(PRICES.guard).toBe(750); });
});

import { prosperityAt, sharesFromProsperity, sharesAt } from "./prosperity";
describe("Wohlstand: one continuous value", () => {
  const base: Seed = { id: "g", name: "G", owner: "G", x: 0, y: 0, hue: 0, created_at: new Date(t0).toISOString() };
  const works = ["herbs", "hunter", "fisher", "dairy", "backhaus", "granary", "healer", "herberge", "woodcamp", "bigstore"];
  const town = (items: string[]) => ({ ...base, bought: items.map((item) => ({ item, at: t0 })) });
  it("a village never reaches full prosperity, even with every early work", () => {
    expect(prosperityAt(town(works), t0, 120)).toBeLessThan(25);
  });
  it("keeps maturing past Hansestadt (2200 citizens)", () => {
    const s = town([...works, "school", "guildhall", "markethall", "library"]);
    const a = prosperityAt(s, t0, 2200), b = prosperityAt(s, t0, 4000);
    expect(b).toBeGreaterThan(a); expect(b).toBeLessThan(100);
  });
  it("rises strictly with citizens", () => {
    let last = -1; for (const c of [0, 50, 120, 500, 1100, 2200, 5000]) { const p = prosperityAt(base, t0, c); expect(p).toBeGreaterThan(last); last = p; }
  });
  it("a school helps but is no switch: a big town has wealthy citizens without it", () => {
    const no = sharesAt(town(works), t0, 2200), yes = sharesAt(town([...works, "school"]), t0, 2200);
    expect(no.shares.wealthy).toBeGreaterThan(0.05); expect(yes.wealth).toBeGreaterThan(no.wealth);
  });
  it("purchases count only from purchase time", () => {
    const s = { ...base, bought: [{ item: "school", at: t0 + day }] };
    expect(prosperityAt(s, t0, 500)).toBe(prosperityAt(base, t0, 500));
  });
  it("shares grow continuously, wealthy later than skilled, sum to 1", () => {
    for (let p = 0; p <= 100; p += 5) { const s = sharesFromProsperity(p); expect(s.ordinary + s.skilled + s.wealthy).toBeCloseTo(1); expect(s.wealthy).toBeLessThanOrEqual(s.skilled); }
    expect(sharesFromProsperity(20).wealthy).toBeLessThan(0.02);
  });
});

import { PROSPER_MONUMENTS } from "./prosperity";
describe("Block 1.1: all ten monuments count toward Wohlstand", () => {
  it("lists seven general and three way monuments", () => {
    expect(PROSPER_MONUMENTS).toHaveLength(10);
    for (const k of ["harvest3", "guildtower3", "lighthouse3"]) expect(PROSPER_MONUMENTS).toContain(k);
  });
});
