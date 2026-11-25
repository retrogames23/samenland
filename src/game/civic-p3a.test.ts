// Gemeindebauten P3a (migration 0155): stage data, unlocking, effects and texts on the TypeScript side.
// The database rules (civic_stage_defs, civic_open, guard, rate/cap) and their agreement run in src/lib/civic-p3a.pg.test.ts.
import { describe, expect, it } from "vitest";
import {
  CIVIC,
  CIVIC_MIN_RANK,
  CIVIC_STAGES,
  civicLock,
  civicNeed,
  countsAsBuilding,
  isCivicStage,
} from "./civic";
import { sickChance, SPITAL_SICK, SPITAL2_SICK } from "./sickness";
import { resourceRates, SPITAL3_RATE, WAAGE2_STORE } from "./resources";
import { CIVIC_T } from "./lang/civic";
import type { Seed } from "./world";

const T0 = Date.UTC(2026, 10, 25),
  SUMMER = Date.UTC(2027, 6, 15, 12),
  WINTER = Date.UTC(2027, 0, 15, 12);
const seed = (bought: { item: string; at: number }[]): Seed =>
  ({
    id: "p3a-test",
    x: 500,
    y: 500,
    created_at: new Date(T0 - 864e5).toISOString(),
    user_id: null,
    bought,
  }) as unknown as Seed;

describe("P3a stage data", () => {
  it("the catalogue as decided: price, build days, rank, previous stage and material (price/200, price/300)", () => {
    expect(CIVIC_STAGES).toEqual(["spital1", "spital2", "spital3", "waage1", "waage2"]);
    expect(CIVIC.spital2).toEqual({ price: 18000, days: 35, rank: 3, after: "spital1" });
    expect(CIVIC.spital3).toEqual({ price: 22000, days: 42, rank: 3, after: "spital2" });
    expect(CIVIC.waage2).toEqual({ price: 18000, days: 21, rank: 3, after: "waage1" });
    expect(civicNeed("spital2")).toEqual({ wood: 90, stone: 60 });
    expect(civicNeed("spital3")).toEqual({ wood: 110, stone: 73 });
    expect(civicNeed("waage2")).toEqual({ wood: 90, stone: 60 });
    // stage 1 unchanged
    expect(CIVIC.spital1).toEqual({ price: 10000, days: 21, rank: 2, after: null });
    expect(CIVIC.waage1).toEqual({ price: 12000, days: 14, rank: 2, after: null });
    expect(CIVIC_MIN_RANK).toBe(2);
  });

  it("a later stage opens from Kleinstadt once the previous stage stands — never earlier", () => {
    const none = seed([]);
    expect(civicLock(none, "spital1", 2, T0)).toBeNull();
    expect(civicLock(none, "spital2", 5, T0)).toEqual({ after: "spital1" });
    const s1 = seed([{ item: "spital1", at: T0 }]);
    expect(civicLock(s1, "spital2", 2, T0)).toEqual({ rank: 3 }); // Dorf is not enough
    expect(civicLock(s1, "spital2", 3, T0)).toBeNull();
    expect(civicLock(s1, "spital2", 3, T0 - 1)).toEqual({ after: "spital1" }); // marker dated in the future
    expect(civicLock(s1, "spital3", 3, T0)).toEqual({ after: "spital2" });
    const s2 = seed([
      { item: "spital1", at: T0 },
      { item: "spital2", at: T0 },
    ]);
    expect(civicLock(s2, "spital3", 3, T0)).toBeNull(); // no Handelsstadt needed
    expect(civicLock(seed([{ item: "waage1", at: T0 }]), "waage2", 3, T0)).toBeNull();
    expect(civicLock(none, "waage2", 3, T0)).toEqual({ after: "waage1" });
  });

  it("every stage counts once as a building by its marker; its money rows never", () => {
    for (const s of CIVIC_STAGES) {
      expect(isCivicStage(s)).toBe(true);
      expect(countsAsBuilding(s)).toBe(true);
      expect(countsAsBuilding(`${s}:r1`)).toBe(false);
      expect(countsAsBuilding(`${s}:k20261201`)).toBe(false);
    }
  });
});

describe("P3a effects (from the completion marker on)", () => {
  it("Spital 2 lowers the whole sickness risk ×0.90 on top of Spital 1: together ×0.765, summer and winter", () => {
    expect(SPITAL_SICK * SPITAL2_SICK).toBeCloseTo(0.765, 12);
    for (const at of [SUMMER, WINTER]) {
      const base = sickChance(seed([]), at);
      const one = sickChance(seed([{ item: "spital1", at: T0 }]), at);
      const two = sickChance(
        seed([
          { item: "spital1", at: T0 },
          { item: "spital2", at: T0 },
        ]),
        at,
      );
      expect(one / base).toBeCloseTo(0.85, 12);
      expect(two / base).toBeCloseTo(0.765, 12);
      expect(two / one).toBeCloseTo(0.9, 12);
    }
    // not before the marker's date
    const early = seed([
      { item: "spital1", at: T0 },
      { item: "spital2", at: SUMMER + 1 },
    ]);
    expect(sickChance(early, SUMMER) / sickChance(seed([]), SUMMER)).toBeCloseTo(0.85, 12);
  });

  it("Spital 3 adds 1 wood and 0.5 stone a day; Waage 2 adds 100 storage for each", () => {
    expect(SPITAL3_RATE).toEqual({ wood: 1, stone: 0.5 });
    expect(WAAGE2_STORE).toBe(100);
    for (const site of ["grain", "workshop", "gateway"] as const) {
      const plain = resourceRates(new Set(["woodcamp", "granary"]), site);
      const farm = resourceRates(new Set(["woodcamp", "granary", "spital3"]), site);
      const crane = resourceRates(new Set(["woodcamp", "granary", "waage2"]), site);
      expect(farm.wood.rate - plain.wood.rate).toBe(1);
      expect(farm.stone.rate - plain.stone.rate).toBe(0.5);
      expect(farm.wood.cap).toBe(plain.wood.cap);
      expect(crane.wood.cap - plain.wood.cap).toBe(100);
      expect(crane.stone.cap - plain.stone.cap).toBe(100);
      expect(crane.wood.rate).toBe(plain.wood.rate);
    }
  });

  it("every language names each new stage and states its real effect (numbers as applied)", () => {
    for (const [lang, t] of Object.entries(CIVIC_T)) {
      const [n2, e2] = t.stages.spital2,
        [n3, e3] = t.stages.spital3,
        [nw, ew] = t.stages.waage2;
      expect(n2 && n3 && nw, lang).toBeTruthy();
      expect(e2, lang).toMatch(/90/);
      expect(e2, lang).toMatch(/76[.,]5/);
      expect(e3, lang).toMatch(/1/);
      expect(e3, lang).toMatch(/0[.,]5/);
      expect(ew, lang).toMatch(/100/);
      expect(t.after("X"), lang).toContain("X");
      expect(t.errors.after, lang).toBeTruthy();
    }
  });
});
