import { describe, it, expect } from "vitest";
import * as W from "./world";
import { monumentChain, operaDone, operaMerchants, tradeCapOf, tradeFactor, townCharacter, effAge, WAY_COMPLEMENT, OPERA_TRADE, TRADE_CEIL_MAX, type Seed } from "./world";
import { townOf } from "./people";

const T = Date.parse("2026-03-02T06:00:00Z");
const base: Seed = { id: "op", name: "O", owner: "o", hue: 1, x: 400, y: 540, user_id: "u", created_at: "2025-01-01T00:00:00Z" } as Seed;
const town = (n: number, extra: [string, number][] = [], id = "op"): Seed => ({ ...base, id: `${id}-${n}-${extra.length}`,
  bought: [...extra, ...Array.from({ length: n }, (_, i) => [`opera${i + 1}`, T + i] as [string, number])]
    .map(([item, t]) => ({ item, at: t, ...(item === "opera1" ? { x: base.x + 2, y: base.y + 1 } : {}) })) });
const done = (s: Seed, i: number) => monumentChain(s, "opera")[i]!.done;
const jobsAt = (s: Seed, t: number, job: string) => { const u = W.specialTile(s, "opera"); return townOf(s, [s], t).people.filter((p) => p.job === job && p.work?.[0] === u?.[0] && p.work?.[1] === u?.[1]).length; };
const partner = (same: boolean, s: Seed): Seed => {
  const main = townCharacter(s).main;
  for (let x = 300; x < 520; x += 7) for (let y = 440; y < 640; y += 7) {
    const o = { ...base, id: `p${x}-${y}`, x, y, bought: [] } as Seed;
    if ((townCharacter(o).main === main) === same && W.buildable(x, y)) return o;
  }
  throw new Error("no partner");
};

describe("Artushof: Rekursion und Determinismus", () => {
  it("effAge über die volle Kette ohne Stack Overflow, deterministisch", () => {
    const s = town(4), o = partner(false, s), t = done(s, 3) + 1;
    const a = effAge(s, [s, o], t), b = effAge(s, [s, o], t);
    expect(Number.isFinite(a)).toBe(true);
    expect(a).toBe(b);
    expect(operaDone(s, t)).toBe(4);
    expect(operaDone(s, t)).toBe(4); // Sperre wieder freigegeben
  });
  it("ohne Kauf 0", () => expect(operaDone(town(0), T + 1e12)).toBe(0));
});

describe("Artushof: Bezahlung vs. Fertigstellung", () => {
  it("bloße Bezahlung aktiviert nichts", () => {
    const s = town(4), o = partner(false, s);
    expect(operaDone(s, T + 10)).toBe(0);
    expect(operaMerchants(s, T + 10)).toBe(0);
    expect(tradeCapOf(s, T + 10)).toBe(tradeCapOf(town(0), T + 10));
    expect(tradeFactor(s, o, T + 10)).toBe(tradeFactor(town(0), o, T + 10));
  });
  it("Stufe 2 nur Kaufleute, keine Handelswirkung", () => {
    const s = town(4), o = partner(false, s), d = done(s, 1);
    expect(operaMerchants(s, d - 1)).toBe(0);
    expect(operaMerchants(s, d)).toBe(2);
    expect(operaMerchants(s, done(s, 3) + 1)).toBe(2);
    expect(tradeCapOf(s, d)).toBe(tradeCapOf(town(0), d));
    expect(tradeFactor(s, o, d)).toBe(tradeFactor(town(0), o, d));
  });
});

describe("Artushof: Handel", () => {
  it("Stufe 3 erhöht WAY_COMPLEMENT nur bei anderer Ausrichtung, Stufe 4 OPERA_TRADE", () => {
    const s = town(4), z = town(0), d3 = done(s, 2), d4 = done(s, 3);
    const diff = partner(false, s), same = partner(true, s);
    const cap = 1.5;
    const raw = (o: Seed, t: number) => tradeFactor(z, o, t);
    expect(tradeFactor(s, diff, d3)).toBeCloseTo(Math.min(cap, raw(diff, d3) + WAY_COMPLEMENT), 10);
    expect(tradeFactor(s, same, d3)).toBeCloseTo(raw(same, d3), 10);
    expect(tradeFactor(s, same, d4)).toBeCloseTo(Math.min(cap, raw(same, d4) + OPERA_TRADE), 10);
    expect(tradeFactor(s, diff, d4)).toBeCloseTo(Math.min(cap, raw(diff, d4) + WAY_COMPLEMENT + OPERA_TRADE), 10);
  });
  it("Obergrenze: +0,03 auf Stufe 3, +0,05 auf Stufe 4, ohne Artushof unverändert", () => {
    const s = town(4), z = town(0);
    expect(TRADE_CEIL_MAX).toBe(0.6);
    expect(tradeCapOf(s, done(s, 2))).toBeCloseTo(Math.min(0.63, tradeCapOf(z, done(s, 2)) + 0.03), 10);
    expect(tradeCapOf(s, done(s, 3))).toBeCloseTo(Math.min(0.65, tradeCapOf(z, done(s, 3)) + 0.05), 10);
  });
  it("mit voller Kappe (Charter, Markthalle, Schütting) höchstens 0,63 / 0,65", () => {
    const t0 = T - 1e9;
    const ex: [string, number][] = [["markethall", t0], ["exchange1", t0], ["exchange2", t0 + 1], ["exchange3", t0 + 2]];
    const mk = (n: number) => ({ ...town(n, ex, "full"), charter: { path: "trade", at: t0 } } as Seed);
    const s = mk(4), z = mk(0), late = done(s, 3) + 1e9;
    expect(tradeCapOf(z, late)).toBeLessThanOrEqual(0.6);
    expect(tradeCapOf(s, done(s, 2))).toBeLessThanOrEqual(0.63);
    expect(tradeCapOf(s, late)).toBeLessThanOrEqual(0.65);
    expect(tradeCapOf(s, late)).toBeCloseTo(Math.min(0.65, tradeCapOf(z, late) + 0.05), 10);
  });
});

describe("Artushof: Arbeitsplätze", () => {
  it("keine Crafter am Artushof, Kaufleute höchstens 2 und nie vor Stufe 2", () => {
    const s = town(4);
    for (const t of [done(s, 1) - 1, done(s, 1), done(s, 3) + 864e5]) expect(jobsAt(s, t, "crafter")).toBe(0);
    expect(jobsAt(s, done(s, 1) - 1, "merchant")).toBe(0);
    expect(jobsAt(s, done(s, 3) + 864e5, "merchant")).toBeLessThanOrEqual(2);
  });
});
