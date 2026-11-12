import { describe, it, expect } from "vitest";
import { specialSites, structureAt, MAP, type Seed } from "./world";

const T = Date.UTC(2026, 5, 1);
const base = { id: "rack", x: 300, y: 300, created_at: new Date(T - 200 * 864e5).toISOString(), user_id: "u", name: "R" } as unknown as Seed;

describe("fire order rack", () => {
  it("is placed as its own building site where the player chose", () => {
    const s = { ...base, bought: [{ item: "fireorder", at: T, x: 304, y: 302 }] } as Seed;
    expect(specialSites(s).get(302 * MAP + 304)?.kind).toBe("firerack");
  });
  it("gives way once the fire-hook shed is bought", () => {
    const s = { ...base, bought: [{ item: "fireorder", at: T, x: 304, y: 302 }, { item: "firehouse", at: T + 30 * 864e5 }] } as Seed;
    expect(structureAt(304, 302, [s], T + 10 * 864e5)?.kind).toBe("firerack");
    expect(structureAt(304, 302, [s], T + 31 * 864e5)?.kind).not.toBe("firerack");
  });
});
