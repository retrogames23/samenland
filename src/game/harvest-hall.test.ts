import { describe, it, expect } from "vitest";
import { careStage, careMissing, careFoodExtra, stepsDone, monumentChain, type Seed } from "./world";
import { winterHunger, mealNeed, serveMeals, floodFarm, boonsOf, FLOOD_FARM, HARVEST_FLOOD_FARM, WINTER_HUNGER, type Ware, type Larder } from "./goods";
import { sickChance, SICK_BASE } from "./sickness";
import * as disasters from "./disasters";
import { vi } from "vitest";

const T = Date.parse("2026-03-02T06:00:00Z"), DAY = 864e5;
const town = (items: [string, number][]): Seed => ({ id: "h1", name: "H", owner: "o", hue: 1, x: 400, y: 540, user_id: "u",
  created_at: "2025-01-01T00:00:00Z", bought: items.map(([item, at], i) => ({ item, at, ...(i ? {} : { x: 403, y: 542 }) })) } as Seed);
const steps = (n: number, extra: [string, number][] = []) => town([...extra, ...Array.from({ length: n }, (_, i) => [`harvest${i + 1}`, T + i] as [string, number])]);
const doneAt = (s: Seed, i: number) => monumentChain(s, "harvest")[i]!.done;

describe("Erntedankhalle: nur fertige Abschnitte wirken", () => {
  it("Abschnitt 1 zählt erst fertig als Versorgung im Care-Gate", () => {
    const base: [string, number][] = [["fisher", T - DAY], ["herbs", T - DAY]];
    const s = steps(1, base), d = doneAt(s, 0);
    expect(careFoodExtra(s, d - 1)).toBe(0);
    expect(careStage(s, d - 1)).toBe(3);
    expect(careFoodExtra(s, d)).toBe(1);
    expect(careStage(s, d)).toBe(4);
    expect(careMissing(s, d - 1)!.food).toBe(1);
  });
  it("Abschnitt 2: Winterbedarf 1,30 → 1,15 je Einwohner, erst fertig", () => {
    const s = steps(2), d = doneAt(s, 1);
    expect(winterHunger(s, d - 1)).toBe(WINTER_HUNGER);
    expect(mealNeed(1, winterHunger(s, d - 1), 1, false)).toBeCloseTo(1.3);
    expect(mealNeed(1, winterHunger(s, d), 1, false)).toBeCloseTo(1.15);
    expect(mealNeed(100, winterHunger(s, d), 0, false)).toBe(mealNeed(100, WINTER_HUNGER, 0, false));
  });
  it("Mangel: Produktion unter reduziertem Bedarf erzeugt keinen Überschuss", () => {
    const made = new Map<Ware, number>([["bread", 100]]);
    const r = serveMeals(made, mealNeed(120, 0.15, 1, false));
    expect(r.take.get("bread")).toBe(100);
    expect(r.left).toBeCloseTo(38);
  });
  it("Überschuss: genug Brot lässt mit Abschnitt 2 echten Rest, fed/surplus folgen", () => {
    const made = new Map<Ware, number>([["bread", 200]]);
    const before = serveMeals(made, mealNeed(160, 0.3, 1, false)), after = serveMeals(made, mealNeed(160, 0.15, 1, false));
    expect(200 - before.take.get("bread")!).toBe(0);
    expect(200 - after.take.get("bread")!).toBeCloseTo(16);
    const L = (stock: number, used: number): Larder => ({ eaters: 160, food: stock, byKind: new Map(), flows: [{ ware: "bread", stock, made: 200, used, trend: 0 }] });
    const bb = boonsOf(L(Math.round(200 - before.take.get("bread")!) , 200)), ba = boonsOf(L(Math.round(200 - after.take.get("bread")!) * 4, 184));
    expect(bb.surplus).toBe(false); expect(ba.surplus).toBe(true);
    expect(bb.fed).toBe(false); expect(ba.fed).toBe(true);
  });
  it("Krankheit: Abschnitt 3 halbiert den Winterzuschlag erst fertig, Sommer unverändert", () => {
    const W = Date.parse("2027-01-15T12:00:00Z"), S = Date.parse("2026-07-01T12:00:00Z");
    const s = steps(3), plain = town([]);
    expect(sickChance(s, S)).toBeCloseTo(sickChance(plain, S), 9);
    expect(sickChance(s, W) - SICK_BASE).toBeCloseTo((sickChance(plain, W) - SICK_BASE) / 2, 9);
    const late = town(Array.from({ length: 3 }, (_, i) => [`harvest${i + 1}`, W - 3600e3 + i] as [string, number]));
    expect(stepsDone(late, "harvest", W)).toBeLessThan(3);
    expect(sickChance(late, W)).toBeCloseTo(sickChance(plain, W), 9);
  });
  it("Flut: Erzeugung 0,3 ohne, 0,6 mit fertigem Abschnitt 3", () => {
    const spy = vi.spyOn(disasters, "floodFood").mockReturnValue(-20);
    const s = steps(3), d = doneAt(s, 2);
    expect(floodFarm(s, d - 1)).toBe(FLOOD_FARM);
    expect(floodFarm(s, d)).toBe(HARVEST_FLOOD_FARM);
    spy.mockReturnValue(0);
    expect(floodFarm(s, d)).toBe(1);
    spy.mockRestore();
  });
  it("Bauphase: bezahlt, aber nicht fertig = keine Wirkung (auch Speicherbonus)", () => {
    const s = steps(3);
    expect(stepsDone(s, "harvest", T + 10)).toBe(0);
    expect(careFoodExtra(s, T + 10)).toBe(0);
    expect(winterHunger(s, T + 10)).toBe(WINTER_HUNGER);
  });
});
