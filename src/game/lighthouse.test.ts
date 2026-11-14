import { describe, it, expect } from "vitest";
import { careFoodExtra, careStage, seaDist, tradeCapOf, tradeFactor, monumentChain, stepsDone, MIN_SEED_DISTANCE, type Seed } from "./world";
import { fishWinter, LIGHTHOUSE_WINTER_FISH } from "./goods";
import { townCharacter } from "./character";
import { prosperityAt } from "./prosperity";
import * as W from "./world";

const T = Date.parse("2026-03-02T06:00:00Z"), DAY = 864e5;
let coast: Seed | undefined, land: Seed | undefined;
for (let y = 60; y < 940 && !(coast && land); y += 15) for (let x = 60; x < 940; x += 15) {
  const c = { id: `p${x}_${y}`, name: "P", owner: "o", hue: 1, x, y, user_id: "u", created_at: "2025-01-01T00:00:00Z" } as Seed;
  if (townCharacter(c).main === "gateway") coast ??= c; else land ??= c;
}
const town = (at: Seed, n: number, extra: [string, number][] = []): Seed => ({ ...at, id: `lh-${at.id}-${n}-${extra.length}`,
  bought: [...extra, ...Array.from({ length: n }, (_, i) => [`lighthouse${i + 1}`, T + i] as [string, number])]
    .map(([item, t], i) => ({ item, at: t, ...(i ? {} : { x: at.x + 2, y: at.y + 1 }) })) });
const done = (s: Seed, i: number) => monumentChain(s, "lighthouse")[i]!.done;

describe("Leuchtturm: alle Stufen erst nach Fertigstellung", () => {
  it("Testorte gefunden", () => { expect(coast && land).toBeTruthy(); });
  it("Stufe 1: Winterfischerei 0,5 → 0,8, Sommer unverändert", () => {
    expect(fishWinter(false)).toBe(0.5);
    expect(fishWinter(true)).toBe(LIGHTHOUSE_WINTER_FISH);
    expect(LIGHTHOUSE_WINTER_FISH).toBe(0.8);
  });
  it("Stufe 1: genau +1 Care-Food, erst fertig, ohne Rekursion", () => {
    const s = town(coast!, 1, [["fisher", T - DAY], ["herbs", T - DAY]]), d = done(s, 0);
    expect(careFoodExtra(s, d - 1)).toBe(0);
    expect(careFoodExtra(s, d)).toBe(1);
    expect(careStage(s, d)).toBeGreaterThanOrEqual(careStage(s, d - 1));
  });
  it("Stufe 1 + Erntedankhalle zählen zusammen genau 2", () => {
    const s = town(coast!, 1, [["harvest1", T - 2 * DAY]]);
    const d = Math.max(done(s, 0), monumentChain(s, "harvest")[0]!.done);
    expect(careFoodExtra(s, d)).toBe(2);
  });
  it("Stufe 2: 70 → 55 Kacheln nur für eigene Küstenstadt, erst fertig", () => {
    const s = town(coast!, 2), d = done(s, 1);
    expect(seaDist(s, land!, 70, d - 1)).toBe(70);
    expect(seaDist(s, land!, 70, d)).toBe(55);
    expect(seaDist(s, land!, MIN_SEED_DISTANCE, d)).toBe(MIN_SEED_DISTANCE);
    const l = town(land!, 2);
    expect(seaDist(l, coast!, 70, done(l, 1))).toBe(70);
  });
  it("Stufe 3: Handelslimit +0,05 erst fertig", () => {
    const s = town(coast!, 3), d = done(s, 2), b = tradeCapOf(town(coast!, 0), d);
    expect(tradeCapOf(s, d - 1) - b).toBeCloseTo(0);
    expect(tradeCapOf(s, d) - b).toBeCloseTo(0.05);
    expect(W.LIGHTHOUSE_TRANSIT).toBe(1.2);
  });
  it("alter Handelsfaktor-Bonus wirkt nicht mehr", () => {
    const s = town(coast!, 3), d = done(s, 2);
    expect(tradeFactor(s, coast!, d)).toBe(tradeFactor(town(coast!, 0), coast!, d));
    expect("LIGHTHOUSE_TRADE" in W).toBe(false);
  });
  it("zwei zivile Werke erst bei vollständigem Leuchtturm", () => {
    const s = town(coast!, 3), d = done(s, 2), z = town(coast!, 0);
    expect(prosperityAt(s, d - 1, 500)).toBeCloseTo(prosperityAt(z, d - 1, 500));
    expect(prosperityAt(s, d, 500)).toBeGreaterThan(prosperityAt(z, d, 500));
    expect(stepsDone(s, "lighthouse", d)).toBe(3);
  });
});
