import { describe, it, expect } from "vitest";
import { sickChance, SICK_BASE } from "./sickness";
import { residentTax } from "./resident-tax";
import { sickRate } from "./people";
import { sickLoss, sickTaxRate } from "./prosperity";
import type { Seed } from "./world";

const SUMMER = Date.UTC(2027, 6, 15, 12), WINTER = Date.UTC(2027, 0, 20, 12), T0 = Date.UTC(2026, 0, 1);
const seed = (items: string[] = [], extra: Partial<Seed> = {}): Seed => ({
  id: "sick-test", x: 500, y: 500, created_at: new Date(T0).toISOString(), user_id: null,
  bought: items.map((item) => ({ item, at: T0 + 864e5 })), ...extra,
} as unknown as Seed);
const steps = (item: string, n: number) => Array.from({ length: n }, (_, i) => `${item}${i + 1}`);

describe("gemeinsame Krankheitslogik", () => {
  it("Sommer 6 %, Winter höher", () => {
    expect(sickChance(seed(), SUMMER)).toBeCloseTo(SICK_BASE, 6);
    expect(sickChance(seed(), WINTER)).toBeGreaterThan(SICK_BASE);
    expect(sickChance(seed(), WINTER)).toBeLessThanOrEqual(0.09 + 1e-9);
  });
  it("Kräuterhütte −25 %, Heiler zusätzlich", () => {
    const h = sickChance(seed(["herbs"]), SUMMER);
    expect(h).toBeCloseTo(0.045, 6);
    expect(sickChance(seed(["herbs", "healer"]), SUMMER)).toBeLessThan(h);
  });
  it("Beginenhof und Kultur-Charta senken Krankheit", () => {
    expect(sickChance(seed(["beginen"]), SUMMER)).toBeCloseTo(0.045, 6);
    expect(sickChance(seed([], { charter: { path: "culture", at: T0 } } as Partial<Seed>), SUMMER)).toBeCloseTo(0.04, 6);
  });
  it("Zusatzinvestitionen wirken auch nach Kräuterhütte, Heiler, Beginenhof und Kultur (keine Untergrenze)", () => {
    const base = seed(["herbs", "healer", "beginen"], { charter: { path: "culture", at: T0 } } as Partial<Seed>);
    const a = sickChance(base, SUMMER);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(0.01);
    const more = seed(["herbs", "healer", "beginen", ...steps("cathedral", 5)], { charter: { path: "culture", at: T0 } } as Partial<Seed>);
    expect(sickChance(more, SUMMER)).toBeLessThan(a);
  });
  it("Bewohner und neue Steuer nutzen dieselbe Krankheitswahrscheinlichkeit", () => {
    for (const s of [seed(), seed(["herbs", "healer"]), seed(["beginen"])]) for (const t of [SUMMER, WINTER]) {
      expect(sickRate(s, t)).toBe(sickChance(s, t));
      const r = residentTax(s, [s], t);
      expect(r.income).toBe(r.assessed - sickLoss(r.assessed, sickChance(s, t)));
    }
  });
  it("Steuerausfall wird abgerundet, ohne Krankheit kein Ausfall", () => {
    expect(sickLoss(1000, 0.06)).toBe(24);
    expect(sickLoss(99, 0.06)).toBe(2);
    expect(sickLoss(1000, 0)).toBe(0);
  });
  it("Alttaxe vor dem Stichtag bleibt unverändert", () => {
    expect(sickTaxRate(seed(["herbs", "healer"]), SUMMER)).toBe(0.01);
    expect(sickTaxRate(seed(), WINTER)).toBeCloseTo(0.09, 9);
  });
});
