import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ITEMS, MONUMENT_RANK, CHEST_STAGE, RANK_STAGE, TITLE_STAGE, needRankOf, rankAllows, nextMonumentStep, attributes } from "./economy";
import { ITEM_RANK } from "./disasters";
import { MONUMENT_KEYS, monumentProgress, monumentDone, specialBuild, specialDone, monumentSteps, type Seed } from "./world";
import { workDone } from "./time";

const sql = readFileSync("drizzle/migrations/0104_monument_steps_no_wait.sql", "utf8");
const T0 = Date.parse("2026-03-02T05:00:00Z");
const belfry = (ats: number[]): Seed => ({ id: "b", name: "B", owner: "o", x: 500, y: 500, hue: 0, created_at: "2025-01-01T00:00:00Z",
  bought: ats.map((at, i) => ({ item: `belfry${i + 1}`, at })) });

describe("Phase 1: settlement rank is the only purchase gate", () => {
  it("a 10-hour-old town on Kleinstadt (rank 3) may buy a rank-3 building", () => {
    expect(rankAllows("school", 3)).toBe(true);
    expect(rankAllows("belfry1", 3)).toBe(true);
  });
  it("a two-year-old Dorf (rank 2) may not buy a rank-3 building", () => {
    expect(rankAllows("school", 2)).toBe(false);
    expect(rankAllows("theater1", 2)).toBe(false);
  });
  it("start and guild buildings stay buyable from founding (rank 0)", () => {
    for (const it of ["herbs", "hunter", "fisher", "markethall", "guildhall", "library", "dairy"]) expect(needRankOf(it)).toBe(0);
  });
  it("UI rank needs equal the database guard's need_rank", () => {
    const block = sql.slice(sql.indexOf("need_rank := CASE NEW.item"), sql.indexOf("IF mkey IS NOT NULL AND mstep = 1"));
    const db = Object.fromEntries([...block.matchAll(/WHEN '(\w+)' THEN (\d)/g)].map((m) => [m[1]!, +m[2]!]));
    const keys = [...Object.keys(ITEMS), ...Object.keys(CHEST_STAGE), ...Object.keys(RANK_STAGE), ...Object.keys(TITLE_STAGE)];
    for (const k of keys) expect([k, needRankOf(k)]).toEqual([k, db[k] ?? 0]);
    const mon = sql.slice(sql.indexOf("need_rank := CASE mkey"));
    const dbm = Object.fromEntries([...mon.slice(0, mon.indexOf("END;")).matchAll(/WHEN '(\w+)' THEN (\d)/g)].map((m) => [m[1]!, +m[2]!]));
    for (const k of MONUMENT_KEYS) expect([k, MONUMENT_RANK[k]]).toEqual([k, dbm[k] ?? 3]);
    for (const k of Object.keys(ITEM_RANK)) expect(k in ITEMS).toBe(true);
  });
});

describe("Phase 1: monument steps", () => {
  it("next steps need no waiting time in the guard", () => {
    expect(sql).not.toMatch(/interval '3 hours'/);
    expect(sql).toMatch(/item = prev\) THEN RAISE EXCEPTION 'previous step open'/);
  });
  it("a step cannot be paid twice", () => expect(sql).toMatch(/item = NEW\.item\) THEN RAISE EXCEPTION 'step already paid'/));
  it("a later step is offered only after its predecessor", () => {
    expect(nextMonumentStep([], "belfry")).toBe("belfry1");
    expect(nextMonumentStep(["belfry1"], "belfry")).toBe("belfry2");
  });
  it("paying all four belfry steps at once does not jump the site ahead", () => {
    const s = belfry([T0, T0 + 1000, T0 + 2000, T0 + 3000]);
    expect(monumentProgress(s, T0 + 4000)).toBeLessThan(0.01);
    const B = specialBuild(s);
    const one = workDone(T0, B);
    expect(monumentProgress(s, one)).toBeCloseTo(0.25, 2);
    expect(monumentProgress(s, workDone(T0, 4 * B) - 3.6e6)).toBeLessThan(1);
    expect(monumentProgress(s, workDone(T0, 4 * B) + 60000)).toBe(1);
  });
  it("monument bonuses wait for physical completion", () => {
    const s = belfry([T0, T0 + 1, T0 + 2, T0 + 3]);
    const buys = monumentSteps("belfry").map((item, i) => ({ id: `${i}`, seed_id: "b", item, cost: 0, created_at: new Date(T0).toISOString() }));
    const done = monumentDone(s, [s], "belfry")!;
    expect(done).toBeGreaterThan(specialDone(s, [s], T0 + 3));
    expect(monumentProgress(s, done - 3.6e6)).toBeLessThan(1);
    const before = attributes(s, [s], buys, done - 3.6e6).wealth, after = attributes(s, [s], buys, done + 2 * 864e5).wealth;
    expect(after).toBeGreaterThan(before);
  });
  it("ordinary bought buildings keep their build time", () => {
    const s = belfry([]);
    expect([workDone(T0, specialBuild(s, true)), workDone(T0, specialBuild(s, false))]).toContain(specialDone(s, [s], T0));
  });
});
