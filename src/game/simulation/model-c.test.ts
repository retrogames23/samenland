import { describe, it, expect } from "vitest";
import { simulate } from "./engine";
import { BASE_LOCATIONS } from "./profiles";
import { START_TALER } from "../economy";
import { modelC, PROJECTS, LOCAL_VOLUME, TOTAL_VALUE } from "./model-c";
import { PROFILES } from "./profiles";
import type { DayRow } from "./types";

const row = (day: number, rank: number, tax: number, extra = {}): DayRow => ({ day, rank, population: 0, households: 0, balance: 0, cap: 25000, income: tax, tax,
  booked: 0, lost: 0, spent: 0, raid: 0, invested: 0, open: 0, openUnlocked: 0, ...extra });
const rows = (n: number, rank: number, tax: number) => Array.from({ length: n }, (_, i) => row(i + 1, rank, tax));
const P = PROFILES.regelmaessig;

describe("Model C", () => {
  it("catalog: 12 projects, 374,500 local, 490,000 total, no Roland or caissons", () => {
    expect(PROJECTS).toHaveLength(12);
    expect(LOCAL_VOLUME).toBe(374500); expect(TOTAL_VALUE).toBe(490000);
    for (const p of PROJECTS) {
      expect(p.stages.reduce((a, s) => a + s.localCost, 0)).toBe(p.local);
      expect(p.stages.reduce((a, s) => a + s.totalCost, 0)).toBe(p.total);
    }
    expect(JSON.stringify(PROJECTS)).not.toMatch(/Roland|Caisson/i);
  });
  it("default diversion is 0 %: tax_only without a rate changes nothing", () => {
    const m = modelC(rows(100, 5, 1000), 0, { profile: P, strategy: "tax_only" });
    expect(m.invested).toBe(0);
  });
  it("no diversion before Handelsstadt", () => {
    expect(modelC(rows(100, 3, 1000), 0, { profile: P, strategy: "tax_only", taxRate: 0.3 }).invested).toBe(0);
  });
  it("20 % diversion funds the fountain in 120 days of 1,000 tax, never overfunded", () => {
    const m = modelC(rows(130, 4, 1000), 0, { profile: P, strategy: "tax_only", taxRate: 0.2 });
    expect(m.completed[0]).toMatchObject({ key: "fountain", fundedDay: 120 });
    expect(m.manual).toBe(0);
  });
  it("surplus_only diverts no tax and keeps the reserve", () => {
    const m = modelC(rows(60, 5, 1000), 0, { profile: P, strategy: "surplus_only", taxRate: 0.3 });
    expect(m.taxToProjects).toBe(0);
    expect(m.days.every((d) => d.project === null || d.balance >= P.reserve || d.manual === 0)).toBe(true);
  });
  it("all four identities close every day", () => {
    for (const strategy of ["tax_only", "surplus_only", "hybrid"] as const) {
      const base = rows(400, 5, 3000).map((r, i) => ({ ...r, income: r.tax + (i % 7 === 0 ? 500 : 0), spent: i % 30 === 0 ? 2000 : 0, raid: i % 50 === 0 ? 300 : 0 }));
      const m = modelC(base, 50, { profile: P, strategy, taxRate: 0.1 });
      expect(m.errors).toEqual([]);
      for (const d of m.days) {
        expect(d.grossTax + d.otherIncome).toBe(d.taxToProjects + d.toChestGross);
        expect(d.toChestGross).toBe(d.booked + d.lost);
      }
    }
  });
});

