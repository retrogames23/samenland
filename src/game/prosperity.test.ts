import { describe, it, expect } from "vitest";
import { civicWealth, estateShares, estateAssessment, estateAt, estateHouse, ESTATE_TAX } from "./prosperity";
import { ITEMS, taxEarned, dailyTax } from "./economy";
import { structureAt, type Seed } from "./world";
const t0 = Date.UTC(2026, 0, 1), day = 864e5;
const seed: Seed = { id: "wealth-test", name: "Test", owner: "Test", x: 500, y: 500, hue: 50, created_at: new Date(t0).toISOString() };
describe("civic prosperity", () => {
  it("ordinary citizens pay 1 Taler daily", () => expect(ESTATE_TAX.ordinary).toBe(1));
  it("skilled workers pay 2 Taler daily", () => expect(ESTATE_TAX.skilled).toBe(2));
  it("wealthy citizens pay 3 Taler daily", () => expect(ESTATE_TAX.wealthy).toBe(3));
  it("school costs 1200 Taler", () => expect(ITEMS.school).toBe(1200));
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