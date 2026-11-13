import { describe, it, expect } from "vitest";
import { foodCapacity, townTiles, householdsOf } from "./households";
import { townCharacter } from "./character";
import { boonsOf, type Larder } from "./goods";
import { attributes } from "./economy";
import type { Seed } from "./world";

// Block 1.3: real supply (goods), household capacity (households) and care gate (world) stay separate.
const start = Date.parse("2026-01-01T00:00:00Z");
const mk = (x: number, y: number): Seed => ({ x, y, id: "sup", name: "S", owner: "L", hue: 1, user_id: "u", created_at: new Date(start).toISOString(), bought: [] });
const plain = mk(532, 124);
const larder = (food: number): Larder => ({ food, eaters: 20, flows: [] } as unknown as Larder);

describe("supply, capacity and care gate are separate", () => {
  it("an empty larder removes no existing household", () => {
    const at = start + 120 * 864e5, base = householdsOf(plain, [plain], at);
    const empty = attributes(plain, [plain], [], at, 0, boonsOf(larder(0)));
    const full = attributes(plain, [plain], [], at, 0, boonsOf(larder(60)));
    expect(boonsOf(larder(0)).supply).toBe(0);
    expect(empty.food).toBeLessThan(full.food); // the larder only moves the shown supply value
    expect(householdsOf(plain, [plain], at)).toEqual(base);
    expect(empty.wealth).toBe(full.wealth);
  });
  it("winter does not lower the permanent household capacity", () => {
    const { byKind } = townTiles(plain, [plain], start + 200 * 864e5);
    const summer = Date.parse("2026-07-15T12:00:00Z"), winter = Date.parse("2027-01-15T12:00:00Z");
    for (const r of [6, 12, 18]) expect(foodCapacity(plain, byKind, winter, r)).toBe(foodCapacity(plain, byKind, summer, r));
  });
  it("the three founding ways get the same base capacity under equal conditions", () => {
    const towns = [mk(532, 124), mk(364, 196), mk(436, 124)];
    expect(towns.map((s) => townCharacter(s).main)).toEqual(["grain", "workshop", "gateway"]);
    for (const r of [6, 12, 18, 30]) {
      const caps = towns.map((s) => foodCapacity(s, new Map(), start, r));
      expect(new Set(caps).size).toBe(1);
    }
  });
});