describe("Model C corrected catalog", () => {
  const values = (key: string) => PROJECTS.find((p) => p.key === key)?.stages.map((s) => [s.totalCost, s.localCost, s.buildDays]);
  it("fountain: 4,000 / 8,000 / 12,000 with 14 / 21 / 30 days", () => {
    expect(values("fountain")).toEqual([[4000, 4000, 14], [8000, 8000, 21], [12000, 12000, 30]]);
  });
  it("spital: 10,000 / 18,000 / 22,000 with 21 / 35 / 42 days", () => {
    expect(values("spital")).toEqual([[10000, 10000, 21], [18000, 18000, 35], [22000, 22000, 42]]);
  });
  it("bridge: two phases with separate total and local costs, 28 / 42 days", () => {
    expect(values("bridge")).toEqual([[16000, 8000, 28], [24000, 12000, 42]]);
    expect(PROJECTS.find((p) => p.key === "bridge")).toMatchObject({ total: 40000, local: 20000 });
  });
  it("other project local costs and build times remain unchanged", () => {
    const expected = {
      waage: [[12000, 14], [18000, 21]], school: [[20000, 21], [15000, 14]],
      wall: [[25000, 28], [15000, 21], [20000, 21]], quay: [[25000, 21], [20000, 21]],
      juergen: [[15000, 14], [10000, 14]], armory: [[20000, 21], [15000, 21]],
      geleit: [[9000, 21], [9000, 21]], lock: [[6000, 14], [8000, 28], [6000, 14]],
      tagfahrt: [[7500, 21], [5000, 14]],
    };
    for (const [key, stages] of Object.entries(expected)) {
      expect(PROJECTS.find((p) => p.key === key)?.stages.map((s) => [s.localCost, s.buildDays])).toEqual(stages);
    }
    expect(PROJECTS.filter((p) => p.scope === "municipal").reduce((sum, p) => sum + p.total, 0)).toBe(304000);
    expect(PROJECTS.filter((p) => p.scope === "regional").reduce((sum, p) => sum + p.total, 0)).toBe(186000);
  });
  it("bridge funding uses only the 20,000 local share and construction takes 70 days", () => {
    const m = modelC(rows(110, 4, 1000), 0, { profile: P, strategy: "tax_only", taxRate: 0.2, order: ["bridge"] });
    expect(m.invested).toBe(20000);
    expect(m.completed).toEqual([{ key: "bridge", fundedDay: 100, doneDay: 170 }]);
  });
  it.each([["fountain", 24000, 65], ["spital", 50000, 98]] as const)("%s uses corrected construction duration", (key, local, buildDays) => {
    const fundedDay = local / 200;
    const m = modelC(rows(fundedDay, 4, 1000), 0, { profile: P, strategy: "tax_only", taxRate: 0.2, order: [key] });
    expect(m.completed).toEqual([{ key, fundedDay, doneDay: fundedDay + buildDays }]);
  });
});

describe("Model C own purchases", () => {
  const S = PROFILES.sparsam, base = { strategy: "tax_only" as const, charter: "trade" as const, way: "grain" as const };
  it("buys on its own: without income nothing is bought, no backlog appears later", () => {
    const zero = rows(30, 1, 0);
    const m = modelC(zero, 0, { profile: P, ...base });
    expect(m.spent).toBe(0); expect(m.bought).toEqual([]);
    const m2 = modelC([...zero, ...rows(5, 1, 0).map((r, i) => ({ ...r, day: 31 + i, spent: 9999 }))], 0, { profile: P, ...base });
    expect(m2.spent).toBe(0); // base r.spent is ignored completely
  });
  it("purchases keep the profile reserve and never go negative", () => {
    const m = modelC(rows(200, 3, 400), 0, { profile: P, ...base });
    expect(m.bought.length).toBeGreaterThan(0);
    for (const d of m.days) expect(d.balance).toBeGreaterThanOrEqual(0);
    const first = m.bought.find((x) => !x.item.startsWith("chest"))!;
    expect(m.days[first.day - 1]!.balance).toBeGreaterThanOrEqual(P.reserve);
  });
  it("own chest stage raises the cap only for later credits; cap is never exceeded", () => {
    const m = modelC(rows(400, 5, 2000), 0, { profile: P, ...base });
    const up = m.days.findIndex((d) => d.chest >= 1);
    expect(up).toBeGreaterThanOrEqual(0);
    expect(m.days[up]!.cap).toBe(1200); expect(m.days[up + 1]!.cap).toBe([1200, 4000, 10000, 25000][m.days[up]!.chest]);
    for (const d of m.days) expect(d.balance).toBeLessThanOrEqual(d.cap);
  });
  it("profile without chest upgrades stays at base cap", () => {
    const m = modelC(rows(200, 5, 2000), 0, { profile: { ...S, chest: false }, ...base });
    expect(m.days.every((d) => d.cap === 1200 && d.chest === 0)).toBe(true);
  });
});

describe("Model C on real 730-day base runs", () => {
  for (const key of ["regelmaessig", "optimierer"] as const) it(`${key}: no negatives, no cap overrun, ledger closes`, () => {
    const r = simulate({ profile: PROFILES[key], charter: "trade", location: BASE_LOCATIONS[0]!, days: 730 });
    for (const strategy of ["tax_only", "surplus_only", "hybrid"] as const) {
      const m = modelC(r.daily, START_TALER, { profile: PROFILES[key], strategy, taxRate: 0.2, charter: "trade", way: r.way as never });
      expect(m.errors).toEqual([]); expect(m.days).toHaveLength(730);
      for (const d of m.days) { expect(d.balance).toBeGreaterThanOrEqual(0); expect(d.balance).toBeLessThanOrEqual(d.cap); }
      expect(new Set(m.bought.map((b) => b.item)).size).toBe(m.bought.length);
    }
  }, 600_000);
});
