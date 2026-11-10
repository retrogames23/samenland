import { describe, it, expect } from "vitest";
import { householdsOf, foodCapacity, foodCatchment } from "./households";
import { townOf } from "./people";
import { residentTax, assessHomes } from "./resident-tax";
import { economyWorldAt, type EconomyWorld } from "./economy-world";
import { stageOf, effAge, type Seed, type Kind } from "./world";

const start = Date.parse("2026-01-01T00:00:00Z"), day = 86400000;
const seed = (bought: string[] = []): Seed => ({ id: "p", name: "p", owner: "L", hue: 1, x: 306, y: 420, user_id: "u", created_at: new Date(start).toISOString(), bought: bought.map(item => ({ item, at: start })) });

describe("shared occupied households", () => {
  it("taxpayers equal displayed residents, excluding visitors and the mayor", () => {
    for (const crafts of [[], ["fisher", "hunter", "granary", "dairy", "herbs", "healer"]]) for (const d of [30, 90, 365, 730]) {
      const s = seed(crafts), at = start + d * day;
      const visible = townOf(s, [s], at).people.filter(p => p.role !== "guest" && p.role !== "mayor");
      expect(residentTax(s, [s], at).population).toBe(visible.length);
      expect(householdsOf(s, [s], at).length).toBe(visible.filter(p => p.role === "head").length);
    }
  }, 20000);
  it("untended towns retain at most 32 occupied households and stay a Dorf", () => {
    const s = seed(), at = start + 730 * day;
    expect(householdsOf(s, [s], at).length).toBeLessThanOrEqual(32);
    expect(householdsOf(s, [s], at).length).toBeGreaterThanOrEqual(24);
    expect(stageOf(effAge(s, [s], at))).toBe(2);
  });
  it("winter lowers the same supply ceiling for both views without wiping out families", () => {
    const s = seed(), land = new Map<Kind, unknown[]>([["field", Array(200).fill(null)]]);
    expect(foodCapacity(s, land, Date.parse("2026-07-01"))).toBe(32);
    expect(foodCapacity(s, land, Date.parse("2026-12-15"))).toBe(32);
  });
  it("ordinary, skilled and wealthy residents are assessed at 1, 2 and 3 Taler", () => {
    // Stable estate rolls .53 and .24 at wealth 100: skilled and wealthy respectively.
    expect(assessHomes([{ home: [0, 0], kind: "hut", size: 2 }], 0)).toBe(2);
    expect(assessHomes([{ home: [1, 0], kind: "hut", size: 2 }], 100)).toBe(4);
    expect(assessHomes([{ home: [0, 9], kind: "hut", size: 2 }], 100)).toBe(6);
  });
  it("pastures feed households as fully as fields", () => {
    const s = seed(["fisher"]), at = Date.parse("2026-07-01T00:00:00Z");
    const pasture = new Map<Kind, unknown[]>([["pasture", Array(100).fill(null)]]);
    const field = new Map<Kind, unknown[]>([["field", Array(100).fill(null)]]);
    expect(foodCapacity(s, pasture, at)).toBe(36);
    expect(foodCapacity(s, pasture, at)).toBe(foodCapacity(s, field, at));
  });
  it("gardens feed households as fully as fields", () => {
    const s = seed(["fisher"]), at = Date.parse("2026-07-01T00:00:00Z");
    const garden = new Map<Kind, unknown[]>([["garden", Array(100).fill(null)]]);
    const field = new Map<Kind, unknown[]>([["field", Array(100).fill(null)]]);
    expect(foodCapacity(s, garden, at)).toBe(36);
    expect(foodCapacity(s, garden, at)).toBe(foodCapacity(s, field, at));
  });
  it("mixed slope farming keeps the existing winter penalty and untended cap", () => {
    const land = new Map<Kind, unknown[]>([["field", Array(40).fill(null)], ["garden", Array(30).fill(null)], ["pasture", Array(30).fill(null)]]);
    expect(foodCapacity(seed(["fisher"]), land, Date.parse("2026-12-15T00:00:00Z"))).toBe(foodCapacity(seed(["fisher"]), land, Date.parse("2026-10-15T00:00:00Z")));
    expect(foodCapacity(seed(), land, Date.parse("2026-07-01T00:00:00Z"))).toBe(32);
    expect(foodCapacity(seed(), new Map(), Date.parse("2026-12-15T00:00:00Z"))).toBe(24);
  });
  it("future purchases and future villages cannot alter a historical world", () => {
    const s = seed(), future = new Date(start + 100 * day).toISOString();
    const input: EconomyWorld = { seeds: [s, { ...s, id: "future", x: 330, created_at: future }], purchases: [{ seed_id: s.id, item: "fisher", created_at: future }], blessings: [], charters: [], encounters: [], roads: [], votes: [], works: [], gifts: [] };
    const old = economyWorldAt(input, start + 50 * day);
    expect(old.map(s => s.id)).toEqual(["p"]);
    expect(old[0]?.bought).toEqual([]);
    expect(economyWorldAt(input, start + 101 * day)[0]?.bought?.[0]?.item).toBe("fisher");
  });
});
describe("no founding-site penalty", () => {
  it("a hill town with sparse farmland feeds as many households as flat land of the same radius", () => {
    const s = seed(["fisher", "hunter", "granary", "dairy", "herbs", "healer"]), at = Date.parse("2026-07-01T00:00:00Z");
    const flat = new Map<Kind, unknown[]>([["field", Array(foodCatchment(23.4)).fill(null)]]);
    const hill = new Map<Kind, unknown[]>([["pasture", Array(700).fill(null)]]);
    expect(foodCapacity(s, hill, at, 23.4)).toBe(foodCapacity(s, flat, at, 23.4));
  });
  it("rich farmland above the floor still counts in full", () => {
    const s = seed(["fisher", "hunter", "granary", "dairy", "herbs", "healer"]), at = Date.parse("2026-07-01T00:00:00Z");
    const rich = new Map<Kind, unknown[]>([["field", Array(foodCatchment(10) + 80).fill(null)]]);
    expect(foodCapacity(s, rich, at, 10)).toBeGreaterThan(foodCapacity(s, new Map(), at, 10));
  });
});
