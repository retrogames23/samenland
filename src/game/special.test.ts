import { describe, expect, it } from "vitest";
import { canPlant, MAP, structureAt, specialSites, SPECIAL_BUILD, type Seed } from "./world";
import { townOf } from "./people";

function spot(): [number, number] {
  for (let y = MAP / 2; y < MAP; y += 3) for (let x = MAP / 2; x < MAP; x += 3) if (canPlant(x, y, []) === null) return [x, y];
  throw new Error("no land");
}
const [sx, sy] = spot();
const NOW = new Date(2026, 9, 27, 11, 0, 0).getTime();
const base: Seed = { id: "spec", name: "Testdorf", owner: "T", x: sx, y: sy, hue: 40, created_at: new Date(NOW - 20 * 864e5).toISOString() };

describe("bought buildings", () => {
  it("a bought school is a site first, then a finished school with a teacher", () => {
    const at = NOW - SPECIAL_BUILD / 2;
    const s: Seed = { ...base, bought: [{ item: "school", at }] };
    const [k] = [...specialSites(s).keys()];
    expect(k).toBeDefined();
    const x = k! % MAP, y = Math.floor(k! / MAP);
    expect(structureAt(x, y, [s], NOW)?.kind).toBe("school");
    expect(structureAt(x, y, [s], NOW)?.build).toBeLessThan(1);
    const later = NOW + SPECIAL_BUILD;
    expect(structureAt(x, y, [s], later)?.build).toBeUndefined();
    expect(townOf(s, [s], later).people.some((p) => p.job === "teacher")).toBe(true);
  });
  it("nothing appears before the purchase", () => {
    const s: Seed = { ...base, id: "spec2", bought: [{ item: "healer", at: NOW + 3600000 }] };
    const [k] = [...specialSites(s).keys()];
    expect(structureAt(k! % MAP, Math.floor(k! / MAP), [s], NOW)?.kind).not.toBe("infirmary");
  });
});
