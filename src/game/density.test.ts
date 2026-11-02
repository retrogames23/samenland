import { describe, it, expect } from "vitest";
import { dwellingKey, dwellingTile, dwellingSlots } from "./density";
import { foodCapacity, occupiedHomes, type HomeTile } from "./households";
import { characterFromTerrain, townCharacter } from "./character";
import { rankOf } from "./rank";
import { rollOf } from "./roll";
import type { Seed, Kind } from "./world";
import type { Person } from "./people";

describe("character dwellings", () => {
  it("hills support two and then three families in suitable houses", () => {
    expect(dwellingSlots("workshop", "steinhaus", 13)).toBe(1);
    expect(dwellingSlots("workshop", "steinhaus", 14)).toBe(2);
    expect(dwellingSlots("workshop", "steinhaus", 24)).toBe(3);
    expect(dwellingSlots("workshop", "hut", 40)).toBe(1);
  });
  it("coasts and hills stack three floors, plains stop at two", () => {
    expect(dwellingSlots("gateway", "townhouse", 16)).toBe(2);
    expect(dwellingSlots("gateway", "townhouse", 26)).toBe(3);
    expect(dwellingSlots("grain", "townhouse", 15)).toBe(1);
    expect(dwellingSlots("grain", "townhouse", 40)).toBe(2);
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
  it("430 occupied dwellings allow a metropolis even when housed on fewer tiles", () => {
    expect(rankOf({ citizens: 1500, homes: 430, roads: 2 })).toBe(5);
    expect(rankOf({ citizens: 1500, homes: 429, roads: 2 })).toBe(4);
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
    const homes = occupiedHomes(town, [town], at, new Map<Kind, HomeTile[]>([["steinhaus", tiles]]));
    expect(homes.filter(h => !h.unit).map(h => h.home)).toEqual(tiles);
    expect(homes.some(h => h.unit === 1)).toBe(true);
    expect(homes.length).toBeLessThanOrEqual(foodCapacity(town, new Map(), at, 24));
  });
});