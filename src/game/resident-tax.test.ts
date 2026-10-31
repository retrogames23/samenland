import { describe, it, expect } from "vitest";
import { householdsOf, foodCapacity } from "./households";
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
    expect(foodCapacity(s, land, Date.parse("2026-12-15"))).toBe(24);
  });
  it("ordinary, skilled and wealthy residents are assessed at 1, 2 and 3 Taler", () => {
    // Stable estate rolls .599 and .1276 at wealth 100: skilled and wealthy respectively.
    expect(assessHomes([{ home: [0, 0], kind: "hut", size: 2 }], 0)).toBe(2);
    expect(assessHomes([{ home: [1, 0], kind: "hut", size: 2 }], 100)).toBe(4);
    expect(assessHomes([{ home: [0, 2], kind: "hut", size: 2 }], 100)).toBe(6);
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