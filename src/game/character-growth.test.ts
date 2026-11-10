import { describe, it, expect } from "vitest";
import { householdsOf } from "./households";
import { townCharacter } from "./character";
import { townOf, citizensOf } from "./people";
import { rankOf } from "./rank";
import { residentTax } from "./resident-tax";
import type { Seed } from "./world";

const start = Date.parse("2026-01-01T00:00:00Z"), at = start + 730 * 864e5;
const positions = [{ x: 532, y: 124 }, { x: 364, y: 196 }, { x: 436, y: 124 }];
const towns = positions.map((p): Seed => ({ ...p, id: "compare", name: "C", owner: "L", hue: 1, user_id: "u", created_at: new Date(start).toISOString(), bought: ["fisher", "hunter", "granary", "dairy", "herbs", "healer"].map(item => ({ item, at: start })) }));
describe("730-day character foundation", () => {
  it("all three cared-for characters reach metropolis population and dwellings", () => {
    expect(towns.map(s => townCharacter(s).main)).toEqual(["grain", "workshop", "gateway"]);
    for (const s of towns) {
      const homes = householdsOf(s, [s], at), citizens = homes.reduce((n, h) => n + h.size, 0);
      expect(rankOf({ citizens, homes: homes.length, roads: 2 })).toBe(5);
    }
  });
  it("population and current tax assessment differ by no more than ten percent", () => {
    const taxes = towns.map(s => residentTax(s, [s], at));
    for (const metric of [taxes.map(t => t.population), taxes.map(t => t.assessed)]) {
      expect(Math.max(...metric) / Math.min(...metric)).toBeLessThanOrEqual(1.1);
    }
  });
  it("no character pulls more than fifteen percent ahead at day 180", () => {
    const mid = start + 180 * 864e5;
    const pops = towns.map(s => residentTax(s, [s], mid).population);
    expect(Math.max(...pops) / Math.min(...pops)).toBeLessThanOrEqual(1.15);
  });
  it("hills and coasts house their families on fewer occupied building tiles", () => {
    const counts = towns.map(s => new Set(householdsOf(s, [s], at).map(h => h.home.join(","))).size);
    expect(counts[1]).toBeLessThan(counts[0] ?? 0);
    expect(counts[2]).toBeLessThan(counts[0] ?? 0);
  });
  it("each character renders exactly the residents assessed by the trusted evaluator", () => {
    for (const s of towns) {
      const residents = citizensOf(townOf(s, [s], at));
      expect(residents.length).toBe(residentTax(s, [s], at).population);
      expect(new Set(residents.map(p => p.id)).size).toBe(residents.length);
    }
  });
  it("neglected settlements remain below metropolis on every terrain", () => {
    for (const town of towns) {
      const s = { ...town, bought: [] }, homes = householdsOf(s, [s], at);
      expect(homes.length).toBeLessThanOrEqual(32);
      expect(rankOf({ citizens: homes.reduce((n, h) => n + h.size, 0), homes: homes.length, roads: 2 })).toBeLessThan(5);
    }
  });
});