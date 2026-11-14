import { describe, it, expect } from "vitest";
import { sickChance, SICK_BASE } from "./sickness";
import { residentTax } from "./resident-tax";
import { sickRate } from "./people";
import { sickLoss, sickTaxRate } from "./prosperity";
import { UNIVERSITY_SICK, ORANGERY_SICK, type Seed } from "./world";
import { weddingDates, WED_JOY } from "./weddings";
import { HERBS_SICK } from "./sickness";

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
    const more = seed(["herbs", "healer", "beginen", ...steps("university", 3)], { charter: { path: "culture", at: T0 } } as Partial<Seed>);
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

describe("Monument- und Festeffekte auf Krankheit", () => {
  const plain = (t: number) => sickChance(seed(), t);
  it("Erntehalle Stufe 3 halbiert den Winterzuschlag, im Sommer ohne Wirkung", () => {
    const h3 = seed(steps("harvest", 3)), h2 = seed(steps("harvest", 2));
    expect(sickChance(h3, SUMMER)).toBeCloseTo(plain(SUMMER), 9);
    const extra = plain(WINTER) - SICK_BASE;
    expect(extra).toBeGreaterThan(0.02);
    expect(sickChance(h3, WINTER) - SICK_BASE).toBeCloseTo(extra / 2, 9);
    expect(sickChance(h2, WINTER)).toBeCloseTo(plain(WINTER), 9);
  });
  it("Universität Stufe 3 senkt um UNIVERSITY_SICK/SICK_BASE, Stufe 2 noch nicht", () => {
    const f = 1 - UNIVERSITY_SICK / SICK_BASE;
    for (const t of [SUMMER, WINTER]) {
      expect(sickChance(seed(steps("university", 3)), t)).toBeCloseTo(plain(t) * f, 9);
      expect(sickChance(seed(steps("university", 2)), t)).toBeCloseTo(plain(t), 9);
    }
  });
  it("Orangerie: ab Stufe 2 wie Kräuterhütte, Stufe 3 zusätzlich", () => {
    const herb = 1 - HERBS_SICK / SICK_BASE, ora = 1 - ORANGERY_SICK / SICK_BASE;
    expect(sickChance(seed(steps("orangery", 1)), SUMMER)).toBeCloseTo(SICK_BASE, 9);
    expect(sickChance(seed(steps("orangery", 2)), SUMMER)).toBeCloseTo(sickChance(seed(["herbs"]), SUMMER), 9);
    expect(sickChance(seed(steps("orangery", 3)), SUMMER)).toBeCloseTo(SICK_BASE * herb * ora, 9);
    expect(sickChance(seed(steps("orangery", 3)), WINTER)).toBeCloseTo(plain(WINTER) * herb * ora, 9);
  });
  it("Hochzeitsfreude: im Fenster exakt 0, davor und danach reguläres Risiko", () => {
    const s = seed([], { user_id: "u-sick" } as Partial<Seed>);
    const w = weddingDates(s, Date.UTC(2027, 11, 31)).find((d) => d.grand);
    expect(w).toBeDefined();
    const at = w!.at;
    expect(sickChance(s, at + 36e5)).toBe(0);
    expect(sickChance(s, at + WED_JOY - 6e4)).toBe(0);
    expect(sickChance(s, at - 6e4)).toBeGreaterThan(0);
    const after = at + WED_JOY + 6e4;
    if (!weddingDates(s, after).some((d) => d.grand && d.at > at)) expect(sickChance(s, after)).toBeGreaterThan(0);
  });
});
