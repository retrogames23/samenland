import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { AUSBAU_PRICE, AUSBAU_RANK, ausbauLevel, backhausGrain, herbergeWalz, granaryExtra, nextAusbau } from "./ausbau";
import { AUSBAU } from "./lang/ausbau";

const s = (...items: string[]) => ({ bought: items.map((item, i) => ({ item, at: i * 1000 })) });
const sql = readFileSync("drizzle/migrations/0124_ausbau_stufen_guard.sql", "utf8");

describe("Ausbaustufen", () => {
  it("prices: bakehouse 400/900, inn 500/1100, granary 450/1000", () => {
    expect(AUSBAU_PRICE).toEqual({ backhaus2: 400, backhaus3: 900, herberge2: 500, herberge3: 1100, granary2: 450, granary3: 1000 });
  });
  it("step 2 from Dorf, step 3 from Kleinstadt", () => {
    for (const k of Object.keys(AUSBAU_RANK)) expect(AUSBAU_RANK[k]).toBe(k.endsWith("2") ? 2 : 3);
  });
  it("database guard mirrors every price and rank", () => {
    for (const [k, p] of Object.entries(AUSBAU_PRICE)) { expect(sql).toContain(`WHEN '${k}' THEN ${p}`); expect(sql).toContain(`WHEN '${k}' THEN ${AUSBAU_RANK[k]}`); }
  });
  it("needs the base building first", () => {
    expect(nextAusbau("backhaus", [])).toBeNull();
    expect(nextAusbau("backhaus", ["backhaus"])).toBe("backhaus2");
    expect(nextAusbau("backhaus", ["backhaus", "backhaus2", "backhaus3"])).toBeNull();
    expect(ausbauLevel(s("backhaus2"), "backhaus")).toBe(0);
  });
  it("bakehouse grain 0.9 → 0.85 → 0.8", () => {
    expect(backhausGrain(s("backhaus"), 1e9)).toBe(0.9);
    expect(backhausGrain(s("backhaus", "backhaus2"), 1e9)).toBe(0.85);
    expect(backhausGrain(s("backhaus", "backhaus2", "backhaus3"), 1e9)).toBe(0.8);
  });
  it("inn journeyman chance 0.5 → 0.6 → 0.7", () => {
    expect(herbergeWalz(s("herberge"), 1e9)).toBe(0.5);
    expect(herbergeWalz(s("herberge", "herberge2", "herberge3"), 1e9)).toBe(0.7);
  });
  it("granary +60 storage per step, effect only from purchase time", () => {
    expect(granaryExtra(s("granary"), 1e9)).toBe(0);
    expect(granaryExtra(s("granary", "granary2", "granary3"), 1e9)).toBe(120);
    expect(granaryExtra(s("granary", "granary2"), 500)).toBe(0);
  });
  it("texts exist in all eight languages", () => {
    for (const t of Object.values(AUSBAU)) for (const k of Object.keys(AUSBAU_PRICE)) expect(t.steps[k]![0].length).toBeGreaterThan(0);
    expect(Object.keys(AUSBAU)).toHaveLength(8);
  });
});
