import { describe, it, expect } from "vitest";
import { dwellingKey, dwellingTile, dwellingSlots } from "./density";
import { foodCapacity, occupiedHomes, type HomeTile } from "./households";
import { characterFromTerrain, townCharacter } from "./character";
import { rankOf } from "./rank";
import { rollOf } from "./roll";
import type { Seed, Kind } from "./world";
import type { Person } from "./people";

describe("character dwellings", () => {
  it("grain keeps the shared floors: second from radius 18, third from 30", () => {
    for (const kind of ["townhouse", "fachwerk", "steinhaus", "patrician", "tenement"] as Kind[]) {
      expect(dwellingSlots("grain", kind, 17)).toBe(1);
      expect(dwellingSlots("grain", kind, 18)).toBe(2);
      expect(dwellingSlots("grain", kind, 30)).toBe(3);
      expect(dwellingSlots("grain", kind, 45)).toBe(3);
    }
    expect(dwellingSlots("grain", "hut", 40)).toBe(1);
    expect(dwellingSlots("workshop", "farmhouse", 40)).toBe(1);
    expect(dwellingSlots("gateway", "hut", 40)).toBe(1);
  });
  it("workshop stone and craft houses stack earlier: second from 12, third from 24", () => {
    for (const kind of ["steinhaus", "handwerker", "tenement"] as Kind[]) {
      expect(dwellingSlots("workshop", kind, 11)).toBe(1);
      expect(dwellingSlots("workshop", kind, 12)).toBe(2);
      expect(dwellingSlots("workshop", kind, 24)).toBe(3);
      expect(dwellingSlots("workshop", kind, 40)).toBe(3);
    }
    expect(dwellingSlots("workshop", "cottage", 12)).toBe(1);
    expect(dwellingSlots("workshop", "patrician", 40)).toBe(3);
  });
  it("gateway merchant houses and tenements carry a fourth family from radius 30", () => {
    for (const kind of ["patrician", "tenement"] as Kind[]) {
      expect(dwellingSlots("gateway", kind, 29)).toBe(2);
      expect(dwellingSlots("gateway", kind, 30)).toBe(4);
    }
    expect(dwellingSlots("gateway", "cottage", 40)).toBe(3);
    expect(dwellingSlots("gateway", "villa", 40)).toBe(3);
  });
  it("no way ever has fewer floors than the shared rule", () => {
    for (const way of ["grain", "workshop", "gateway"] as const) for (const kind of ["cottage", "townhouse", "steinhaus", "handwerker", "patrician", "villa", "tenement", "hut"] as Kind[]) for (let r = 0; r <= 50; r++)
      expect(dwellingSlots(way, kind, r)).toBeGreaterThanOrEqual(dwellingSlots("grain", kind, r));
  });
  it("keeps old IDs and decodes every floor to the real ground tile", () => {
    expect(dwellingKey(306, 420)).toBe(313764);
    expect(new Set([0, 1, 2].map(u => dwellingKey(306, 420, u))).size).toBe(3);
    expect(dwellingTile(dwellingKey(306, 420, 2))).toEqual([306, 420]);
  });
  it("counts families in separate apartments separately in the roll", () => {
    const people = [0, 1, 2].map(unit => ({ id: dwellingKey(4, 4, unit) * 8, hh: dwellingKey(4, 4, unit), home: [4, 4], role: "head", last: "Weber", age: 30, job: "farmer" } as Person));
    expect(rollOf(people).households.length).toBe(3);
  });
  it("700 occupied dwellings allow a Hansestadt even when housed on fewer tiles", () => {
    expect(rankOf({ citizens: 2500, homes: 700, roads: 2 })).toBe(5);
    expect(rankOf({ citizens: 2200, homes: 599, roads: 2 })).toBe(4);
  });
});
describe("equal food catchments", () => {
  const at = Date.parse("2026-07-01T00:00:00Z");
  const s: Seed = { id: "density", name: "D", owner: "L", hue: 1, x: 306, y: 420, user_id: "u", created_at: "2026-01-01T00:00:00Z", bought: ["fisher", "hunter", "granary", "dairy", "herbs", "healer"].map(item => ({ item, at: 0 })) };
  it("all terrain characters feed the same population at the same growth size", () => {
    const capacities = (["grass", "hill", "water"] as const).map(t => {
      expect(characterFromTerrain([t]).main).toBe(t === "grass" ? "grain" : t === "hill" ? "workshop" : "gateway");
      return foodCapacity(s, new Map(), at, 24);
    });
    expect(capacities).toEqual([400, 400, 400]);
  });
  it("new floors never evict ground-floor families or exceed food support", () => {
    let location = { x: 0, y: 0 };
    outer: for (let y = 100; y < 900; y += 24) for (let x = 100; x < 900; x += 24) if (townCharacter({ x, y }).main === "workshop") { location = { x, y }; break outer; }
    expect(townCharacter(location).main).toBe("workshop");
    const town = { ...s, ...location };
    const tiles: HomeTile[] = Array.from({ length: 8 }, (_, i) => [town.x + i, town.y]);
    const late = Date.parse("2026-11-01T00:00:00Z");
    const homes = occupiedHomes(town, [town], late, new Map<Kind, HomeTile[]>([["steinhaus", tiles]]));
    expect(homes.filter(h => !h.unit).map(h => h.home)).toEqual(tiles);
    expect(homes.some(h => h.unit === 1)).toBe(true);
    expect(homes.length).toBeLessThanOrEqual(foodCapacity(town, new Map(), late, 24));
  });
});