import { describe, it, expect } from "vitest";
import * as W from "./world";
import { monumentChain, schuettingDone, exchangeMerchants, transitShare, tradeCapOf, softTrade, TRADE_CEIL_MAX, EXCHANGE_CEIL, hubBonus, type Seed } from "./world";
import { townOf } from "./people";
import { prosperityAt, PRESTIGE_BONUS } from "./prosperity";

const T = Date.parse("2026-03-02T06:00:00Z");
const base: Seed = { id: "ex", name: "E", owner: "o", hue: 1, x: 400, y: 540, user_id: "u", created_at: "2025-01-01T00:00:00Z" } as Seed;
const town = (n: number, extra: [string, number][] = [], id = "ex"): Seed => ({ ...base, id: `${id}-${n}-${extra.length}`,
  bought: [...extra, ...Array.from({ length: n }, (_, i) => [`exchange${i + 1}`, T + i] as [string, number])]
    .map(([item, t]) => ({ item, at: t, ...(item === "exchange1" ? { x: base.x + 2, y: base.y + 1 } : {}) })) });
const done = (s: Seed, i: number) => monumentChain(s, "exchange")[i]!.done;
const merchantsAt = (s: Seed, t: number) => { const u = W.specialTile(s, "exchange"); return townOf(s, [s], t).people.filter((p) => p.job === "merchant" && p.work?.[0] === u?.[0] && p.work?.[1] === u?.[1]).length; };

describe("Schütting: alle Stufen erst nach Fertigstellung", () => {
  it("bloße Bezahlung aktiviert nichts", () => {
    const s = town(4);
    expect(schuettingDone(s, T + 10)).toBe(0);
    expect(transitShare(s, T + 10)).toBe(0.75);
    expect(exchangeMerchants(s, T + 10)).toBe(0);
    expect(tradeCapOf(s, T + 10)).toBe(tradeCapOf(town(0), T + 10));
  });
  it("Stufe 1: keine Wirkung", () => {
    const s = town(1), d = done(s, 0);
    expect(schuettingDone(s, d)).toBe(1);
    expect(transitShare(s, d)).toBe(0.75);
    expect(exchangeMerchants(s, d)).toBe(0);
  });
  it("Transit 0,75 / 0,80 / 0,85 zu den Fertigstellungszeitpunkten", () => {
    const s = town(4);
    expect(transitShare(s, done(s, 1) - 1)).toBe(0.75);
    expect(transitShare(s, done(s, 1))).toBe(0.8);
    expect(transitShare(s, done(s, 3) - 1)).toBe(0.8);
    expect(transitShare(s, done(s, 3))).toBe(0.85);
  });
  it("Händler: 0 vor Stufe 2, 2 nach Stufe 2, genau 3 nach Stufe 4", () => {
    const s = town(4);
    expect(exchangeMerchants(s, done(s, 1) - 1)).toBe(0);
    expect(exchangeMerchants(s, done(s, 1))).toBe(2);
    expect(exchangeMerchants(s, done(s, 2))).toBe(2);
    expect(exchangeMerchants(s, done(s, 3))).toBe(3);
  });
  it("Händlerplätze landen im Ort (höchstens 2 bzw. 3)", () => {
    const s = town(4);
    expect(merchantsAt(s, done(s, 1) - 1)).toBe(0);
    expect(merchantsAt(s, done(s, 1))).toBeLessThanOrEqual(2);
    expect(merchantsAt(s, done(s, 3) + 864e5)).toBeLessThanOrEqual(3);
  });
  it("Stufe 3: Obergrenze genau +0,05, gedeckelt auf 0,60", () => {
    const s = town(3), d = done(s, 2);
    expect(EXCHANGE_CEIL).toBe(0.05);
    expect(tradeCapOf(s, d) - tradeCapOf(s, d - 1)).toBeCloseTo(0.05);
    const rich = town(3, [["markethall", T - 1e9], ["lighthouse1", T - 1e9], ["lighthouse2", T - 1e9], ["lighthouse3", T - 1e9]], "rich");
    const r = { ...rich, charter: { path: "trade", at: T - 1e9 } } as Seed;
    expect(tradeCapOf(r, done(r, 2) + 1e9)).toBeLessThanOrEqual(TRADE_CEIL_MAX);
    expect(TRADE_CEIL_MAX).toBe(0.6);
  });
  it("Cap wirkt nur über softTrade", () => {
    const s = town(3), d = done(s, 2);
    expect(softTrade(2, tradeCapOf(s, d))).toBeGreaterThan(softTrade(2, tradeCapOf(s, d - 1)));
    expect(softTrade(0.1, tradeCapOf(s, d))).toBe(softTrade(0.1, tradeCapOf(s, d - 1)));
  });
  it("kein zusätzlicher Hub-Bonus", () => {
    const s = town(4), d = done(s, 3);
    expect(hubBonus(s)).toBe(hubBonus(town(0)));
  });
  it("deterministisch und rekursionsfrei während des Baus", () => {
    const s = town(4), mid = (done(s, 1) + done(s, 2)) / 2;
    expect(schuettingDone(s, mid)).toBe(schuettingDone(s, mid));
    expect(monumentChain(s, "exchange").map((c) => c.done)).toEqual(monumentChain(s, "exchange").map((c) => c.done));
  });
  it("Prestige 20 und Wohlstandswerke bleiben", () => {
    expect(PRESTIGE_BONUS["exchange4"]).toBe(20);
    const s = town(4), d = done(s, 3);
    expect(prosperityAt(s, d + 864e5, 100)).toBeGreaterThan(prosperityAt(town(3), d + 864e5, 100));
  });
});
