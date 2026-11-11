import { describe, it, expect } from "vitest";
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
    for (const p of PROJECTS) expect(p.stages.reduce((a, s) => a + s.cost, 0)).toBe(p.local);
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
