import { describe, it, expect } from "vitest";
import { specialSites, MAP, type Seed } from "./world";

describe("2×2 ensembles", () => {
  it("a bought Beginenhof reserves its front tile plus the three tiles behind it", () => {
    const s = { id: "foot", x: 600, y: 600, name: "T", created_at: "2026-01-01T00:00:00Z", hue: 0, bought: [{ item: "beginen", at: 0, x: 605, y: 604 }] } as unknown as Seed;
    const m = specialSites(s);
    expect(m.get(604 * MAP + 605)?.kind).toBe("beginenhof");
    for (const [x, y] of [[604, 604], [605, 603], [604, 603]] as const) expect(m.get(y * MAP + x)?.kind).toBe("square");
  });
  it("a backhaus still takes a single tile", () => {
    const s = { id: "foot2", x: 600, y: 600, name: "T", created_at: "2026-01-01T00:00:00Z", hue: 0, bought: [{ item: "backhaus", at: 0, x: 605, y: 604 }] } as unknown as Seed;
    expect(specialSites(s).size).toBe(1);
  });
});

describe("2×2 placement checks the whole footprint", () => {
  it("refuses a Beginenhof whose back tile already holds a house", async () => {
    const { canPlaceSpecial, structureAt } = await import("./world");
    const now = Date.parse("2026-11-07T12:00:00Z");
    const s = { id: "scale-collision", x: 600, y: 600, name: "T", created_at: new Date(now - 20 * 86400000).toISOString(), hue: 0, bought: [] } as unknown as Seed;
    const back = structureAt(599, 593, [s], now)?.kind;
    if (back && !["field", "pasture", "garden"].includes(back)) expect(canPlaceSpecial("beginen", 600, 593, s, [s], now)).not.toBeNull();
    // every accepted spot keeps all four tiles free of standing buildings
    for (let y = 594; y <= 606; y++) for (let x = 594; x <= 606; x++) {
      if (canPlaceSpecial("beginen", x, y, s, [s], now) !== null) continue;
      for (const [i, j] of [[-1, 0], [0, -1], [-1, -1]] as const) { const k = structureAt(x + i, y + j, [s], now)?.kind; expect(!k || ["field", "pasture", "garden"].includes(k)).toBe(true); }
    }
  });
});
