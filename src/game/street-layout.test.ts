import { describe, expect, it } from "vitest";
import { streetFront, streetHouse } from "./street-layout";
import type { Structure } from "./world";

const house: Structure = {
  kind: "farmhouse", v: 0.42,
  seed: { id: "street-test", x: 100, y: 100, name: "Test", owner: "Test", hue: 20, created_at: "2026-01-01T00:00:00Z" },
};

describe("paint-only street order for existing and new settlements", () => {
  it("groups four neighbouring farm plots into the same house family", () => {
    const road = (x: number) => x === 101;
    const kinds = [100, 101, 102, 103].map(y => streetHouse(house, 100, y, road).kind);
    expect(kinds).toEqual(["cottage", "cottage", "cottage", "cottage"]);
    expect(streetHouse(house, 100, 104, road).kind).toBe("farmhouse");
  });
  it("never mutates a household's original kind, variation, seed or construction date", () => {
    const before = structuredClone(house);
    const painted = streetHouse(house, 100, 100, x => x === 101);
    expect(painted.kind).toBe("cottage");
    expect(painted.homeKind).toBe("farmhouse");
    expect(painted.v).toBe(0.42);
    expect(painted.seed).toBe(house.seed);
    expect(house).toEqual(before);
  });
  it("keeps civic estate upgrades, tenements and community buildings unchanged", () => {
    for (const kind of ["patrician", "tenement", "badestube", "barn"] as const) {
      const s = { ...house, kind };
      expect(streetHouse(s, 100, 100, x => x === 101)).toBe(s);
    }
    const promoted: Structure = { ...house, kind: "handwerker", homeKind: "farmhouse" };
    expect(streetHouse(promoted, 100, 100, x => x === 101)).toBe(promoted);
  });
  it("recognises the rear street instead of randomly mirroring each house", () => {
    expect(streetFront(100, 100, x => x === 99)).toEqual({ axis: "x", line: 99, along: 100 });
    expect(streetFront(100, 100, (_x, y) => y === 99)).toEqual({ axis: "y", line: 99, along: 100 });
    expect(streetFront(100, 100, () => false)).toBeNull();
  });
  it("gives mixed urban homes a continuous gabled frontage without changing their records", () => {
    const kinds = ["townhouse", "fachwerk", "steinhaus", "handwerker"] as const;
    const originals = kinds.map(kind => ({ ...house, kind }));
    expect(originals.map((s, i) => streetHouse(s, 100, 100 + i, x => x === 101).kind))
      .toEqual(["townhouse2", "townhouse2", "townhouse2", "townhouse2"]);
    expect(originals.map(s => s.kind)).toEqual([...kinds]);
  });
});