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

import { INFRA_ITEMS, infraCount, gatedEstateShares } from "./prosperity";
describe("village tax gating (Option A)", () => {
  const base: Seed = { id: "g", name: "G", owner: "G", x: 0, y: 0, hue: 0, created_at: new Date(t0).toISOString() };
  it("lists exactly the 13 qualifying works", () => {
    expect(INFRA_ITEMS.length).toBe(13);
    expect(new Set(INFRA_ITEMS).size).toBe(13);
    for (const i of INFRA_ITEMS) expect(ITEM_RANK[i] ?? 0).toBeLessThanOrEqual(2);
  });
  it.each(["badestube", "school", "firehouse", "markethall", "guildhall", "library", "guard", "belfry4"])("%s does not count", (item) => {
    expect(infraCount({ ...base, bought: [{ item, at: t0 }] }, t0)).toBe(0);
  });
  it("counts purchases only from purchase time, each once", () => {
    const s = { ...base, bought: [{ item: "herbs", at: t0 }, { item: "herbs", at: t0 }, { item: "dairy", at: t0 + day }] };
    expect(infraCount(s, t0)).toBe(1);
    expect(infraCount(s, t0 + day)).toBe(2);
  });
  it("counts roads only once finished, at most three", () => {
    expect(infraCount({ ...base, civicRoads: [{ at: t0 + day }] }, t0)).toBe(0);
    expect(infraCount({ ...base, civicRoads: [{ at: t0 }] }, t0)).toBe(1);
    expect(infraCount({ ...base, civicRoads: Array.from({ length: 5 }, () => ({ at: t0 })) }, t0)).toBe(3);
  });
  it.each([[0, 0.04], [4, 0.14], [7, 0.2], [13, 0.2]])("n=%i gives %f skilled", (n, s) => {
    expect(gatedEstateShares(100, 2, false, n).skilled).toBeCloseTo(s);
  });
  it("rank tiers with school", () => {
    expect(gatedEstateShares(100, 3, true, 0)).toMatchObject({ skilled: 0.35, wealthy: 0.05 });
    expect(gatedEstateShares(100, 4, true, 0)).toMatchObject({ skilled: 0.45, wealthy: 0.15 });
    expect(gatedEstateShares(100, 5, true, 0)).toEqual(estateShares(100));
  });
  it("without school wealthy is always 0; no share exceeds L; shares sum to 1", () => {
    for (let w = 0; w <= 100; w += 5) for (let r = 0; r <= 5; r++) for (const sc of [false, true]) for (let n = 0; n <= 16; n++) {
      const g = gatedEstateShares(w, r, sc, n), L = estateShares(w);
      if (!sc || r <= 2) expect(g.wealthy).toBe(0);
      expect(g.skilled).toBeLessThanOrEqual(L.skilled + 1e-12);
      expect(g.wealthy).toBeLessThanOrEqual(L.wealthy + 1e-12);
      expect(g.ordinary + g.skilled + g.wealthy).toBeCloseTo(1);
    }
  });
});
